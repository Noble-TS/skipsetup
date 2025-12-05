import { NextRequest } from "next/server";
import { auth } from "~/server/better-auth/config";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/stripe";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        image: true,
        stock: true,
        category: true,
        stripeProductId: true,
        stripePriceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({
      success: true,
      products: products.map((p) => ({
        ...p,
        price: p.price / 100,
        category: p.category || "Uncategorized",
      })),
    });
  } catch (error) {
    console.error(" Products fetch error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch products",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, price, image, stock, category } =
      await request.json();

    if (!name || !price) {
      return Response.json(
        { error: "Name and price are required" },
        { status: 400 },
      );
    }

    // Create Stripe product
    const stripeProduct = await stripe.products.create({
      name,
      description,
      images: image ? [image] : [],
      metadata: {
        createdVia: "admin-dashboard",
        ...(category && { category }),
      },
    });

    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(price * 100),
      currency: "usd",
    });

    const dbProductId = `prod_${Date.now()}`;

    const dbProduct = await db.product.create({
      data: {
        id: dbProductId,
        name,
        description: description || "",
        price: Math.round(price * 100),
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id,
        image: image || "",
        stock: stock || 0,
        ...(category && { category }),
      },
    });

    return Response.json({
      success: true,
      message: "Product created successfully",
      product: {
        id: dbProduct.id,
        name: dbProduct.name,
        price: dbProduct.price / 100,
        ...(dbProduct.category && { category: dbProduct.category }),
        stripeProductId: dbProduct.stripeProductId,
        stripePriceId: dbProduct.stripePriceId,
      },
    });
  } catch (error) {
    console.error(" Product creation error:", error);

    let errorMessage = "Failed to create product";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, description, price, image, stock, category } =
      await request.json();

    if (!id || !name || !price) {
      return Response.json(
        { error: "ID, name, and price are required" },
        { status: 400 },
      );
    }

    // Find the existing product
    const existingProduct = await db.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // Update in Stripe if the product exists there
    if (existingProduct.stripeProductId) {
      try {
        await stripe.products.update(existingProduct.stripeProductId, {
          name,
          description,
          ...(image && { images: [image] }),
          metadata: {
            ...(category && { category }),
          },
        });
      } catch (stripeError) {
        console.warn(" Could not update Stripe product:", stripeError);
      }
    }

    // Update in database
    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        name,
        description: description || "",
        price: Math.round(price * 100),
        image: image || "",
        stock: stock || 0,
        ...(category !== undefined && { category }),
      },
    });

    return Response.json({
      success: true,
      message: "Product updated successfully",
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        price: updatedProduct.price / 100,
        ...(updatedProduct.category && { category: updatedProduct.category }),
        stripeProductId: updatedProduct.stripeProductId,
        stripePriceId: updatedProduct.stripePriceId,
      },
    });
  } catch (error) {
    console.error(" Product update error:", error);

    let errorMessage = "Failed to update product";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    // Find the existing product
    const existingProduct = await db.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // Archive in Stripe instead of deleting to maintain history
    if (existingProduct.stripeProductId) {
      try {
        await stripe.products.update(existingProduct.stripeProductId, {
          active: false, // Archive the product instead of deleting
        });
      } catch (stripeError) {
        console.warn(" Could not archive Stripe product:", stripeError);
      }
    }

    // Delete from database
    await db.product.delete({
      where: { id },
    });

    return Response.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(" Product deletion error:", error);

    let errorMessage = "Failed to delete product";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
