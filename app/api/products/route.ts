import { NextRequest, NextResponse } from "next/server";
import { getProduct, PRODUCTS } from "@/data/products/catalog";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const product = getProduct(id);
    if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ product });
  }
  return NextResponse.json({ products: PRODUCTS });
}
