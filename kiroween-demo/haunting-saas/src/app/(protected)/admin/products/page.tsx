"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Package,
  Edit,
  Trash2,
  DollarSign,
  Image as ImageIcon,
  Tag,
  Save,
  X,
  Sparkles,
  Settings,
} from "lucide-react";

// --- SkipSetup Emerald Color Palette ---
const Colors = {
  PrimaryText: "#1f2937",
  SecondaryText: "#6b7280",
  Background: "bg-white",
  SoftEmerald: "bg-emerald-50",
  AccentEmerald: "#059669",
  AccentEmeraldDark: "#047857",
  AccentGray: "#9ca3af",
} as const;

// Predefined categories matching your shop page
const CATEGORIES = [
  "Event Packages",
  "Monetary Vouchers",
  "Customized Gifts",
  "Traditional Gifts",
  "Occasions",
  "Holidays",
] as const;

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  stock: number;
  category: string;
  stripeProductId: string;
  stripePriceId: string;
  createdAt: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    stock: "",
    category: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setMessage("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const url = editingProduct
        ? "/api/admin/products"
        : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      const bodyData = editingProduct
        ? {
            id: editingProduct.id,
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            image: formData.image,
            stock: parseInt(formData.stock) || 0,
            category: formData.category || undefined,
          }
        : {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            image: formData.image,
            stock: parseInt(formData.stock) || 0,
            category: formData.category || "Customized Gifts",
          };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(
          editingProduct
            ? "Product updated successfully!"
            : "Product created successfully!",
        );
        resetForm();
        fetchProducts();
      } else {
        setMessage(
          result.error ||
            `Failed to ${editingProduct ? "update" : "create"} product`,
        );
      }
    } catch (error) {
      setMessage(`Error ${editingProduct ? "updating" : "creating"} product`);
      console.error("Product operation error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
      stock: product.stock.toString(),
      category: product.category,
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this product? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products?id=${productId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setMessage("Product deleted successfully!");
        fetchProducts();
      } else {
        setMessage(result.error || "Failed to delete product");
      }
    } catch (error) {
      setMessage("Error deleting product");
      console.error("Delete product error:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      image: "",
      stock: "",
      category: "",
    });
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans`}
      >
        <AdminHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-t-2 border-b-2 border-emerald-600"></div>
            <p className="text-lg text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans`}
    >
      <AdminHeader />

      <main className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              <Settings className="h-4 w-4" />
              Admin Dashboard
            </div>
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              Product Management
            </h1>
            <p className="text-lg text-gray-600">
              Manage your SkipSetup product catalog
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl md:mt-0"
          >
            <Plus size={20} />
            Add New Product
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 rounded-xl p-4 ${
              message.includes("success")
                ? "border border-emerald-200 bg-emerald-100 text-emerald-800"
                : "border border-red-200 bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {/* Add/Edit Product Form */}
        {showForm && (
          <div className="mb-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={resetForm}
                className="rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                    placeholder="Premium Product Name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Price (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign
                      size={20}
                      className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400"
                    />
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      className="w-full rounded-xl border border-gray-300 py-3 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                      placeholder="95.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Category *
                  </label>
                  <div className="relative">
                    <Tag
                      size={20}
                      className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400"
                    />
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                    placeholder="100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                    placeholder="Premium product description with key features and benefits..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Image URL
                  </label>
                  <div className="relative">
                    <ImageIcon
                      size={20}
                      className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400"
                    />
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-gray-300 py-3 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Provide a direct image URL for best results
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      {editingProduct ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {editingProduct ? <Save size={16} /> : <Plus size={16} />}
                      {editingProduct ? "Update Product" : "Create Product"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg transition-all hover:shadow-2xl"
            >
              {product.image && (
                <div className="h-48 overflow-hidden bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/400";
                    }}
                  />
                </div>
              )}
              <div className="p-6">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-1 text-xl font-bold text-gray-900">
                      {product.name}
                    </h3>
                    <span className="mb-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      {product.category}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                {product.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                    {product.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Stock: {product.stock}</span>
                  <span>
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-4 flex gap-2 border-t border-gray-200 pt-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-all hover:scale-105 hover:bg-emerald-100"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-all hover:scale-105 hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && !showForm && (
          <div className="py-16 text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-600">
                <Package className="h-12 w-12" />
              </div>
            </div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              No Products Yet
            </h2>
            <p className="mb-6 text-lg text-gray-600">
              Start building your premium product catalog by adding your first
              product.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mx-auto flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <Plus size={20} />
              Add Your First Product
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 px-4 py-5 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between"></div>
    </header>
  );
}
