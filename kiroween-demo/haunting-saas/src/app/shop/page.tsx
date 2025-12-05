"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart, X, Filter, Package } from "lucide-react";
import CheckoutButton from "~/app/_components/ui/checkout/CheckoutButton";
import { useCart } from "~/app/_components/context/CartContext";

const Colors = {
  PrimaryText: "#1f2937",
  SecondaryText: "#6b7280",
  Background: "bg-white",
  SoftEmerald: "bg-emerald-50",
  AccentEmerald: "#059669",
  AccentEmeraldDark: "#047857",
  AccentGray: "#9ca3af",
} as const;

const PremiumDivider = () => (
  <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
);

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

const Notification = ({
  message,
  visible,
  onClose,
}: {
  message: string;
  visible: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <div
      className={`fixed right-8 bottom-8 z-50 flex max-w-sm items-center space-x-4 rounded-xl p-5 shadow-2xl transition-all duration-500 ${visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}
      style={{ backgroundColor: Colors.AccentEmerald, color: "white" }}
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="text-base font-medium">{message}</span>
      <button
        onClick={onClose}
        className="rounded-full p-1 transition-colors hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ProductCard = ({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
}) => (
  <article className="group flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
    <div className="relative h-64 overflow-hidden">
      <img
        src={product.image || "https://placehold.co/400"}
        alt={product.name}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://placehold.co/400";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
    <div className="flex flex-grow flex-col p-6">
      <p
        className="mb-1 text-sm font-semibold uppercase"
        style={{ color: Colors.AccentEmerald }}
      >
        {product.category || "Gift"}
      </p>
      <h3
        className="mb-2 text-xl font-bold"
        style={{ color: Colors.PrimaryText }}
      >
        {product.name}
      </h3>
      <p
        className="mb-4 line-clamp-3 text-sm leading-relaxed"
        style={{ color: Colors.SecondaryText }}
      >
        {product.description}
      </p>

      <div className="mt-auto flex items-center justify-between border-t border-gray-200 pt-3">
        <span
          className="text-2xl font-bold"
          style={{ color: Colors.AccentEmerald }}
        >
          $${product.price.toFixed(2)}
        </span>
        <button
          className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
      {product.stock > 0 && product.stock < 10 && (
        <p className="mt-2 text-xs text-amber-600">
          Only {product.stock} left in stock!
        </p>
      )}
    </div>
  </article>
);

const CategoryTabs = ({
  activeCategory,
  onCategoryChange,
  categories,
}: {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
}) => {
  const allCategories = ["All", ...categories];

  return (
    <nav className="mb-12 flex flex-wrap justify-center gap-3 px-2">
      {allCategories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`rounded-xl px-5 py-2 text-base font-medium transition-all ${
            activeCategory === category
              ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {category}
        </button>
      ))}
    </nav>
  );
};

const FilterSidebar = ({
  filters,
  setFilters,
  isSidebarOpen,
  closeSidebar,
}: {
  filters: { price: { min: number; max: number }; sort: string };
  setFilters: React.Dispatch<React.SetStateAction<typeof filters>>;
  isSidebarOpen: boolean;
  closeSidebar: () => void;
}) => {
  const priceRanges = [
    { label: "All Prices", min: 0, max: 1000 },
    { label: "Under $75", min: 0, max: 75 },
    { label: "$75 - $150", min: 75, max: 150 },
    { label: "Above $150", min: 150, max: 1000 },
  ] as const;

  const isActive = (r: (typeof priceRanges)[number]) =>
    filters.price.min === r.min && filters.price.max === r.max;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeSidebar}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-full p-6 shadow-2xl transition-transform duration-300 lg:static lg:w-1/4 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-y-auto rounded-r-3xl bg-emerald-50 lg:translate-x-0 lg:rounded-none`}
      >
        <div className="mb-6 flex items-center justify-between border-b border-gray-300 pb-3">
          <h2
            className="text-xl font-semibold"
            style={{ color: Colors.PrimaryText }}
          >
            Refine Search
          </h2>
          <button
            onClick={closeSidebar}
            className="rounded-full p-2 transition-colors hover:bg-gray-200 lg:hidden"
          >
            <X className="h-5 w-5" style={{ color: Colors.PrimaryText }} />
          </button>
        </div>
        <section className="mb-5">
          <label
            className="mb-2 block font-semibold"
            style={{ color: Colors.PrimaryText }}
          >
            Sort by
          </label>
          <select
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, sort: e.target.value }))
            }
            value={filters.sort}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="default">Best Match</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
            <option value="newest">Newest First</option>
          </select>
        </section>
        <section>
          <h3
            className="mb-3 text-base font-semibold"
            style={{ color: Colors.PrimaryText }}
          >
            Price Range
          </h3>
          {priceRanges.map((range) => (
            <button
              key={range.label}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  price: { min: range.min, max: range.max },
                }))
              }
              className={`mb-2 block w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                isActive(range)
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md"
                  : "hover:bg-emerald-100/70"
              }`}
            >
              {range.label}
            </button>
          ))}
        </section>
      </aside>
    </>
  );
};

const CartSidebar = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { state, removeFromCart, updateQuantity, clearCart } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-96 max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2
              className="text-2xl font-bold"
              style={{ color: Colors.PrimaryText }}
            >
              Shopping Cart
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {state.items.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
                >
                  <img
                    src={item.image || "https://placehold.co/400"}
                    alt={item.name}
                    className="h-16 w-16 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/400";
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-gray-600">$${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {state.items.length > 0 && (
          <div className="space-y-4 border-t border-gray-200 p-6">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span style={{ color: Colors.PrimaryText }}>Total:</span>
              <span style={{ color: Colors.AccentEmerald }}>
                $${state.total.toFixed(2)}
              </span>
            </div>
            <CheckoutButton />
            <button
              onClick={clearCart}
              className="w-full rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Clear Cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

const Header = ({
  isCartOpen,
  setIsCartOpen,
  cartItemCount,
  setIsSidebarOpen,
}: {
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartItemCount: number;
  setIsSidebarOpen?: (open: boolean) => void;
}) => (
  <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 px-4 py-5 shadow-sm backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl items-center justify-between">
      {setIsSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-xl p-3 hover:bg-gray-100 lg:hidden"
        >
          <Filter className="h-6 w-6" style={{ color: Colors.PrimaryText }} />
        </button>
      )}
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white shadow-lg">
          SS
        </div>
        <span className="text-2xl font-bold text-gray-900">SkipSetup</span>
      </Link>
      <nav className="flex items-center space-x-5 text-lg">
        <Link
          href="/"
          className="hidden text-gray-600 transition-colors hover:text-emerald-600 md:block"
        >
          Home
        </Link>
        <Link
          href="/about"
          className="hidden text-gray-600 transition-colors hover:text-emerald-600 md:block"
        >
          How It Works
        </Link>
        <Link
          href="/orders"
          className="hidden text-gray-600 transition-colors hover:text-emerald-600 md:block"
        >
          My Orders
        </Link>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Cart (${cartItemCount})
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {cartItemCount}
            </span>
          )}
        </button>
      </nav>
    </div>
  </header>
);

// --- Main Shop ---
const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [filters, setFilters] = useState({
    price: { min: 0, max: 1000 },
    sort: "default",
  });
  const [notification, setNotification] = useState({
    message: "",
    visible: false,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { addToCart, state } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        if (data.success) {
          setProducts(data.products || []);
        } else {
          throw new Error(data.error || "Failed to load products");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Unable to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Extract unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean)),
    );
    return uniqueCategories.sort();
  }, [products]);

  const handleAddToCart = useCallback(
    (product: Product) => {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
      setNotification({
        message: `${product.name} added to cart!`,
        visible: true,
      });
    },
    [addToCart],
  );

  const closeNotification = useCallback(
    () => setNotification((p) => ({ ...p, visible: false })),
    [],
  );

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(
      (p) =>
        (activeCategory === "All" || p.category === activeCategory) &&
        p.price >= filters.price.min &&
        p.price <= filters.price.max &&
        p.stock > 0, // Only show products in stock
    );

    switch (filters.sort) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      default:
        result.sort((a, b) => {
          if (a.stock === 0 && b.stock > 0) return 1;
          if (b.stock === 0 && a.stock > 0) return -1;
          return 0;
        });
    }
    return result;
  }, [products, activeCategory, filters]);

  if (loading) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans`}
      >
        <Header
          isCartOpen={isCartOpen}
          setIsCartOpen={setIsCartOpen}
          cartItemCount={state.itemCount}
        />
        <PremiumDivider />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-t-2 border-b-2 border-emerald-600"></div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Loading Products
            </h2>
            <p className="text-lg text-gray-600">
              Discovering premium products...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans`}
      >
        <Header
          isCartOpen={isCartOpen}
          setIsCartOpen={setIsCartOpen}
          cartItemCount={state.itemCount}
        />
        <PremiumDivider />
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mb-6 text-6xl text-emerald-600">❌</div>
            <h1 className="mb-4 text-3xl font-bold text-gray-900">
              Unable to Load Products
            </h1>
            <p className="mb-6 text-lg text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mx-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans`}
    >
      <Header
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        cartItemCount={state.itemCount}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <PremiumDivider />

      <main className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <section className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            Premium Marketplace
          </div>
          <h1 className="mb-3 text-4xl font-bold text-gray-900 md:text-5xl">
            Our Premium Collections
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Discover exclusive products and services curated for
            enterprise-grade quality and performance.
          </p>
        </section>

        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categories={categories}
        />

        <div className="flex flex-col gap-8 lg:flex-row">
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            isSidebarOpen={isSidebarOpen}
            closeSidebar={() => setIsSidebarOpen(false)}
          />
          <section className="lg:w-3/4">
            <div className="mb-6 flex flex-col items-start justify-between border-b border-gray-200 pb-2 sm:flex-row sm:items-center">
              <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
                Showing{" "}
                <span className="text-emerald-600">
                  {filteredAndSortedProducts.length}
                </span>{" "}
                Products
              </h2>
              <p className="text-md text-gray-600">
                in{" "}
                <span className="font-semibold text-emerald-600">
                  {activeCategory}
                </span>
              </p>
            </div>

            {filteredAndSortedProducts.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-emerald-50 p-12 text-center shadow-inner">
                <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <p className="mb-2 text-xl font-medium text-gray-600">
                  No products found matching your current filters.
                </p>
                <p className="mb-6 text-sm text-gray-500">
                  Try adjusting your filters or browse a different category.
                </p>
                <button
                  className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-2 font-semibold text-white shadow-lg hover:shadow-xl"
                  onClick={() => {
                    setActiveCategory("All");
                    setFilters({
                      price: { min: 0, max: 1000 },
                      sort: "default",
                    });
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Notification
        message={notification.message}
        visible={notification.visible}
        onClose={closeNotification}
      />

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <PremiumDivider />

      <footer className="w-full border-t border-gray-200 bg-white py-10 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-sm font-bold text-white">
            SS
          </div>
          <span className="text-lg font-bold text-gray-900">SkipSetup</span>
        </div>
        <p className="text-base text-gray-600">
          © {new Date().getFullYear()} SkipSetup. Enterprise-grade ecommerce
          platform.
        </p>
      </footer>
    </div>
  );
};

export default Shop;
