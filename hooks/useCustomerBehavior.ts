"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDemo } from "@/hooks/useDemo";

/** Tracks page views and exposes helpers for product interactions. */
export function useCustomerBehavior() {
  const pathname = usePathname();
  const { track } = useDemo();

  useEffect(() => {
    void track("page_view", pathname || "/customer");
  }, [pathname, track]);

  return {
    viewProduct: (productId: string, page?: string) =>
      track("product_view", page || pathname, productId),
    compareProduct: (productId: string) =>
      track("product_compare", pathname, productId),
    openDetail: (productId: string) =>
      track("product_detail", pathname, productId),
    track,
  };
}
