// src/lib/utils.js
export const $ = (id) => document.getElementById(id);

export function getQueryParams() {
  const p = new URLSearchParams(location.search);
  return Object.fromEntries(p.entries());
}

export function formatKRW(n) {
  const v = Number(n ?? 0);
  return v.toLocaleString("ko-KR") + "원";
}

export function discountRate(op, sp) {
  const o = Number(op ?? 0);
  const s = Number(sp ?? 0);
  if (!o || o <= 0) return 0;
  const r = Math.round(((o - s) / o) * 100);
  return Math.max(0, Math.min(99, r));
}

export function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  // fallback
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
  return Promise.resolve();
}
