// src/pages/product_list.js
import { buildListProducts } from "../lib/products_list_data.js";
import { formatKRW, discountRate, getQueryParams, $ } from "../lib/utils.js";
import { goCat, goDetail } from "../lib/nav.js";

export function initProductList() {
  // 전역 네비(HTML onclick에서 사용)
  window.goCat = goCat;
  window.goDetail = goDetail;
  window.scrollToGrid = () => {
    document.getElementById("gridAnchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // query
  const qp = getQueryParams();
  const category = (qp.category || "all").trim();        // fashion/beauty/digital/all
  let keyword = (qp.q || qp.keyword || "").trim(); // ✅ q/keyword 둘 다 지원

  const ALL = buildListProducts();

  // DOM
  const grid = $("grid");
  const breadcrumb = $("breadcrumb");
  const bannerTitle = $("bannerTitle");
  const bannerDesc = $("bannerDesc");
  const countText = $("countText");

  const chipAll = $("chipAll");
  const chipCoupon = $("chipCoupon");
  const chipFast = $("chipFast");

  const fCoupon = $("fCoupon");
  const fFast = $("fFast");
  const minPrice = $("minPrice");
  const maxPrice = $("maxPrice");
  const btnReset = $("btnReset");
  const btnApply = $("btnApply");
  const sortSel = $("sort");
  const loader = $("loader");

  // 카테고리 버튼 active 표시(HTML 수정 없이 onclick 문자열에서 cat 추출)
  const markActiveCategory = () => {
    const btns = document.querySelectorAll(".catNav .catBtn");
    btns.forEach((b) => {
      const oc = (b.getAttribute("onclick") || "").replace(/\s/g, "");
      const m = oc.match(/goCat\(['"](.+?)['"]\)/);
      const c = m ? m[1] : "";
      b.classList.toggle("active", c === category);
    });
  };

  let chipMode = "all";
  let shown = 0;
  const PAGE_SIZE = 12;
  let view = [];

  const setActiveChip = (mode) => {
    chipMode = mode;
    chipAll?.classList.toggle("active", mode === "all");
    chipCoupon?.classList.toggle("active", mode === "coupon");
    chipFast?.classList.toggle("active", mode === "fast");
  };

  // ✅ 핵심: 빈 값은 null 처리 ("" -> null), "0"은 0으로 유지
  const toNumOrNull = (v) => {
    const s = String(v ?? "").trim();
    if (s === "") return null;
    const n = Number(s.replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  const matchKeyword = (p, kw) => {
    if (!kw) return true;
    const k = kw.toLowerCase();
    return (
      String(p.name || "").toLowerCase().includes(k) ||
      String(p.brand || "").toLowerCase().includes(k) ||
      String(p.id || "").toLowerCase().includes(k)
    );
  };

  const applyFilters = () => {
    const min = toNumOrNull(minPrice?.value);
    const max = toNumOrNull(maxPrice?.value);

    let list = ALL.slice();

    if (category && category !== "all") list = list.filter((p) => p.cat === category);
    if (keyword) list = list.filter((p) => matchKeyword(p, keyword));

    // 칩
    if (chipMode === "coupon") list = list.filter((p) => !!p.coupon);
    if (chipMode === "fast") list = list.filter((p) => !!p.fast);

    // 사이드
    if (fCoupon?.checked) list = list.filter((p) => !!p.coupon);
    if (fFast?.checked) list = list.filter((p) => !!p.fast);

    // 가격(빈 값이면 적용 안 함)
    if (min != null) list = list.filter((p) => Number(p.sp) >= min);
    if (max != null) list = list.filter((p) => Number(p.sp) <= max);

    // 정렬
    const sort = sortSel?.value || "popular";
    if (sort === "popular") {
      list.sort(
        (a, b) =>
          (Number(b.reviews || 0) - Number(a.reviews || 0)) ||
          (Number(b.rating || 0) - Number(a.rating || 0))
      );
    } else if (sort === "priceAsc") {
      list.sort((a, b) => Number(a.sp) - Number(b.sp));
    } else if (sort === "priceDesc") {
      list.sort((a, b) => Number(b.sp) - Number(a.sp));
    } else if (sort === "discount") {
      list.sort((a, b) => discountRate(b.op, b.sp) - discountRate(a.op, a.sp));
    }

    view = list;
  };

  const renderMeta = () => {
    const catLabel =
      category === "fashion" ? "패션" :
      category === "beauty" ? "뷰티" :
      category === "digital" ? "디지털" : "전체";

    breadcrumb.textContent = keyword
      ? `홈 > ${catLabel} > “${keyword}” 검색결과`
      : `홈 > ${catLabel}`;

    if (keyword) {
      bannerTitle.textContent = `“${keyword}” 검색 결과`;
      bannerDesc.textContent = `${view.length}개 상품이 검색되었습니다.`;
    } else {
      bannerTitle.textContent = (category === "all") ? "특가 모아보기" : `${catLabel} 모아보기`;
      bannerDesc.textContent = "정렬바 고정 + 무한스크롤 느낌 (샘플)";
    }

    countText.textContent = `${view.length}개`;
  };

  const cardHtml = (p) => {
    const dr = discountRate(p.op, p.sp);
    const tags = [
      p.coupon ? `<span class="tag">쿠폰</span>` : "",
      p.fast ? `<span class="tag">빠른배송</span>` : ""
    ].join("");

    return `
      <article class="pcard" data-pid="${String(p.id)}">
        <img class="pthumb" src="${p.img}" alt="">
        <div class="pname">${p.name}</div>
        <div class="pmeta">${tags}</div>
        <div class="pprice">
          <span class="origin">${formatKRW(p.op)}</span>
          <span class="sale">${formatKRW(p.sp)}</span>
          <span style="margin-left:6px; font-weight:900; color:#b54708;">${dr}%↓</span>
        </div>
        <div class="rating">★ ${Number(p.rating || 0).toFixed(1)} · 리뷰 ${p.reviews ?? 0}</div>
      </article>
    `;
  };

  const renderMore = () => {
    const slice = view.slice(shown, shown + PAGE_SIZE);
    if (!slice.length) return;

    grid.insertAdjacentHTML("beforeend", slice.map(cardHtml).join(""));

    slice.forEach((p) => {
      const el = grid.querySelector(`.pcard[data-pid="${CSS.escape(String(p.id))}"]`);
      el?.addEventListener("click", () => goDetail(p.id));
    });

    shown += slice.length;
  };

  const rerenderAll = () => {
    shown = 0;
    grid.innerHTML = "";
    applyFilters();
    renderMeta();
    renderMore();
  };

  // events
  chipAll?.addEventListener("click", () => { setActiveChip("all"); rerenderAll(); });
  chipCoupon?.addEventListener("click", () => { setActiveChip("coupon"); rerenderAll(); });
  chipFast?.addEventListener("click", () => { setActiveChip("fast"); rerenderAll(); });

  btnApply?.addEventListener("click", rerenderAll);

  btnReset?.addEventListener("click", () => {
    if (fCoupon) fCoupon.checked = false;
    if (fFast) fFast.checked = false;
    if (minPrice) minPrice.value = "";
    if (maxPrice) maxPrice.value = "";
    setActiveChip("all");
    rerenderAll();
  });

  sortSel?.addEventListener("change", rerenderAll);

  if (loader) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) renderMore();
      },
      { rootMargin: "400px" }
    );
    io.observe(loader);
  }

  // init
  markActiveCategory();
  setActiveChip("all");
  rerenderAll();
}
