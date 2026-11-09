// ===============================================
//  إفتكس — نقطة البداية: المقدمة، الراوتر، الدرج، البحث، المساعد
// ===============================================
import { PRODUCTS, CATS, HUBS, CONFIG, byId, catById, fmt, Cart, toast, esc, prefersReducedMotion } from './state.js';
import * as pages from './pages.js';
import { hydrateThumbs, quickAdd, lineHTML } from './pages.js';
import { chat, aiMode } from './ai.js';

// ———— الراوتر ————
const ROUTES = [
  [/^\/?$/, pages.home, 'home'],
  [/^\/store(?:\/([\w-]+))?$/, pages.store, 'store', ['cat']],
  [/^\/cat\/([\w-]+)$/, pages.category, 'store', ['id']],
  [/^\/occasion\/([\w-]+)$/, pages.occasion, 'home', ['id']],
  [/^\/p\/([\w-]+)$/, pages.product, 'store', ['id']],
  [/^\/build$/, pages.build, 'build'],
  [/^\/bride$/, pages.bride, 'bride'],
  [/^\/cart$/, pages.cartPage, 'cart'],
  [/^\/checkout$/, pages.checkout, 'cart'],
  [/^\/hubs$/, pages.hubs, 'home'],
  [/^\/hub\/([\w-]+)$/, pages.hub, 'home', ['id']],
];
const view = document.getElementById('view');
const curtain = document.getElementById('curtain');
let current = null, first = true, navToken = 0;

function parse() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  for (const [re, fn, nav, keys = []] of ROUTES) {
    const m = path.match(re);
    if (m) { keys.forEach((k, i) => { if (m[i + 1]) params[k] = m[i + 1]; }); return { fn, nav, params }; }
  }
  return { fn: pages.notFound, nav: '', params };
}
async function navigate() {
  const token = ++navToken;
  const { fn, nav, params } = parse();
  const useCurtain = !first && !prefersReducedMotion();
  if (useCurtain) { curtain.classList.remove('out'); curtain.classList.add('in'); await wait(420); if (token !== navToken) return; }
  if (current) { try { current.destroy(); } catch (e) { console.warn(e); } current = null; }
  view.classList.remove('full'); view.scrollTop = 0; window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelectorAll('#dock a').forEach((a) => a.classList.toggle('active', a.dataset.route === nav));
  current = fn(view, params) || { destroy() {} };
  document.title = pageTitle();
  if (useCurtain) { curtain.classList.add('out'); await wait(80); curtain.classList.remove('in'); setTimeout(() => curtain.classList.remove('out'), 500); }
  first = false;
}
function pageTitle() {
  const { params, nav } = parse();
  const p = params.id && byId(params.id); const c = params.id && catById(params.id);
  const base = 'إفتكس';
  if (p) return `${p.name} — ${base}`; if (c) return `${c.name} — ${base}`;
  return { store: 'الأرفف — إفتكس', build: 'اصنع منتجك — إفتكس', bride: 'العروسة — إفتكس', cart: 'السلة — إفتكس' }[nav] || 'إفتكس — منصة الهاند ميد';
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
window.addEventListener('hashchange', navigate);

// ———— المقدمة: جليتر بيتجمع على شكل الاسم ————
async function intro() {
  const el = document.getElementById('intro');
  if (prefersReducedMotion() || sessionStorage.getItem('eftex_intro')) { el.classList.add('out'); setTimeout(() => el.remove(), 900); return; }
  sessionStorage.setItem('eftex_intro', '1');
  const cv = el.querySelector('canvas'), x = cv.getContext('2d');
  const W = cv.width = innerWidth * Math.min(devicePixelRatio, 2), H = cv.height = innerHeight * Math.min(devicePixelRatio, 2);
  try { await document.fonts.load('500 120px "Marhey"'); } catch { /* ok */ }
  // نرسم النص في كانفاس مخفي ونجمع النقط
  const off = document.createElement('canvas'); off.width = W; off.height = H; const ox = off.getContext('2d');
  const fs = Math.min(W * 0.22, H * 0.3);
  ox.font = `500 ${fs}px "Marhey", "Tajawal", sans-serif`; ox.textAlign = 'center'; ox.textBaseline = 'middle'; ox.direction = 'rtl'; ox.fillStyle = '#fff';
  ox.fillText('إفتكس', W / 2, H / 2 - fs * 0.05);
  const data = ox.getImageData(0, 0, W, H).data, step = Math.max(3, Math.round(W / 260)), targets = [];
  for (let y = 0; y < H; y += step) for (let xx = 0; xx < W; xx += step) if (data[(y * W + xx) * 4 + 3] > 120) targets.push([xx, y]);
  const parts = targets.map(([tx, ty]) => ({ tx, ty, x: Math.random() * W, y: Math.random() * H, c: Math.random() < 0.7 ? '#e6c27a' : Math.random() < 0.5 ? '#f4a7c3' : '#fff6e3', r: (0.9 + Math.random() * 1.6) * (W / 900), d: Math.random() * 0.4, vx: 0, vy: 0 }));
  let t0 = performance.now(), done = false;
  el.querySelector('.skip').onclick = () => finish();
  function finish() { if (done) return; done = true; el.classList.add('out'); setTimeout(() => el.remove(), 950); }
  function frame(now) {
    if (done) return;
    const t = (now - t0) / 1000;
    x.clearRect(0, 0, W, H);
    const phase = t < 2.2 ? 'gather' : 'burst';
    if (t > 1.3) el.classList.add('show-tag');
    for (const p of parts) {
      if (phase === 'gather') { const k = Math.min(1, Math.max(0, (t - p.d) / 1.5)); const e = 1 - Math.pow(1 - k, 3); p.x += (p.tx - p.x) * (0.08 + e * 0.1); p.y += (p.ty - p.y) * (0.08 + e * 0.1); }
      else { if (!p.vx && !p.vy) { const a = Math.atan2(p.y - H / 2, p.x - W / 2) + (Math.random() - 0.5); const s = (2 + Math.random() * 10) * (W / 900); p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s - 2; } p.x += p.vx; p.y += p.vy; p.vy += 0.15; }
      const tw = 0.6 + Math.sin(t * 8 + p.d * 30) * 0.4;
      x.globalAlpha = phase === 'burst' ? Math.max(0, 1 - (t - 2.2) * 1.4) : tw;
      x.fillStyle = p.c; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.28); x.fill();
    }
    x.globalAlpha = 1;
    if (t > 3.0) finish(); else requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ———— الهيدر والدرج ————
const drawer = document.getElementById('cart-drawer'), backdrop = document.getElementById('backdrop');
function openCart() { renderDrawer(); drawer.classList.add('open'); backdrop.classList.add('on'); }
function closeCart() { drawer.classList.remove('open'); backdrop.classList.remove('on'); }
document.getElementById('cart-btn').onclick = openCart;
document.getElementById('cart-close').onclick = closeCart;
backdrop.onclick = () => { closeCart(); closeSearch(); };
document.getElementById('cart-go').onclick = closeCart;
function renderDrawer() {
  const box = document.getElementById('cart-lines');
  box.innerHTML = Cart.items.length ? Cart.items.map(lineHTML).join('') : `<div class="empty"><div class="big">🛍️</div>السلة فاضية.. <a class="link" href="#/store">افتح الأرفف</a></div>`;
  hydrateThumbs(box);
  document.getElementById('cart-total').textContent = fmt(Cart.subtotal());
}
Cart.on(() => { const n = Cart.count(); const b = document.getElementById('cart-count'); b.dataset.n = n; b.textContent = n || ''; if (drawer.classList.contains('open')) renderDrawer(); });
document.getElementById('hub-btn').onclick = () => { location.hash = '#/hubs'; };
document.getElementById('hub-name').textContent = HUBS.find((h) => h.active)?.short || 'هاند ميد';

// أحداث عامة (أزرار الإضافة والكمية والحذف وفتح المساعد)
document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]'); if (add) { e.preventDefault(); e.stopPropagation(); quickAdd(add.dataset.add); return; }
  const q = e.target.closest('[data-q]'); if (q) { const l = Cart.items.find((x) => x.key === q.dataset.q); if (l) Cart.setQty(l.key, l.qty + (+q.dataset.d)); return; }
  const rm = e.target.closest('[data-rm]'); if (rm) { Cart.remove(rm.dataset.rm); return; }
  if (e.target.closest('[data-open-ai]')) { openAI(); return; }
  if (e.target.closest('#dock a[data-route="cart"]')) { /* صفحة السلة */ }
  const inDrawer = e.target.closest('#cart-drawer a[href^="#/"]'); if (inDrawer) closeCart();
});

// ———— البحث ————
const search = document.getElementById('search'), sInput = document.getElementById('search-input'), sRes = document.getElementById('search-res');
function openSearch() { search.classList.add('on'); setTimeout(() => sInput.focus(), 50); doSearch(); }
function closeSearch() { search.classList.remove('on'); }
document.getElementById('search-btn').onclick = openSearch;
search.addEventListener('click', (e) => { if (e.target === search) closeSearch(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSearch(); closeCart(); closeAI(); } if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); } });
const norm = (s) => String(s).replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase();
function doSearch() {
  const q = norm(sInput.value.trim());
  const list = (q ? PRODUCTS.filter((p) => norm([p.name, p.desc, ...(p.tags || []), catById(p.cat)?.name].join(' ')).includes(q)) : PRODUCTS.filter((p) => p.badge)).slice(0, 8);
  sRes.innerHTML = list.map((p) => `<a href="#/p/${p.id}"><b style="font-weight:500">${esc(p.name)}</b><span>${fmt(p.price)}</span></a>`).join('') || `<div class="empty">مفيش نتيجة.. جرّب كلمة تانية أو <a class="link" href="#/build">اصنعه بنفسك</a></div>`;
}
sInput.addEventListener('input', doSearch);
sRes.addEventListener('click', (e) => { if (e.target.closest('a')) closeSearch(); });
sInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const a = sRes.querySelector('a'); if (a) { location.hash = a.getAttribute('href'); closeSearch(); } } });

// ———— المساعد الذكي ————
const aiPanel = document.getElementById('ai-panel'), aiBody = document.getElementById('ai-body'), aiChips = document.getElementById('ai-chips'), aiForm = document.getElementById('ai-form'), aiInput = document.getElementById('ai-input');
const history = []; let greeted = false;
document.getElementById('ai-mode').textContent = aiMode() === 'local' ? 'بيقترح عليك هدايا حسب المناسبة والميزانية' : `مدعوم بـ ${aiMode() === 'claude' ? 'Claude' : 'Gemini'}`;
function openAI() { aiPanel.classList.add('open'); if (!greeted) { greeted = true; bot({ text: 'أهلاً! أنا مساعد إفتكس 👋 قولي لمين الهدية والمناسبة وميزانيتك، وأنا أختار لك من الأرفف.', items: [], chips: ['هدية لصاحبتي بـ 300', 'خطوبة أختي', 'بوكس للرجالة', 'توزيعات سبوع', 'إزاي الشحن؟'] }); } setTimeout(() => aiInput.focus(), 300); }
function closeAI() { aiPanel.classList.remove('open'); }
document.getElementById('ai-fab').onclick = () => aiPanel.classList.contains('open') ? closeAI() : openAI();
document.getElementById('ai-close').onclick = closeAI;
function bot(r) {
  const d = document.createElement('div'); d.className = 'msg bot';
  d.innerHTML = esc(r.text) + (r.link ? ` <a class="link" href="${r.link}">افتحها</a>` : '') + (r.items?.length ? `<div class="recs">${r.items.map(({ p, why }) => `<a class="rec" href="#/p/${p.id}"><span style="color:var(--pearl)">${esc(p.name)}${why?.length ? `<small class="why">${esc(why.join(' · '))}</small>` : ''}</span><span>${fmt(p.price)}</span></a>`).join('')}</div>` : '');
  aiBody.appendChild(d); aiBody.scrollTop = aiBody.scrollHeight;
  aiChips.innerHTML = (r.chips || []).map((c) => `<button type="button" class="chip">${esc(c)}</button>`).join('');
  history.push({ role: 'assistant', content: r.text });
}
async function ask(text) {
  if (!text.trim()) return;
  const me = document.createElement('div'); me.className = 'msg me'; me.textContent = text; aiBody.appendChild(me);
  history.push({ role: 'user', content: text });
  const ty = document.createElement('div'); ty.className = 'msg bot typing'; ty.innerHTML = '<i></i><i></i><i></i>'; aiBody.appendChild(ty); aiBody.scrollTop = aiBody.scrollHeight;
  aiInput.value = ''; aiChips.innerHTML = '';
  if (/أصممها بنفسي|اصممها بنفسي|اصنع/.test(text)) { await wait(400); ty.remove(); bot({ text: 'تمام! افتح "اصنع منتجك"، اوصف اللي في دماغك وهو هيتحوّل لتصميم 3D.', items: [], link: '#/build' }); return; }
  const r = await chat(text, history.slice(0, -1));
  await wait(300); ty.remove(); bot(r);
}
aiForm.addEventListener('submit', (e) => { e.preventDefault(); ask(aiInput.value); });
aiChips.addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (c) ask(c.textContent); });
aiBody.addEventListener('click', (e) => { if (e.target.closest('a')) closeAI(); });

// ———— انطلاق ————
intro();
navigate();
