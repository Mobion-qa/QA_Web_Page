// src/pages/complete.js
import { getLastOrder } from "../lib/storage.js";
import { formatKRW } from "../lib/utils.js";

export function initComplete() {
  const p = new URLSearchParams(location.search);
  const orderNoParam = p.get("orderNo");
  const order = getLastOrder();

  const sub = document.getElementById("sub");
  if (!order || (orderNoParam && order.orderNo !== orderNoParam)) {
    sub.textContent = "주문 정보를 찾지 못했어요. (샘플: 마지막 주문만 저장됩니다)";
    return;
  }

  sub.textContent = "감사합니다. 주문 내역을 확인하세요.";
  document.getElementById("orderId").textContent = order.orderNo;
  document.getElementById("total").textContent = formatKRW(order.total ?? order.summary?.total ?? 0);
  document.getElementById("created").textContent = order.ts ? new Date(order.ts).toLocaleString() : "-";
  
  const sumQty = (order.items || []).reduce((a, it) => a + (Number(it.qty) || 0), 0); 
  document.getElementById("sumQty").textContent = `${sumQty}개`;

  document.getElementById("items").innerHTML = order.items.map(it => {
    const productId = it.productId || it.id || "";         // variant id
    const productCode = it.product_code || it.product_code || ""; // base id(=product_code)

    return `
      <div class="item"
          data-product-id="${String(productId)}"
          data-product-code="${String(productCode)}">
        <div>
          <div style="font-weight:900;">${it.name}</div>

          <div class="muted">옵션: ${it.option} · 수량: ${it.qty}</div>

          <!-- ✅ 추가: 상품 코드/상품ID 표시 -->
          <div class="muted" style="font-size:12px; margin-top:4px;">
            product_code: ${productCode || "-"} / productId: ${productId || "-"}
          </div>
        </div>

        <div style="font-weight:900;">${formatKRW(Number(it.sp) * Number(it.qty))}</div>
      </div>
    `;
  }).join("");
}
