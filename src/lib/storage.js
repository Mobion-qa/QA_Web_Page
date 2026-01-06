// src/lib/storage.js
import { safeJsonParse } from "./utils.js";

const KEY_CART = "MOBION_CART";
const KEY_WISHLIST = "MOBION_WISHLIST";
const KEY_LAST_ORDER = "MOBION_LAST_ORDER";
const KEY_ORDERS = "MOBION_ORDERS";

function read(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  return safeJsonParse(raw, fallback);
}

function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ✅ Cart 스키마: { items: [{id,name,img,op,sp,qty,option}] }
export function getCart() {
  const c = read(KEY_CART, { items: [] });
  if (!c || typeof c !== "object") return { items: [] };
  if (!Array.isArray(c.items)) return { items: [] };
  return c;
}

export function setCart(cart) {
  const c = cart && typeof cart === "object" ? cart : { items: [] };
  if (!Array.isArray(c.items)) c.items = [];
  write(KEY_CART, c);
}

export function addToCart(item) {
  const cart = getCart();
  const key = `${item.id}__${item.option || "default"}`;
  const hit = cart.items.find(x => `${x.id}__${x.option || "default"}` === key);
  if (hit) hit.qty = Math.min(99, Number(hit.qty || 1) + Number(item.qty || 1));
  else cart.items.push({ ...item, qty: Math.max(1, Number(item.qty || 1)) });
  setCart(cart);
  return cart;
}

// ✅ Wishlist: ["P-10001" ...] (base id도 OK)
export function getWishlist() {
  const wl = read(KEY_WISHLIST, []);
  return Array.isArray(wl) ? wl : [];
}

export function setWishlist(list) {
  write(KEY_WISHLIST, Array.isArray(list) ? list : []);
}

export function toggleWishlist(baseId) {
  const wl = getWishlist();
  const i = wl.indexOf(baseId);
  if (i >= 0) wl.splice(i, 1);
  else wl.unshift(baseId);
  setWishlist(wl);
  return wl;
}

// ✅ Last Order (complete 페이지용)
export function getLastOrder() {
  return read(KEY_LAST_ORDER, null);
}

export function setLastOrder(order) {
  write(KEY_LAST_ORDER, order || null);
}

// ✅ Orders History (mypage "주문 내역"용)
export function getOrders() {
  const orders = read(KEY_ORDERS, []);
  return Array.isArray(orders) ? orders : [];
}

export function addOrder(order) {
  const orders = getOrders();
  orders.unshift(order); // 최신이 위로
  write(KEY_ORDERS, orders);
  return orders;
}
