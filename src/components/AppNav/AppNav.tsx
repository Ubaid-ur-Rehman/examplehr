"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/employee", label: "Employee" },
  { href: "/manager", label: "Manager" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-indigo-50"
          href="/employee"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white shadow-sm">
            EH
          </span>
          <span className="text-base font-semibold tracking-tight text-zinc-900">
            ExampleHR
          </span>
        </Link>

        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/90 p-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                    : "text-zinc-600 hover:bg-white hover:text-zinc-900"
                }`}
                href={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default AppNav;
