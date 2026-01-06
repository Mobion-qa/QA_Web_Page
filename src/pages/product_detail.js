// src/pages/product_detail.js
import { buildProducts } from "../lib/products.js";
import { formatKRW } from "../lib/utils.js";
import { addToCart, getCart, setCart, getWishlist, toggleWishlist } from "../lib/storage.js";
import { carryQuery } from "../lib/nav.js";

const $ = (id) => document.getElementById(id);

function qp() {
  return new URLSearchParams(location.search);
}

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function safeJsonParse(v, fb) {
  try { return JSON.parse(v); } catch { return fb; }
}

/* ===== 리뷰/문의 저장 키 ===== */
function keyReviews(baseId){ return `MOBION_REVIEWS_${baseId}`; }
function keyQna(baseId){ return `MOBION_QNA_${baseId}`; }

function readList(key){
  const v = localStorage.getItem(key);
  const arr = v ? safeJsonParse(v, []) : [];
  return Array.isArray(arr) ? arr : [];
}
function writeList(key, arr){
  localStorage.setItem(key, JSON.stringify(Array.isArray(arr) ? arr : []));
}

/* ===== 탭 ===== */
function bindDetailTabs() {
  const root = document.querySelector(".detailTabs");
  if (!root) return;

  const btns = Array.from(root.querySelectorAll(".tabBtn"));
  const panels = Array.from(root.querySelectorAll(".tabPanel"));

  const activate = (name) => {
    btns.forEach(b => {
      const on = b.dataset.tab === name;
      b.classList.toggle("isActive", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach(p => p.classList.toggle("isActive", p.dataset.panel === name));
  };

  root.querySelector(".tabBar")?.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const name = t.dataset.tab;
    if (!name) return;
    activate(name);
  });

  activate("desc");
}

/* ===== 모달(리뷰/문의 공용) ===== */
function bindWriterModal({ baseId, onSaved }) {
  const modal = $("modal");
  const dim = $("modalDim");
  const close = $("modalClose");
  const btnCancel = $("btnCancel");
  const btnSubmit = $("btnSubmit");
  const title = $("modalTitle");
  const reviewFields = $("reviewFields");
  const inRating = $("inRating");
  const inText = $("inText");

  let mode = "review"; // "review" | "qna"

  const open = (m) => {
    mode = m;
    modal.classList.remove("hidden");
    inText.value = "";
    if (mode === "review") {
      title.textContent = "리뷰 작성";
      reviewFields.classList.remove("hidden");
      inRating.value = "5";
    } else {
      title.textContent = "문의하기";
      reviewFields.classList.add("hidden");
    }
  };

  const hide = () => modal.classList.add("hidden");

  dim.addEventListener("click", hide);
  close.addEventListener("click", hide);
  btnCancel.addEventListener("click", hide);

  btnSubmit.addEventListener("click", () => {
    const text = (inText.value || "").trim();
    if (!text) return alert("내용을 입력해주세요.");

    if (mode === "review") {
      const rating = clamp(inRating.value, 1, 5);
      const list = readList(keyReviews(baseId));
      list.unshift({ id: "R-" + Date.now(), ts: Date.now(), rating, text });
      writeList(keyReviews(baseId), list);
    } else {
      const list = readList(keyQna(baseId));
      list.unshift({ id: "Q-" + Date.now(), ts: Date.now(), text, status: "접수" });
      writeList(keyQna(baseId), list);
    }

    hide();
    onSaved?.(mode);
  });

  return { open, hide };
}

/* ===== 리뷰/문의 렌더 ===== */
function renderReviews(baseId) {
  const list = readList(keyReviews(baseId));
  const empty = $("reviewEmpty");
  const box = $("reviewList");

  if (!list.length) {
    empty.style.display = "block";
    box.innerHTML = "";
    return;
  }
  empty.style.display = "none";

  box.innerHTML = list.map(r => `
    <div class="row">
      <div class="rowTitle">평점 ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
      <div class="rowSub">${new Date(r.ts).toLocaleString()}</div>
      <div class="chipLine"><span class="chip">${escapeHtml(r.text)}</span></div>
    </div>
  `).join("");
}

function renderQna(baseId) {
  const list = readList(keyQna(baseId));
  const empty = $("qnaEmpty");
  const box = $("qnaList");

  if (!list.length) {
    empty.style.display = "block";
    box.innerHTML = "";
    return;
  }
  empty.style.display = "none";

  box.innerHTML = list.map(q => `
    <div class="row">
      <div class="rowTitle">상태: ${q.status || "접수"}</div>
      <div class="rowSub">${new Date(q.ts).toLocaleString()}</div>
      <div class="chipLine"><span class="chip">${escapeHtml(q.text)}</span></div>
    </div>
  `).join("");
}

/* ===== 안전한 HTML 출력 ===== */
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ===== 상세 초기화 ===== */
export function initProductDetail() {
  const params = qp();
  const pid = params.get("pid"); // product id
  const campaign = params.get("campaign");
  const mediaca = params.get("mediaca");
  const tracking = params.get("tracking");

  // chips 표시
  $("chipCampaign").textContent = `campaign: ${campaign ?? "-"}`;
  $("chipMediaca").textContent = `mediaca: ${mediaca ?? "-"}`;
  $("chipTracking").textContent = `tracking: ${tracking ?? "-"}`;

  // 상품 로딩
  const products = buildProducts();
  const product = pid ? products.find(p => String(p.id) === String(pid)) : products[0];

  if (!product) {
    $("pdName").textContent = "상품을 찾을 수 없습니다.";
    return;
  }

  const baseId = product.baseId || product.id;

  // 이미지/썸네일
  const imgs = (product.imgs && product.imgs.length) ? product.imgs : [product.img].filter(Boolean);
  $("pdMainImg").src = imgs[0] || "";
  $("pdMainImg").alt = product.name || "";

  $("pdThumbs").innerHTML = imgs.slice(0, 6).map((src, i) => `
    <img src="${src}" class="${i === 0 ? "isActive" : ""}" data-i="${i}" alt="">
  `).join("");

  $("pdThumbs").addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const i = Number(t.dataset.i);
    if (!Number.isFinite(i)) return;
    $("pdMainImg").src = imgs[i];
    Array.from($("pdThumbs").querySelectorAll("img")).forEach(img => img.classList.remove("isActive"));
    t.classList.add("isActive");
  });

  // 가격
  const op = Number(product.op ?? 0);
  const sp = Number(product.sp ?? 0);
  const discount = op > 0 ? Math.round(((op - sp) / op) * 100) : 0;

  $("pdName").textContent = product.name || "상품";
  $("pdOp").textContent = formatKRW(op);
  $("pdSp").textContent = formatKRW(sp);
  $("pdDiscount").textContent = `${discount}%`;

  // 수량
  const qtyInput = $("qtyInput");
  const setQty = (n) => { qtyInput.value = String(clamp(n, 1, 99)); };
  $("btnMinus").addEventListener("click", () => setQty(Number(qtyInput.value) - 1));
  $("btnPlus").addEventListener("click", () => setQty(Number(qtyInput.value) + 1));
  qtyInput.addEventListener("change", () => setQty(qtyInput.value));

  // 찜 버튼
  const wishBtn = $("btnWish");
  const refreshWish = () => {
    const wl = getWishlist();
    const on = wl.includes(baseId);
    wishBtn.classList.toggle("isOn", on);
  };
  refreshWish();

  wishBtn.addEventListener("click", () => {
    toggleWishlist(baseId);
    refreshWish();
  });

  // 장바구니/바로구매
  const optionEl = $("pdOption");

  $("btnCart").addEventListener("click", () => {
    const qty = clamp(qtyInput.value, 1, 99);
    const option = optionEl.value || "기본 옵션";

    addToCart({
      id: product.id,
      name: product.name,
      img: imgs[0] || "",
      op,
      sp,
      qty,
      option
    });

    alert("장바구니에 담았습니다.");
  });

  $("btnBuy").addEventListener("click", () => {
    const qty = clamp(qtyInput.value, 1, 99);
    const option = optionEl.value || "기본 옵션";

    // 바로구매: 카트에 담고 cart로 이동(autobuy 힌트 유지)
    const cart = getCart();
    cart.items = [{
      id: product.id,
      name: product.name,
      img: imgs[0] || "",
      op,
      sp,
      qty,
      option
    }];
    setCart(cart);

    location.href = `./cart.html?${carryQuery({ autobuy: "1" })}`;
  });

  // Payload(JSON)
  const payload = {
    product_id: product.id,
    base_id: baseId,
    name: product.name,
    image: imgs[0] || "",
    op,
    sp,
    campaign: campaign ?? null,
    mediaca: mediaca ?? null,
    tracking: tracking ?? null,
    ts: new Date().toISOString()
  };
  
 // ✅ QA Payload Viewer 연결
  if (typeof window.setQAPayload === "function") {
    window.setQAPayload({
      product_id: product.id,
      name: product.name,
      img: imgs[0] || "",
      op,
      dp: sp,
      campaign,
      mediaca,
      tracking,
      tx: new Date().toISOString()
    });
  }

  /**const payloadBox = $("payloadBox");
  payloadBox.textContent = JSON.stringify(payload, null, 2);

  $("btnCopyPayload").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      alert("복사되었습니다.");
    } catch {
      alert("복사에 실패했습니다.");
    }
  });

  $("btnTogglePayload").addEventListener("click", () => {
    const hidden = payloadBox.style.display === "none";
    payloadBox.style.display = hidden ? "block" : "none";
    $("btnTogglePayload").textContent = hidden ? "접기" : "펼치기";
  });
  **/

  // 탭 + 리뷰/문의
  bindDetailTabs();

  const modal = bindWriterModal({
    baseId,
    onSaved: (mode) => {
      if (mode === "review") renderReviews(baseId);
      else renderQna(baseId);
    }
  });

  $("btnWriteReview").addEventListener("click", () => modal.open("review"));
  $("btnWriteQna").addEventListener("click", () => modal.open("qna"));

  // 초기 렌더
  renderReviews(baseId);
  renderQna(baseId);
  
}

// ✅ QA Payload Viewer (붙여넣기용)
(function(){
  const $ = (id) => document.getElementById(id);

  // UI에서 읽어올 DOM 선택자(너 페이지에 맞게 수정 가능)
  const UI_SELECTORS = {
    name:  "#pdName, #productName, .product-name, h1",
    price: "#pdSp, #salePrice, .price .sale, .salePrice",
    op:    "#pdOp, #originPrice, .price .origin, .originPrice",
    img:   "#pdMainImg, .mainImg, #mainImg, .gallery .mainImg img, .product-image img"
  };

  function readUIText(sel){
    const el = document.querySelector(sel);
    return el ? (el.textContent || "").trim() : "";
  }

  function readUIImageURL(sel){
    const el = document.querySelector(sel);
    if (!el) return "";
    // img 태그 or background-image 모두 대응
    if (el.tagName === "IMG") return (el.getAttribute("src") || "").trim();
    const bg = getComputedStyle(el).backgroundImage || "";
    const m = bg.match(/url\(["']?(.*?)["']?\)/i);
    return m ? m[1] : "";
  }

  function normalizeMoney(v){
    if (v == null) return null;
    const s = String(v).replace(/[^\d]/g, "");
    return s ? Number(s) : null;
  }

  function pretty(obj){
    try { return JSON.stringify(obj, null, 2); }
    catch(e){ return String(obj); }
  }

  function setStatus(elId, ok){
    const el = $(elId);
    if (!el) return;
    el.classList.remove("qa-ok","qa-bad","qa-na");
    if (ok === null){ el.textContent = "-"; el.classList.add("qa-na"); return; }
    if (ok){ el.textContent = "OK"; el.classList.add("qa-ok"); }
    else { el.textContent = "DIFF"; el.classList.add("qa-bad"); }
  }

  function safeText(el, text){
    if (!el) return;
    el.textContent = text ?? "-";
  }

  function safeLink(el, url){
    if (!el) return;
    if (!url){ el.textContent = "-"; return; }
    el.innerHTML = `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`;
  }

  function getUISnapshot(){
    const name = readUIText(UI_SELECTORS.name);
    const price = readUIText(UI_SELECTORS.price);
    const op = readUIText(UI_SELECTORS.op);
    const img = readUIImageURL(UI_SELECTORS.img);
    return { name, price, op, img };
  }

  function compareAndRender(payload, ui){
    // payload 키는 네 예시 기준: { product_id, base_id, name, img, op, dp, campaign, mediaca, tracking, tx }
    const pl = payload || {};

    safeText($("qaProductId"), pl.product_id ?? pl.base_id ?? "-");
    safeText($("qaName"), pl.name ?? "-");
    safeText($("qaCampaign"), pl.campaign ?? "-");
    safeText($("qaMediaca"), pl.mediaca ?? "-");
    safeText($("qaTracking"), pl.tracking ?? "-");
    safeText($("qaPrice"), pl.dp ?? "-");
    safeText($("qaOp"), pl.op ?? "-");
    safeLink($("qaImg"), pl.img ?? "");

    const tx = pl.tx ? new Date(pl.tx) : null;
    safeText($("qaBadgeTime"), tx && !isNaN(tx.getTime()) ? tx.toLocaleString() : "-");

    // JSON
    safeText($("qaJson"), pretty(pl));

    // UI 값 표시
    safeText($("uiName"), `UI: ${ui.name || "-"}`);
    safeText($("uiPrice"), `UI: ${ui.price || "-"}`);
    safeText($("uiOp"), `UI: ${ui.op || "-"}`);
    safeText($("uiImg"), `UI: ${ui.img || "-"}`);

    // Payload 값 표시
    safeText($("plName"), `PL: ${pl.name || "-"}`);
    safeText($("plPrice"), `PL: ${pl.dp ?? "-"}`);
    safeText($("plOp"), `PL: ${pl.op ?? "-"}`);
    safeText($("plImg"), `PL: ${pl.img || "-"}`);

    // 비교
    const okName = ui.name && pl.name ? (ui.name.trim() === String(pl.name).trim()) : null;

    const uiPriceN = normalizeMoney(ui.price);
    const plPriceN = normalizeMoney(pl.dp);
    const okPrice = (uiPriceN != null && plPriceN != null) ? (uiPriceN === plPriceN) : null;

    const uiOpN = normalizeMoney(ui.op);
    const plOpN = normalizeMoney(pl.op);
    const okOp = (uiOpN != null && plOpN != null) ? (uiOpN === plOpN) : null;

    const okImg = (ui.img && pl.img) ? (ui.img.trim() === String(pl.img).trim()) : null;

    setStatus("stName", okName);
    setStatus("stPrice", okPrice);
    setStatus("stOp", okOp);
    setStatus("stImg", okImg);
  }

  function bindButtons(){
    const panel = $("qaPanel");
    const body = $("qaBody");

    $("qaToggleBtn")?.addEventListener("click", () => {
      const collapsed = body.style.display === "none";
      body.style.display = collapsed ? "" : "none";
      $("qaToggleBtn").textContent = collapsed ? "접기" : "펼치기";
    });

    $("qaCopyBtn")?.addEventListener("click", async () => {
      const text = $("qaJson")?.textContent || "";
      try{
        await navigator.clipboard.writeText(text);
        alert("Payload JSON을 클립보드에 복사했어요.");
      }catch(e){
        // fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        alert("Payload JSON을 복사했어요.");
      }
    });

    $("qaDownloadBtn")?.addEventListener("click", () => {
      const text = $("qaJson")?.textContent || "";
      const blob = new Blob([text], { type: "application/json" });
      const a = document.createElement("a");
      const id = $("qaProductId")?.textContent || "payload";
      a.href = URL.createObjectURL(blob);
      a.download = `payload_${id}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 500);
    });

    $("qaClearBtn")?.addEventListener("click", () => {
      panel.hidden = true;
      safeText($("qaJson"), "");
    });
  }

  // 외부에서 호출하는 진입점
  window.setQAPayload = function(payload, uiSnapshot){
    const panel = $("qaPanel");
    if (!panel) return;

    panel.hidden = false;

    const ui = uiSnapshot || getUISnapshot();
    compareAndRender(payload, ui);

    // 첫 1회만 버튼 바인딩
    if (!window.__qaViewerBound){
      bindButtons();
      window.__qaViewerBound = true;
    }
  };
})();
