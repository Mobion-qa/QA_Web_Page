// src/lib/header_loader.js
export async function mountHeader(targetId = "appHeader") {
  const el = document.getElementById(targetId);
  if (!el) return;

  const inHtmlFolder = location.pathname.includes("/html/");
  const base = inHtmlFolder ? "." : "./html";
  const url = inHtmlFolder ? "./partials/header.html" : "./html/partials/header.html";

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error("header fetch failed:", res.status, url);
      el.innerHTML = "";
      return;
    }

    el.innerHTML = await res.text();

    // ✅ 헤더 주입 후: 링크 보정
    const home = el.querySelector("#hdrHome");
    const cart = el.querySelector("#hdrCart");
    const list = el.querySelector("#hdrList");
    const my = el.querySelector("#hdrMy");

    home?.setAttribute("href", inHtmlFolder ? "../index.html" : "./index.html");
    cart?.setAttribute("href", `${base}/cart.html`);
    list?.setAttribute("href", `${base}/product_list.html`);
    my?.setAttribute("href", `${base}/mypage.html`);

    // ✅ 헤더 주입 후: 검색 submit 가로채기 + 검색어 유지
    const form = el.querySelector("#searchForm");
    const input = el.querySelector("#searchInput");

    // (1) URL 파라미터(keyword)가 있으면 input에 채워서 유지
    const params = new URLSearchParams(location.search);
    const kw = params.get("keyword") || "";
    if (input) input.value = kw;

    // (2) 검색 시: 새로고침 방지 + keyword를 URL에 반영 (기존 파라미터도 유지)
    form?.addEventListener("submit", (e) => {
      e.preventDefault();

      const keyword = (input?.value || "").trim();
      if (!keyword) return;

      const next = new URLSearchParams(location.search);
      next.set("keyword", keyword);

      location.href = `${base}/product_list.html?${next.toString()}`;
    });
  } catch (e) {
    console.error("header fetch error:", url, e);
    el.innerHTML = "";
  }
}
