"use client";

import { Heart, LayoutDashboard, Package, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ACCOUNT_TABS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/settings", label: "Settings", icon: Settings },
] as const;

/** Overview only matches exactly; the other tabs also cover their sub-pages (e.g. an order's detail page). */
function isActiveTab(pathname: string, href: string) {
  return href === "/account"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** Account section tabs. On phones the row scrolls sideways instead of wrapping. */
export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account"
      className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
    >
      <ul className="flex min-w-max gap-2 border-b border-border pb-4">
        {ACCOUNT_TABS.map(({ href, label, icon: Icon }) => {
          const active = isActiveTab(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card text-muted-foreground hover:border-clay hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
