// components/seo/Breadcrumb.tsx — Server Component
// WCAG：nav aria-label="Breadcrumb" + aria-current="page"

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  url:  string;
}

interface Props {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="mb-0">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-gray-600">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.url} className="flex items-center gap-1">
              {idx > 0 && (
                <ChevronRight size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className="max-w-[min(100%,18rem)] truncate font-semibold text-gray-900 sm:max-w-[28rem]"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="max-w-[10rem] truncate font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 sm:max-w-[14rem]"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
