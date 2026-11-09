// ===============================================
//  الحالة العامة: البيانات، السلة، أدوات مساعدة
// ===============================================
import { CONFIG } from './config.js';
import { HUBS, CATEGORIES, PRODUCTS as BASE_PRODUCTS, OCCASIONS } from './data.js';

const OVERRIDE_KEY = 'eftex_catalog_override';
const CART_KEY = 'eftex_cart_v1';

// لو لوحة التحكم حفظت كتالوج معدّل في المتصفح، بنستخدمه
function loadCatalog() {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (Array.isArray(o.products) && o.products.length) {
        return { products: o.products, categories: Array.isArray(o.categories) && o.categories.length ? o.categories : CATEGORIES };
      }
    }
  } catch (e) { /* تجاهل */ }
  return { products: BASE_PRODUCTS, categories: CATEGORIES };
}

const catalog = loadCatalog();
export const PRODUCTS = catalog.products;
export const CATS = catalog.categories;
export { HUBS, OCCASIONS, CONFIG };

export const byId = (id) => PRODUCTS.find((p) => p.id === id);
export const catById = (id) => CATS.find((c) => c.id === id);
export const inCat = (id) => PRODUCTS.filter((p) => p.cat === id);
export const fmt = (n) => `${Math.round(n).toLocaleString('ar-EG')} ${CONFIG.currency}`;
export const fmtNum = (n) => Math.round(n).toLocaleString('ar-EG');

// ———— السلة ————
const listeners = new Set();
function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}
let cart = readCart();
function save() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  listeners.forEach((fn) => fn(cart));
}
export const Cart = {
  get items() { return cart; },
  on(fn) { listeners.add(fn); fn(cart); return () => listeners.delete(fn); },
  count() { return cart.reduce((s, l) => s + l.qty, 0); },
  subtotal() { return cart.reduce((s, l) => s + l.price * l.qty, 0); },
  add(line) {
    // line: { id, name, price, qty, options, custom?, model, colors, glitter }
    const key = JSON.stringify([line.id, line.options || {}, line.custom || null]);
    const found = cart.find((l) => l.key === key);
    if (found) found.qty += line.qty || 1;
    else cart.push({ ...line, key, qty: line.qty || 1 });
    save();
  },
  setQty(key, qty) {
    const l = cart.find((x) => x.key === key);
    if (!l) return;
    l.qty = Math.max(0, qty);
    if (l.qty === 0) cart = cart.filter((x) => x.key !== key);
    save();
  },
  remove(key) { cart = cart.filter((x) => x.key !== key); save(); },
  clear() { cart = []; save(); },
};

// ———— توست ————
let toastTimer;
export function toast(text) {
  const t = document.getElementById('toast');
  document.getElementById('toast-text').textContent = text;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
}

// ———— واتساب ————
export function waLink(text) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function optionsText(options) {
  if (!options) return '';
  return Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(' • ');
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
