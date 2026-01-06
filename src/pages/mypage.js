// src/pages/mypage.js
import { buildProducts } from "../lib/products.js";
import { formatKRW } from "../lib/utils.js";
import { carryQuery } from "../lib/nav.js";
import { getWishlist, setWishlist, setCart, getCart } from "../lib/storage.js";

const $ = (id) => document.getElementById(id);

const PROFILE_KEY = "MOBION_PROFILE";
const ORDERS_KEY = "MOBION_ORDERS";

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || ""); }
  catch { return fallback; }
}
function writeJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function loadProfile() {
  return readJSON(PROFILE_KEY, null);
}
function saveProfile(p) {
  writeJSON(PROFILE_KEY, p);
}

function loadOrders() {
  return readJSON(ORDERS_KEY, []);
}

function renderProfile() {
  const p = loadProfile() || { name: "게스트", phone: "-", addr: "-" };

  $("pfName").textContent = p.name || "-";
  $("pfPhone").textContent = p.phone || "-";
  $("pfAddr").textContent = p.addr || "-";

  $("inName").value = p.name === "게스트" ? "" : (p.name || "");
  $("inPhone").value = p.phone === "-" ? "" : (p.phone || "");
  $("inAddr").value = p.addr === "-" ? "" : (p.addr || "");
}

function openProfileForm(open) {
  $("profileView").classList.toggle("hidden", open);
  $("profileForm").classList.toggle("hidden", !open);
}

function renderOrders() {
  const orders = loadOrders().slice(0, 10);
  const empty = $("ordersEmpty");
  const list = $("ordersList");

  if (!orders.length) {
    empty.style.display = "block";
    list.innerHTML = "";
    return;
  }
  empty.style.display = "none";

  list.innerHTML = orders.map(o => {
    const items = (o.items || []).slice(0, 3).map(it =>
      `<span class="chip">${it.name} x${it.qty}</span>`
    ).join("");
    const more = (o.items?.length || 0) > 3 ? `<span class="chip">외 ${o.items.length - 3}개</span>` : "";

    return `
      <div class="row">
        <div class="rowMain">
          <div class="rowTitle">주문번호 ${o.orderNo || "-"}</div>
          <div class="rowSub">${o.ts ? new Date(o.ts).toLocaleString() : "-"} · ${formatKRW(o.total ?? 0)}</div>
          <div class="chips">${items}${more}</div>
        </div>
        <div class="rowAct">
          <a class="btn sm" href="./order_detail.html?orderNo=${encodeURIComponent(o.orderNo || "")}" title="주문 상세 보기">보기</a>
        </div>
      </div>
    `;
  }).join("");
}

function renderWishlist() {
  const wl = getWishlist();
  const products = buildProducts();
  const map = new Map(products.map(p => [p.id, p]));

  const toProduct = (id) =>
    map.get(id) || products.find(p => typeof p.id === "string" && (p.baseId === id || p.id.startsWith(id + "-V")));

  const picked = wl.map(toProduct).filter(Boolean).slice(0, 8);

  $("wishEmpty").style.display = picked.length ? "none" : "block";
  $("wishGrid").innerHTML = picked.map(p => `
    <a class="p" href="./product_detail.html?pid=${encodeURIComponent(p.id)}">
      <img src="${p.imgs?.[0] || ""}" alt="">
      <div class="pName">${p.name}</div>
      <div class="pPrice">${formatKRW(p.sp)}</div>
    </a>
  `).join("");
}

// ✅ 추가: 장바구니 미리보기 (최근 5개)
function renderCartPreview() {
  const cart = getCart();
  const items = cart.items || [];

  const empty = $("cartEmpty");
  const list = $("cartPreview");
  if (!empty || !list) return;

  if (!items.length) {
    empty.style.display = "block";
    list.innerHTML = "";
    return;
  }
  empty.style.display = "none";

  list.innerHTML = items.slice(0, 5).map(it => `
    <div class="row">
      <div class="rowMain" style="display:flex; gap:12px; align-items:center;">
        ${it.img ? `<img src="${it.img}" alt="" style="width:56px;height:56px;border-radius:12px;object-fit:cover;">` : ""}
        <div>
          <div class="rowTitle">${it.name}</div>
          <div class="rowSub">${formatKRW(Number(it.sp || 0))} · ${it.qty}개</div>
        </div>
      </div>
      <div class="rowAct">
        <a class="btn sm" href="./cart.html">보기</a>
      </div>
    </div>
  `).join("");
}

function bind() {
  $("btnEditProfile").addEventListener("click", () => openProfileForm(true));
  $("btnCancelProfile").addEventListener("click", () => openProfileForm(false));

  $("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    saveProfile({
      name: $("inName").value.trim() || "게스트",
      phone: $("inPhone").value.trim() || "-",
      addr: $("inAddr").value.trim() || "-"
    });
    openProfileForm(false);
    renderProfile();
    alert("저장되었습니다.");
  });

  $("btnClearCart").addEventListener("click", () => {
    if (!confirm("장바구니를 비울까요?")) return;
    setCart({ items: [] });
    renderCartPreview(); // ✅ 비운 뒤 미리보기 갱신
    alert("장바구니를 비웠습니다.");
  });

  const btnClearWish = $("btnClearWish");
  btnClearWish?.addEventListener("click", () => {
    if (!confirm("찜을 모두 삭제할까요?")) return;
    setWishlist([]);
    renderWishlist();
  });
}

export function initMyPage() {
  renderProfile();
  renderOrders();
  renderWishlist();
  renderCartPreview(); // ✅ 추가
  bind();
}
