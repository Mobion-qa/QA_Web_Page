// /src/lib/spa_router.js
const VIEW_SEL = "[data-router-view]";

function isSameOrigin(url) {
  try { return new URL(url, location.href).origin === location.origin; }
  catch { return false; }
}

function normalizePath(pathname) {
  // index는 / 또는 /index.html로 올 수 있음
  if (pathname === "/" || pathname === "/index.html") return "/index.html";
  return pathname;
}

async function fetchDoc(url) {
  const res = await fetch(url, { headers: { "X-Partial": "1" } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  return new DOMParser().parseFromString(html, "text/html");
}

// ✅ “페이지별 init”을 URL 기준으로 직접 호출
async function runPageInit(pathname) {
  pathname = normalizePath(pathname);

  // 루트 index
  if (pathname === "/index.html") {
    const mod = await import("../pages/home.js"); // (예시) 없다면 index에서 하던 로직을 여기로 옮기기
    mod.initHome?.();
    return;
  }

  // /html/*
  if (pathname === "/html/product_list.html") {
    const mod = await import("../pages/product_list.js");
    mod.initProductList?.();
    return;
  }
  if (pathname === "/html/product_detail.html") {
    const mod = await import("../pages/product_detail.js");
    mod.initProductDetail?.();
    return;
  }
  if (pathname === "/html/cart.html") {
    const mod = await import("../pages/cart.js");
    mod.initCart?.();
    return;
  }
  if (pathname === "/html/mypage.html") {
    const mod = await import("../pages/mypage.js");
    mod.initMyPage?.();
    return;
  }
  if (pathname === "/html/complete.html") {
    const mod = await import("../pages/complete.js");
    mod.initComplete?.();
    return;
  }
  if (pathname === "/html/order_detail.html") {
    const mod = await import("../pages/order_detail.js");
    mod.initOrderDetail?.();
    return;
  }
}

export async function spaNavigate(url, { push = true } = {}) {
  const currentView = document.querySelector(VIEW_SEL);
  if (!currentView) return (location.href = url);

  document.documentElement.classList.add("is-navigating");

  const nextDoc = await fetchDoc(url);
  const nextView = nextDoc.querySelector(VIEW_SEL);
  if (!nextView) return (location.href = url);

  currentView.innerHTML = nextView.innerHTML;
  document.title = nextDoc.title;

  if (push) history.pushState({}, "", url);

  // DOM 교체 후 init 실행
  await runPageInit(location.pathname);

  requestAnimationFrame(() => {
    document.documentElement.classList.remove("is-navigating");
  });
}

export function enableSpaLinks() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    // 외부/새탭/다운로드/수정키는 그대로
    if (!isSameOrigin(a.href)) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    spaNavigate(a.getAttribute("href"));
  });

  window.addEventListener("popstate", () => {
    spaNavigate(location.pathname + location.search, { push: false });
  });
}
