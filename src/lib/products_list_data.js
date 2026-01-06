// src/lib/products_list_data.js
import { buildProducts } from "./products.js";

export function buildListProducts() {
  const P = buildProducts();
  return P.map(p => ({
    id: p.id,
    baseId: p.baseId || String(p.id).split("-V")[0],
    cat: p.cat,
    brand: p.brand,
    name: p.name,
    op: p.op,
    sp: p.sp,
    img: p.imgs?.[0] || "",
    coupon: !!p.coupon,
    fast: !!p.fast,
    reviews: p.reviews ?? 0,
    rating: p.rating ?? 0,
  }));
}
