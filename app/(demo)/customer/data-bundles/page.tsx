"use client";

import { Suspense } from "react";
import DataBundlesInner from "./DataBundlesInner";

export default function DataBundlesPage() {
  return (
    <Suspense fallback={<p>Loading bundles…</p>}>
      <DataBundlesInner />
    </Suspense>
  );
}
