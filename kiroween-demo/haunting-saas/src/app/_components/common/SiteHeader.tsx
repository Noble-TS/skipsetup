"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "~/server/better-auth/client";
import UserDropdownProfile from "../auth/UserDropdownProfile";

export default function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/50 bg-white/80 backdrop-blur-xl dark:border-neutral-800/50 dark:bg-neutral-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎃</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-500">Kiroween</span>
        </Link>

        <nav className="flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-emerald-600 dark:text-emerald-500"
                  : "text-neutral-600 hover:text-emerald-600 dark:text-neutral-300 dark:hover:text-emerald-400"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {session ? (
            <UserDropdownProfile />
          ) : (
            <Link
              href="/signin"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
