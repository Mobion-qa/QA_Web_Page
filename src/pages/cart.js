// src/pages/cart.js
import { getCart, setCart, setLastOrder, addOrder } from "../lib/storage.js";
import { formatKRW } from "../lib/utils.js";
import { carryQuery, goCat } from "../lib/nav.js";

function calc(cart) {
  const sumOp = cart.items.reduce((a, i) => a + (Number(i.op || 0) * Number(i.qty || 0)), 0);
  const sumSp = cart.items.reduce((a, i) => a + (Number(i.sp || 0) * Number(i.qty || 0)), 0);
  return { sumOp, sumSp, discount: (sumOp - sumSp), total: sumSp };
}

export function initCart() {
  window.goCat = goCat;

  const qp = new URLSearchParams(location.search);
  const hint = document.getElementById("cartHint");
  if (qp.get("autobuy") === "1" && hint) {
    hint.textContent = "바로구매로 이동했어요. 상품/수량 확인 후 구매하기를 눌러주세요.";
  }

  function render() {
    const cart = getCart();
    const itemsEl = document.getElementById("items");
    const emptyEl = document.getElementById("empty");

    if (!cart.items.length) {
      itemsEl.innerHTML = "";
      emptyEl.style.display = "block";
      document.getElementById("sumPrice").textContent = "0원";
      document.getElementById("sumDiscount").textContent = "0원";
      document.getElementById("sumTotal").textContent = "0원";
      return;
    }

    emptyEl.style.display = "none";

    itemsEl.innerHTML = cart.items.map((it, idx) => `
      <div class="item">
        <img class="thumb" src="${it.img}" alt="">
        <div>
          <div class="name">${it.name}</div>
          <div class="opt">옵션: ${it.option}</div>
          <div class="qtyRow">
            <button class="qtyBtn" data-act="minus" data-idx="${idx}">−</button>
            <div class="qtyVal">${it.qty}</div>
            <button class="qtyBtn" data-act="plus" data-idx="${idx}">+</button>
          </div>
        </div>
        <div class="right">
          <div class="price">${formatKRW(Number(it.sp) * Number(it.qty))}</div>
          <button class="del" data-act="del" data-idx="${idx}">삭제</button>
        </div>
      </div>
    `).join("");

    const sums = calc(cart);
    document.getElementById("sumPrice").textContent = formatKRW(sums.sumOp);
    document.getElementById("sumDiscount").textContent = "-" + formatKRW(sums.discount);
    document.getElementById("sumTotal").textContent = formatKRW(sums.total);
  }

  document.getElementById("items").addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    const act = t.dataset.act;
    const idx = Number(t.dataset.idx);
    if (!act || !Number.isFinite(idx)) return;

    const cart = getCart();
    const it = cart.items[idx];
    if (!it) return;

    if (act === "minus") it.qty = Math.max(1, Number(it.qty) - 1);
    if (act === "plus") it.qty = Math.min(99, Number(it.qty) + 1);
    if (act === "del") cart.items.splice(idx, 1);

    setCart(cart);
    render();
  });

  document.getElementById("btnClear").addEventListener("click", () => {
    if (!confirm("장바구니를 비울까요?")) return;
    setCart({ items: [] });
    render();
  });

  document.getElementById("btnCheckout").addEventListener("click", () => {
    const cart = getCart();
    if (!cart.items.length) return alert("장바구니가 비어있어요.");

    const sums = calc(cart);

    // ✅ mypage.js가 읽는 스키마로 저장 (orderNo/ts/items/total)
    const order = {
      orderNo: "ORD-" + Date.now(),
      ts: Date.now(),
      items: cart.items.map(it => ({
        id: it.id,
        name: it.name,
        qty: it.qty,
        sp: it.sp,
        option: it.option,
        img: it.img
      })),
      total: sums.total,
      summary: sums // complete 페이지에서도 쓸 수 있게 남김
    };

    // ✅ complete 페이지용 (최근 주문)
    setLastOrder(order);

    // ✅ mypage "주문내역" 누적 저장
    addOrder(order);

    // ✅ 장바구니 비우기
    setCart({ items: [] });

    // ✅ 완료 페이지 이동
    location.href = `./complete.html?${carryQuery({ orderNo: order.orderNo })}`;
  });

  render();
}
