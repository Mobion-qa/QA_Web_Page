// src/lib/nav.js

export function carryQuery(add = {}, opts = {}) {
  const drop = new Set([
    "pid", "id", "product_id",
    "keyword", "q",
    "order_id", "autobuy"
  ]);
  (opts.drop || []).forEach(k => drop.add(k));

  const base = new URLSearchParams(location.search);
  for (const k of drop) base.delete(k);

  let addParams;
  if (typeof add === "string") {
    const s = add.startsWith("?") ? add.slice(1) : add;
    addParams = new URLSearchParams(s);
  } else if (add instanceof URLSearchParams) {
    addParams = add;
  } else {
    addParams = new URLSearchParams();
    for (const [k, v] of Object.entries(add || {})) {
      if (v === undefined || v === null || v === "") continue;
      addParams.set(k, String(v));
    }
  }

  for (const [k, v] of addParams.entries()) base.set(k, v);
  return base.toString(); // no leading '?'
}

function baseHtmlPath() {
  // index.html(루트)에서 호출하면 /html/로 보내야 함
  return location.pathname.includes("/html/") ? "." : "./html";
}

export function goCat(category) {
  const base = baseHtmlPath();
  location.href = `${base}/product_list.html?${carryQuery({ category }, { drop: ["keyword", "q"] })}`;
}

export function goDetail(pid) {
  if (!pid) return;
  const base = baseHtmlPath();
  location.href = `${base}/product_detail.html?${carryQuery({ pid }, { drop: ["keyword", "q"] })}`;
}

export function goHome() {
  location.href = location.pathname.includes("/html/") ? "../index.html" : "./index.html";
}
