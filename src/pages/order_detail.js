// src/pages/order_detail.js
import { formatKRW } from "../lib/utils.js";

const ORDERS_KEY = "MOBION_ORDERS";

function readOrders() {
  try {
    const v = localStorage.getItem(ORDERS_KEY);
    const arr = v ? JSON.parse(v) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function initOrderDetail() {
  const params = new URLSearchParams(location.search);
  const orderNo = params.get("orderNo") || "";

  const titleEl = document.getElementById("odTitle");
  const sumEl = document.getElementById("odSummary");
  const itemsEl = document.getElementById("odItems");
  const btnBack = document.getElementById("btnBack");

  btnBack?.addEventListener("click", () => history.back());

  if (!orderNo) {
    titleEl.textContent = "주문번호가 없습니다.";
    sumEl.innerHTML = `<div class="empty">잘못된 접근입니다.</div>`;
    itemsEl.innerHTML = "";
    return;
  }

  const orders = readOrders();
  const order = orders.find(o => o?.orderNo === orderNo);

  if (!order) {
    titleEl.textContent = `주문번호 ${orderNo}`;
    sumEl.innerHTML = `<div class="empty">해당 주문을 찾을 수 없습니다.</div>`;
    itemsEl.innerHTML = "";
    return;
  }

  titleEl.textContent = `주문번호 ${order.orderNo}`;

  const dateText = order.ts ? new Date(order.ts).toLocaleString() : "-";
  const total = formatKRW(order.total ?? 0);

  sumEl.innerHTML = `
    <div class="row">
      <div class="rowMain">
        <div class="rowTitle">주문일시</div>
        <div class="rowSub">${dateText}</div>
      </div>
    </div>
    <div class="row">
      <div class="rowMain">
        <div class="rowTitle">결제금액</div>
        <div class="rowSub">${total}</div>
      </div>
    </div>
  `;

  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) {
    itemsEl.innerHTML = `<div class="empty">주문 상품이 없습니다.</div>`;
    return;
  }

  itemsEl.innerHTML = items.map(it => `
    <div class="row">
      <div class="rowMain" style="display:flex; gap:12px; align-items:center;">
        ${it.img ? `<img src="${it.img}" alt="" style="width:56px;height:56px;border-radius:12px;object-fit:cover;">` : ""}
        <div>
          <div class="rowTitle">${it.name || "상품"}</div>
          <div class="rowSub">${formatKRW(Number(it.sp || 0))} · ${it.qty || 1}개</div>
          ${it.option ? `<div class="rowSub">옵션: ${it.option}</div>` : ""}
        </div>
      </div>
    </div>
  `).join("");
}
