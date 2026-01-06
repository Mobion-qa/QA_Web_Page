// src/pages/complete.js
import { getLastOrder } from "../lib/storage.js";
import { formatKRW } from "../lib/utils.js";

export function initComplete() {
  const p = new URLSearchParams(location.search);
  const orderId = p.get("order_id");
  const order = getLastOrder();

  const sub = document.getElementById("sub");
  if (!order || (orderId && order.order_id !== orderId)) {
    sub.textContent = "주문 정보를 찾지 못했어요. (샘플: 마지막 주문만 저장됩니다)";
    return;
  }

  sub.textContent = "감사합니다. 주문 내역을 확인하세요.";
  document.getElementById("orderId").textContent = order.order_id;
  document.getElementById("total").textContent = formatKRW(order.summary.total);
  document.getElementById("created").textContent = order.created_at;

  document.getElementById("items").innerHTML = order.items.map(it => `
    <div class="item">
      <div>
        <div style="font-weight:900;">${it.name}</div>
        <div class="muted">옵션: ${it.option} · 수량: ${it.qty}</div>
      </div>
      <div style="font-weight:900;">${formatKRW(Number(it.sp) * Number(it.qty))}</div>
    </div>
  `).join("");
}
