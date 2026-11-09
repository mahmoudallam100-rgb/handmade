// ===============================================
//  صفحات إفتكس: كلها بتتولّد من البيانات
// ===============================================
import { PRODUCTS, CATS, HUBS, OCCASIONS, CONFIG, byId, catById, inCat, fmt, fmtNum, Cart, toast, waLink, optionsText, esc } from './state.js';
import { Viewer, hasWebGL, thumbnail } from './three-utils.js';
import { Store3D } from './store3d.js';
import { mountBuilder } from './builder.js';

const WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>';
const PLUS = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';

// ———— بطاقات المنتج ————
export function cardHTML(p) {
  const c = catById(p.cat);
  return `<a class="pcard glass" href="#/p/${p.id}" data-id="${p.id}">
    <div class="thumb"><img data-thumb="${p.id}" alt="${esc(p.name)}" loading="lazy" /><span class="ph" aria-hidden="true">${c?.emoji || '✨'}</span>${p.badge ? `<span class="badge ${p.badge === 'الأكثر طلباً' || p.badge === 'جديد' ? 'gold' : ''}">${esc(p.badge)}</span>` : ''}</div>
    <div class="body"><span class="cat">${c?.name || ''}</span><h3>${esc(p.name)}</h3>
      <div class="row"><span class="price">${fmtNum(p.price)} <small>${CONFIG.currency}${p.unit ? ' ' + p.unit : ''}</small>${p.old ? `<s>${fmtNum(p.old)}</s>` : ''}</span>
      <button class="add-mini" type="button" data-add="${p.id}" aria-label="ضيف للسلة">${PLUS}</button></div></div></a>`;
}
export function hydrateThumbs(root) {
  const imgs = root.querySelectorAll('img[data-thumb]');
  if (!hasWebGL) { imgs.forEach((i) => i.remove()); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const img = en.target; const p = byId(img.dataset.thumb) || Cart.items.find((l) => l.id === img.dataset.thumb);
      if (p) { img.src = thumbnail(p); img.onload = () => { const ph = img.parentElement.querySelector('.ph'); ph && ph.remove(); }; }
      io.unobserve(img);
    });
  }, { rootMargin: '200px' });
  imgs.forEach((i) => io.observe(i));
}
export function quickAdd(id) {
  const p = byId(id); if (!p) return;
  const options = {}; if (p.options) Object.entries(p.options).forEach(([k, v]) => { options[k] = v[0]; });
  Cart.add({ id: p.id, name: p.name, price: p.price, qty: p.unit ? 10 : 1, options, model: p.model, colors: p.colors, glitter: p.glitter });
  toast(`${p.name} اتضاف للسلة`);
}

function footerHTML() {
  return `<footer class="wrap"><span>إفتكس © ${new Date().getFullYear()} — كل حاجة اتعملت بإيد</span><span><a href="${waLink('أهلاً إفتكس، عندي استفسار')}" target="_blank" rel="noopener">واتساب</a> · <a href="#/hubs">الهبات</a> · <a href="admin.html">لوحة التحكم</a></span></footer>`;
}

// ———— الرئيسية ————
export function home(root) {
  const featured = PRODUCTS.filter((p) => p.badge).slice(0, 8);
  const hub = HUBS.find((h) => h.active);
  root.innerHTML = `<div class="page wrap">
    <section class="hero">
      <div class="hero-copy">
        <h1>هاند ميد.. بس <em>معروض زي ما عمره ما اتعرض</em></h1>
        <p>إكسسوارات خرز وجليتر، شيكولاتة باسمك، شموع، خشب محفور، وبوكسات هدايا. كل قطعة معمولة بإيد، ومعروضة على أرفف تقدر تلف حواليها وتختار.</p>
        <div class="hero-actions"><a class="btn btn-gold btn-lg" href="#/store">ادخل الأرفف</a><a class="btn btn-ghost btn-lg" href="#/build">اصنع منتجك</a></div>
      </div>
      <div class="hero-stage glass" id="hero-stage">
        <div class="pick glass" id="hero-pick"></div>
        <div class="hint glass">بيلف لوحده.. أو لفّه بإيدك</div>
      </div>
    </section>
    <section class="section promise">
      <div class="glass"><b>معمول عليك</b><span>اسمك، ألوانك، مناسبتك. مفيش قطعتين زي بعض.</span></div>
      <div class="glass"><b>شوفه قبل ما تطلب</b><span>كل منتج ليه مجسّم ثلاثي الأبعاد بيلف قدامك.</span></div>
      <div class="glass"><b>الطلب على واتساب</b><span>سلتك بتتحول لرسالة جاهزة.. ونأكد معاك التفاصيل.</span></div>
      <div class="glass"><b>شحن لكل مصر</b><span>مجاني فوق ${fmt(CONFIG.shipping.freeAbove)}، والتنفيذ من 2 لـ 7 أيام.</span></div>
    </section>
    <section class="section">
      <div class="section-head"><div><h2>الأقسام</h2><p>${esc(hub.intro)}</p></div><a class="link" href="#/store">افتح المتجر ثلاثي الأبعاد</a></div>
      <div class="cats">${CATS.map((c) => `<a class="cat-card glass tone-${c.tone}" href="#/cat/${c.id}"><span class="emoji">${c.emoji}</span><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p><span class="n">${inCat(c.id).length} منتج</span></a>`).join('')}</div>
    </section>
    <section class="section">
      <div class="section-head"><div><h2>الناس بتطلبها كتير</h2><p>اختيارات من كل الأقسام.. جاهزة أو بالاسم.</p></div></div>
      <div class="grid">${featured.map(cardHTML).join('')}</div>
    </section>
    <section class="section bundle glass">
      <div><h2>لمين الهدية؟</h2><p>قولنا المناسبة وهنرشّح لك من الأرفف.</p><div class="chips" style="margin-top:14px">${OCCASIONS.map((o) => `<a class="chip" href="#/occasion/${o.id}">${o.name}</a>`).join('')}</div></div>
      <button class="btn btn-rose btn-lg" type="button" data-open-ai>اسأل المساعد</button>
    </section>
    <section class="section">
      <div class="section-head"><div><h2>إفتكس مش متجر.. مساحة عرض</h2><p>كل "هب" ليه أرففه وأقسامه. النهارده هاند ميد، وبكرة أي حاجة تستاهل تتعرض كده.</p></div><a class="link" href="#/hubs">كل الهبات</a></div>
      <div class="hubs">${HUBS.map((h) => `<a class="hub-card glass ${h.active ? '' : 'off'}" href="#/hub/${h.id}"><h3>${esc(h.name)}</h3><p>${esc(h.intro)}</p>${h.active ? '' : '<span class="st">قريباً</span>'}</a>`).join('')}</div>
    </section>
    ${footerHTML()}
  </div>`;
  hydrateThumbs(root);
  // المسرح: منتجات مميزة بتتبدل
  let viewer = null, timer = null, i = 0;
  const stage = root.querySelector('#hero-stage');
  const cycle = featured.length ? featured : PRODUCTS.slice(0, 6);
  const pick = root.querySelector('#hero-pick');
  const show = () => { const p = cycle[i % cycle.length]; viewer && viewer.set(p.model, p.colors, p.glitter); pick.innerHTML = `<b>${esc(p.name)}</b><span>${fmt(p.price)}</span>`; pick.onclick = () => { location.hash = `#/p/${p.id}`; }; pick.style.cursor = 'pointer'; i++; };
  if (hasWebGL) { viewer = new Viewer(stage); show(); timer = setInterval(show, 4200); } else { stage.innerHTML = `<div class="empty"><div class="big">✨</div>المعاينة 3D مش مدعومة هنا</div>`; }
  return { destroy() { clearInterval(timer); viewer && viewer.destroy(); } };
}

// ———— المتجر ثلاثي الأبعاد ————
export function store(root, params) {
  const storeEl = document.getElementById('store');
  root.classList.add('full'); root.innerHTML = '';
  const cats = CATS.filter((c) => inCat(c.id).length);
  const startIdx = Math.max(0, cats.findIndex((c) => c.id === params.cat));
  if (!hasWebGL) {
    root.classList.remove('full');
    root.innerHTML = `<div class="page wrap"><div class="section-head"><div><h1>الأرفف</h1><p>المتصفح ده مش بيدعم العرض ثلاثي الأبعاد، فدي كل المنتجات في شكل شبكة.</p></div></div>${cats.map((c) => `<section class="section"><div class="section-head"><h2>${c.emoji} ${esc(c.name)}</h2><a class="link" href="#/cat/${c.id}">القسم كامل</a></div><div class="grid">${inCat(c.id).map(cardHTML).join('')}</div></section>`).join('')}${footerHTML()}</div>`;
    hydrateThumbs(root); return { destroy() {} };
  }
  storeEl.hidden = false; document.body.classList.add('in-store');
  storeEl.innerHTML = `<div class="store-hud">
    <div class="store-tabs"><div class="glass">${cats.map((c, k) => `<button type="button" data-i="${k}">${c.emoji} ${esc(c.name)}</button>`).join('')}</div></div>
    <div class="store-label glass glass-strong" id="store-label"></div>
    <div class="store-side glass" id="store-side"></div>
    <div class="store-arrows"><button class="icon-btn" type="button" id="st-prev" aria-label="القسم السابق"><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg></button><button class="icon-btn" type="button" id="st-next" aria-label="القسم التالي"><svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg></button></div>
  </div>`;
  const label = storeEl.querySelector('#store-label'), side = storeEl.querySelector('#store-side');
  const tabs = [...storeEl.querySelectorAll('.store-tabs button')];
  let hovered = null;
  const s3d = new Store3D(storeEl, {
    startCat: startIdx,
    onOpen: (p) => { location.hash = `#/p/${p.id}`; },
    onUnit: (i) => {
      tabs.forEach((b, k) => b.classList.toggle('active', k === i));
      tabs[i]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      const c = cats[i];
      side.innerHTML = `<h2>${c.emoji} ${esc(c.name)}</h2><p>${esc(c.blurb)}</p><div class="buy-row"><a class="btn btn-sm btn-gold" href="#/cat/${c.id}">كل منتجات القسم (${inCat(c.id).length})</a></div><div class="mini" style="margin-top:8px">اسحب يمين وشمال، أو دوس على أي منتج</div>`;
    },
  });
  tabs.forEach((b) => b.addEventListener('click', () => s3d.goto(+b.dataset.i)));
  storeEl.querySelector('#st-prev').onclick = () => s3d.prev();
  storeEl.querySelector('#st-next').onclick = () => s3d.next();
  storeEl.addEventListener('hover', (e) => {
    hovered = e.detail;
    if (hovered) { label.innerHTML = `<b>${esc(hovered.name)}</b><span class="price">${fmt(hovered.price)}</span>`; label.onclick = () => { location.hash = `#/p/${hovered.id}`; }; label.classList.add('on'); }
    else label.classList.remove('on');
  });
  let raf;
  const follow = () => { raf = requestAnimationFrame(follow); if (!hovered) return; const pos = s3d.projectHover(); if (pos) { label.style.left = pos.x + 'px'; label.style.top = pos.y + 'px'; } };
  follow();
  return { destroy() { cancelAnimationFrame(raf); s3d.destroy(); storeEl.hidden = true; storeEl.innerHTML = ''; root.classList.remove('full'); document.body.classList.remove('in-store'); } };
}

// ———— القسم ————
export function category(root, params) {
  const c = catById(params.id); if (!c) return notFound(root);
  let items = inCat(c.id); let sort = 'default';
  const render = () => {
    let list = [...items];
    if (sort === 'low') list.sort((a, b) => a.price - b.price);
    if (sort === 'high') list.sort((a, b) => b.price - a.price);
    root.querySelector('#cat-grid').innerHTML = list.map(cardHTML).join('') || '<div class="empty">مفيش منتجات هنا لسه</div>';
    hydrateThumbs(root);
  };
  root.innerHTML = `<div class="page wrap">
    <div class="cat-hero glass"><div><div class="pinfo"><div class="crumbs"><a href="#/">الرئيسية</a><span>/</span><a href="#/store">الأرفف</a></div></div><h1>${esc(c.name)}</h1><p>${esc(c.blurb)}</p><div class="buy-row" style="margin-top:14px"><a class="btn btn-gold" href="#/store/${c.id}">شوفه على الأرفف 3D</a>${['beads', 'chocolate', 'candles', 'wood'].includes(c.id) ? '<a class="btn btn-ghost" href="#/build">صمّم بنفسك</a>' : ''}</div></div><span class="emoji">${c.emoji}</span></div>
    <div class="filters"><span>${items.length} منتج</span><select id="cat-sort"><option value="default">الترتيب الافتراضي</option><option value="low">السعر: الأقل أولاً</option><option value="high">السعر: الأعلى أولاً</option></select></div>
    <div class="grid" id="cat-grid"></div>
    <section class="section"><div class="section-head"><h2>أقسام تانية</h2></div><div class="cats">${CATS.filter((x) => x.id !== c.id).slice(0, 4).map((x) => `<a class="cat-card glass tone-${x.tone}" href="#/cat/${x.id}"><span class="emoji">${x.emoji}</span><h3>${esc(x.name)}</h3><span class="n">${inCat(x.id).length} منتج</span></a>`).join('')}</div></section>
    ${footerHTML()}</div>`;
  root.querySelector('#cat-sort').addEventListener('change', (e) => { sort = e.target.value; render(); });
  render();
  return { destroy() {} };
}

// ———— المناسبة ————
export function occasion(root, params) {
  const o = OCCASIONS.find((x) => x.id === params.id); if (!o) return notFound(root);
  const items = PRODUCTS.filter((p) => o.cats.includes(p.cat)).sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0));
  root.innerHTML = `<div class="page wrap"><div class="section-head"><div><h1>هدايا ${esc(o.name)}</h1><p>اختيارات متجمعة من ${o.cats.map((c) => catById(c)?.name).join(' و')}.</p></div><button class="btn btn-rose" type="button" data-open-ai>اسأل المساعد عن ${esc(o.name)}</button></div><div class="grid">${items.map(cardHTML).join('')}</div>${footerHTML()}</div>`;
  hydrateThumbs(root); return { destroy() {} };
}

// ———— المنتج ————
export function product(root, params) {
  const p = byId(params.id); if (!p) return notFound(root);
  const c = catById(p.cat);
  const sel = {}; if (p.options) Object.entries(p.options).forEach(([k, v]) => { sel[k] = v[0]; });
  let qty = p.unit ? 10 : 1; let colorIdx = 0;
  const related = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const altColors = [p.colors, [p.colors[1], p.colors[0]], ['#e6c27a', '#ffffff'], ['#f4a7c3', '#d8d8d8']];
  root.innerHTML = `<div class="page wrap"><div class="product">
    <div class="viewer glass" id="p-viewer">${hasWebGL ? '' : `<div class="empty"><div class="big">${c?.emoji || '✨'}</div></div>`}<div class="swatches glass" id="p-swatches">${altColors.map((cc, i) => `<button type="button" class="swatch ${i === 0 ? 'on' : ''}" data-ci="${i}" style="background:linear-gradient(135deg,${cc[0]},${cc[1]})" aria-label="تجربة لون"></button>`).join('')}</div><div class="hint glass">اسحب عشان تلفّه · الألوان فوق للتجربة</div></div>
    <div class="pinfo">
      <div class="crumbs"><a href="#/">الرئيسية</a><span>/</span><a href="#/cat/${p.cat}">${esc(c?.name || '')}</a></div>
      <h1>${esc(p.name)}</h1>
      <div class="price">${fmtNum(p.price)} <small>${CONFIG.currency}${p.unit ? ' ' + p.unit : ''}</small>${p.old ? `<s>${fmtNum(p.old)}</s>` : ''}</div>
      <p class="desc">${esc(p.desc)}</p>
      ${p.options ? Object.entries(p.options).map(([k, vals]) => `<div class="opt"><label>${esc(k)}</label><div class="chips" data-opt="${esc(k)}">${vals.map((v, i) => `<button type="button" class="chip ${i === 0 ? 'on' : ''}" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div></div>`).join('') : ''}
      <div class="opt"><label>ملاحظة للصانع (اختياري)</label><div class="field"><input id="p-note" placeholder="مثلاً: الاسم اللي يتكتب، لون الشريطة.." /></div></div>
      <div class="buy-row"><div class="qty glass"><button type="button" id="p-minus">−</button><span id="p-qty">${qty}</span><button type="button" id="p-plus">+</button></div><button class="btn btn-gold btn-lg" id="p-add" type="button">ضيف للسلة</button><a class="btn btn-wa btn-lg" id="p-wa" target="_blank" rel="noopener">${WA_ICON} اطلب على واتساب</a></div>
      ${p.builder ? `<a class="link" href="#/build?base=${p.model}">صمّم نسختك بألوانك وحروفك من "اصنع منتجك"</a>` : ''}
      <div class="pfeat"><div class="glass"><b>التنفيذ</b>${p.options || p.builder ? '4-7 أيام (مخصص)' : '2-3 أيام'}</div><div class="glass"><b>الشحن</b>لكل المحافظات</div><div class="glass"><b>التغليف</b>بوكس إفتكس + كارت</div></div>
      <div class="tags">${(p.tags || []).map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    </div></div>
    ${related.length ? `<section class="section"><div class="section-head"><h2>من نفس الرف</h2><a class="link" href="#/cat/${p.cat}">كل ${esc(c?.name)}</a></div><div class="grid">${related.map(cardHTML).join('')}</div></section>` : ''}
    ${footerHTML()}</div>`;
  hydrateThumbs(root);
  let viewer = null;
  if (hasWebGL) { viewer = new Viewer(root.querySelector('#p-viewer')); viewer.set(p.model, p.colors, p.glitter); }
  const $ = (s) => root.querySelector(s);
  const line = () => ({ id: p.id, name: p.name, price: p.price, qty, options: { ...sel, ...($('#p-note').value.trim() ? { 'ملاحظة': $('#p-note').value.trim() } : {}) }, model: p.model, colors: altColors[colorIdx], glitter: p.glitter });
  const waText = () => `أهلاً إفتكس 👋\nعايز أطلب: ${p.name}\nالعدد: ${qty}\n${optionsText(line().options) ? 'التفاصيل: ' + optionsText(line().options) + '\n' : ''}السعر: ${fmt(p.price * qty)}\nرابط المنتج: ${location.href}`;
  const upd = () => { $('#p-qty').textContent = qty; $('#p-wa').href = waLink(waText()); };
  root.addEventListener('click', (e) => {
    const ch = e.target.closest('.chips[data-opt] .chip'); if (ch) { const k = ch.parentElement.dataset.opt; sel[k] = ch.dataset.v; ch.parentElement.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === ch)); upd(); }
    const sw = e.target.closest('[data-ci]'); if (sw) { colorIdx = +sw.dataset.ci; root.querySelectorAll('[data-ci]').forEach((x) => x.classList.toggle('on', x === sw)); viewer && viewer.set(p.model, altColors[colorIdx], p.glitter); }
    if (e.target.id === 'p-plus') { qty++; upd(); }
    if (e.target.id === 'p-minus') { qty = Math.max(1, qty - 1); upd(); }
    if (e.target.id === 'p-add') { Cart.add(line()); toast(`${p.name} اتضاف للسلة`); }
  });
  $('#p-note').addEventListener('input', upd);
  upd();
  return { destroy() { viewer && viewer.destroy(); } };
}

// ———— اصنع منتجك ————
export function build(root, params) {
  return mountBuilder(root, { base: params.base });
}

// ———— العروسة ————
export function bride(root) {
  const stages = [
    { when: 'قبل الفرح بشهر', name: 'الشبكة والخطوبة', ids: ['b06', 'o01', 'o06'], tips: ['مراية الشبكة بالخرز', 'بوكس الخطوبة بلون الفستان', 'دعوات الأكريليك'] },
    { when: 'قبل الفرح بأسبوع', name: 'الحنة', ids: ['b03', 's04', 'c05'], tips: ['طرحة الحنة بالخرز', 'شموع الزفة', 'توزيعات شيكولاتة للمعازيم'] },
    { when: 'ليلة الفرح', name: 'الزفة والكوشة', ids: ['b01', 'b05', 'b04'], tips: ['تاج العروسة', 'ستاند الأسماء على الكوشة', 'توزيعة شكر بالاسم'] },
    { when: 'الوصيفات', name: 'الصحبة', ids: ['b02', 'k07', 'k02'], tips: ['بوكس لكل وصيفة بحرف اسمها', 'طقم أساور الصحبة'] },
  ];
  const bundleIds = ['b01', 'b03', 'b06', 'b05'];
  const bundle = bundleIds.map(byId).filter(Boolean);
  const full = bundle.reduce((s, p) => s + p.price, 0), disc = Math.round(full * 0.85);
  root.innerHTML = `<div class="page wrap">
    <section class="bride-hero glass"><h1>كل اللي العروسة محتاجاه</h1><p>من الشبكة للحنة لليلة الفرح.. اختارنا لك من كل رف اللي يليق بيك، ورتبناه على التوقيت عشان متنسيش حاجة.</p><div class="buy-row" style="justify-content:center;margin-top:16px"><a class="btn btn-gold btn-lg" href="#/store/bride">افتح رف العروسة</a><a class="btn btn-wa btn-lg" target="_blank" rel="noopener" href="${waLink('أهلاً إفتكس 👋 أنا عروسة ومحتاجة أنسّق طلبي للفرح، ممكن نتكلم؟')}">${WA_ICON} كلّم مستشارة العروسة</a></div></section>
    <section class="section"><div class="section-head"><div><h2>جدول العروسة</h2><p>كل مرحلة ومعاها اللي بتحتاجه.</p></div></div>
      <div class="timeline">${stages.map((s) => `<div class="tl glass"><span class="when">${s.when}</span><h3>${s.name}</h3><ul>${s.tips.map((t) => `<li>${t}</li>`).join('')}</ul><div class="chips">${s.ids.map(byId).filter(Boolean).map((p) => `<a class="chip" href="#/p/${p.id}">${esc(p.name)}</a>`).join('')}</div></div>`).join('')}</div></section>
    <section class="section bundle glass"><div><h2>باقة العروسة الكاملة</h2><p>${bundle.map((p) => p.name).join(' + ')}. كلهم بنفس اللون والستايل، بخصم 15٪.</p><div class="big" style="margin-top:8px"><s>${fmtNum(full)}</s>${fmt(disc)}</div></div><button class="btn btn-gold btn-lg" id="bundle-add" type="button">ضيف الباقة للسلة</button></section>
    <section class="section"><div class="section-head"><h2>رف العروسة</h2></div><div class="grid">${inCat('bride').map(cardHTML).join('')}</div></section>
    ${footerHTML()}</div>`;
  hydrateThumbs(root);
  root.querySelector('#bundle-add').onclick = () => { Cart.add({ id: 'bundle-bride', name: 'باقة العروسة الكاملة', price: disc, qty: 1, options: { 'المحتوى': bundle.map((p) => p.name).join('، ') }, model: 'tiara', colors: ['#f6e7c1', '#ffffff'], glitter: 0.9 }); toast('باقة العروسة اتضافت للسلة 👰'); };
  return { destroy() {} };
}

// ———— السلة (صفحة) ————
export function cartPage(root) {
  const render = () => {
    const items = Cart.items;
    root.innerHTML = `<div class="page wrap"><div class="section-head"><h1>سلتك</h1>${items.length ? '<button class="link" id="cart-clear" type="button">فضّي السلة</button>' : ''}</div>
      ${items.length ? `<div style="display:grid;gap:10px;max-width:760px">${items.map(lineHTML).join('')}</div>
      <div class="summary glass" style="max-width:760px;margin-top:18px;position:static"><div class="line"><span>الإجمالي قبل الشحن</span><span>${fmt(Cart.subtotal())}</span></div><div class="line"><span>الشحن</span><span>${Cart.subtotal() >= CONFIG.shipping.freeAbove ? 'مجاني' : 'بيتحدد في الخطوة الجاية'}</span></div><a class="btn btn-gold btn-lg" href="#/checkout">إتمام الطلب</a></div>`
      : `<div class="empty glass"><div class="big">🛍️</div>السلة فاضية لسه.. <a class="link" href="#/store">افتح الأرفف</a> أو <a class="link" href="#/build">اصنع منتجك</a></div>`}
      ${footerHTML()}</div>`;
    hydrateThumbs(root);
  };
  const off = Cart.on(render);
  root.addEventListener('click', (e) => { if (e.target.id === 'cart-clear' && confirm('تفضّي السلة؟')) Cart.clear(); });
  return { destroy: off };
}
export function lineHTML(l) {
  const meta = l.customText || optionsText(l.options);
  return `<div class="cline glass"><div class="th"><img data-thumb="${l.id}" alt="" /></div><div><b>${esc(l.name)}</b>${meta ? `<span class="meta">${esc(meta)}</span>` : ''}<div class="price" style="font-size:1rem">${fmt(l.price * l.qty)}</div></div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div class="qty glass"><button type="button" data-q="${esc(l.key)}" data-d="-1">−</button><span>${l.qty}</span><button type="button" data-q="${esc(l.key)}" data-d="1">+</button></div><button class="rm" type="button" data-rm="${esc(l.key)}">حذف</button></div></div>`;
}

// ———— إتمام الطلب ————
export function checkout(root) {
  if (!Cart.items.length) { location.hash = '#/cart'; return { destroy() {} }; }
  const saved = JSON.parse(localStorage.getItem('eftex_customer') || '{}');
  const zones = CONFIG.shipping.zones;
  root.innerHTML = `<div class="page wrap"><div class="section-head"><div><h1>إتمام الطلب</h1><p>املأ بياناتك وهنحوّل الطلب لرسالة واتساب جاهزة.. ونأكد معاك التفاصيل والدفع.</p></div></div>
  <form class="checkout" id="co">
    <div class="form glass">
      <div class="two"><div class="field"><label>الاسم</label><input name="name" required value="${esc(saved.name || '')}" /><span class="err">اكتب اسمك</span></div><div class="field"><label>رقم الموبايل</label><input name="phone" required inputmode="tel" value="${esc(saved.phone || '')}" placeholder="01xxxxxxxxx" /><span class="err">رقم مصري 11 رقم</span></div></div>
      <div class="field"><label>المنطقة</label><select name="zone">${zones.map((z) => `<option value="${z.id}" ${saved.zone === z.id ? 'selected' : ''}>${z.name} — ${z.price ? fmt(z.price) : 'مجاني'}</option>`).join('')}</select></div>
      <div class="field" id="addr-f"><label>العنوان بالتفصيل</label><textarea name="address" rows="2">${esc(saved.address || '')}</textarea><span class="err">اكتب العنوان</span></div>
      <div class="field"><label>الطلب محتاج يوصل قبل تاريخ؟ (اختياري)</label><input name="date" type="date" /></div>
      <div class="field"><label>طريقة الدفع</label><div class="pay"><label><input type="radio" name="pay" value="كاش عند الاستلام" checked /><span>كاش عند الاستلام</span></label><label><input type="radio" name="pay" value="إنستاباي" /><span>إنستاباي</span></label><label><input type="radio" name="pay" value="فودافون كاش" /><span>فودافون كاش</span></label></div></div>
      <div class="field"><label>ملاحظات</label><textarea name="notes" rows="2" placeholder="أي تفاصيل للصانع: أسماء، ألوان، كارت مكتوب.."></textarea></div>
    </div>
    <div class="summary glass">
      <h3>ملخص الطلب</h3>
      ${Cart.items.map((l) => `<div class="line"><span>${esc(l.name)} × ${l.qty}</span><span>${fmt(l.price * l.qty)}</span></div>`).join('')}
      <div class="line"><span>الشحن</span><span id="co-ship"></span></div>
      <div class="line big"><span>الإجمالي</span><b id="co-total"></b></div>
      <button class="btn btn-wa btn-lg" type="submit">${WA_ICON} ابعت الطلب على واتساب</button>
      <span class="note">بعد ما تبعت الرسالة هنرد عليك بتأكيد الطلب ومدة التنفيذ. مفيش دفع على الموقع.</span>
    </div>
  </form>${footerHTML()}</div>`;
  const form = root.querySelector('#co');
  const ship = () => { const z = zones.find((x) => x.id === form.zone.value); return Cart.subtotal() >= CONFIG.shipping.freeAbove || z.id === 'pickup' ? 0 : z.price; };
  const upd = () => { root.querySelector('#co-ship').textContent = ship() ? fmt(ship()) : 'مجاني'; root.querySelector('#co-total').textContent = fmt(Cart.subtotal() + ship()); root.querySelector('#addr-f').style.display = form.zone.value === 'pickup' ? 'none' : ''; };
  form.zone.addEventListener('change', upd); upd();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    const f = (name, test) => { const el = form[name].closest('.field'); const bad = !test(form[name].value.trim()); el.classList.toggle('bad', bad); if (bad) ok = false; };
    f('name', (v) => v.length >= 2); f('phone', (v) => /^01[0-9]{9}$/.test(v.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)))); if (form.zone.value !== 'pickup') f('address', (v) => v.length >= 5);
    if (!ok) return;
    const z = zones.find((x) => x.id === form.zone.value);
    localStorage.setItem('eftex_customer', JSON.stringify({ name: form.name.value, phone: form.phone.value, zone: z.id, address: form.address.value }));
    const no = 'EF-' + Date.now().toString(36).toUpperCase().slice(-6);
    const lines = Cart.items.map((l, i) => `${i + 1}) ${l.name} × ${l.qty} = ${fmt(l.price * l.qty)}${(l.customText || optionsText(l.options)) ? '\n   ↳ ' + (l.customText || optionsText(l.options)) : ''}`).join('\n');
    const msg = `🧾 طلب جديد من إفتكس — رقم ${no}\n\n${lines}\n\nالمجموع: ${fmt(Cart.subtotal())}\nالشحن (${z.name}): ${ship() ? fmt(ship()) : 'مجاني'}\nالإجمالي: ${fmt(Cart.subtotal() + ship())}\n\n👤 ${form.name.value}\n📱 ${form.phone.value}\n📍 ${z.id === 'pickup' ? 'استلام من الورشة' : form.address.value}\n💳 ${form.pay.value}${form.date.value ? '\n📅 مطلوب قبل: ' + form.date.value : ''}${form.notes.value.trim() ? '\n📝 ' + form.notes.value.trim() : ''}`;
    window.open(waLink(msg), '_blank');
    root.innerHTML = `<div class="page wrap"><div class="empty glass" style="max-width:640px;margin:40px auto"><div class="big">🎉</div><h2>طلبك ${no} جاهز على واتساب</h2><p>لو الواتساب مفتحش لوحده، <a class="link" target="_blank" rel="noopener" href="${waLink(msg)}">دوس هنا</a>. هنرد عليك بالتأكيد ومدة التنفيذ.</p><div class="buy-row" style="justify-content:center"><a class="btn btn-gold" href="#/store">ارجع للأرفف</a><button class="btn btn-ghost" id="co-done" type="button">فضّي السلة</button></div></div></div>`;
    root.querySelector('#co-done').onclick = () => { Cart.clear(); location.hash = '#/'; };
  });
  return { destroy() {} };
}

// ———— الهبات ————
export function hubs(root) {
  root.innerHTML = `<div class="page wrap"><div class="section-head"><div><h1>الهبات</h1><p>إفتكس مبنية كمساحة عرض: كل هب متجر كامل بأرففه وأقسامه ومنتجاته. ابدأنا بالهاند ميد.</p></div></div>
    <div class="hubs">${HUBS.map((h) => `<a class="hub-card glass ${h.active ? '' : 'off'}" href="#/hub/${h.id}"><h3>${esc(h.name)}</h3><p>${esc(h.intro)}</p>${h.active ? `<span class="st" style="color:var(--gold)">${CATS.filter((c) => c.hub === h.id).length} أقسام · ${PRODUCTS.length} منتج</span>` : '<span class="st">قريباً</span>'}</a>`).join('')}</div>
    <section class="section bundle glass"><div><h2>عندك حاجة تستاهل تتعرض كده؟</h2><p>لو بتصنّع أو بتبيع حاجة مميزة وعايزها تبقى هب على إفتكس، كلمنا.</p></div><a class="btn btn-wa btn-lg" target="_blank" rel="noopener" href="${waLink('أهلاً إفتكس 👋 عايز أقترح هب جديد على المنصة: ')}">${WA_ICON} اقترح هب</a></section>${footerHTML()}</div>`;
  return { destroy() {} };
}
export function hub(root, params) {
  const h = HUBS.find((x) => x.id === params.id); if (!h) return notFound(root);
  if (!h.active) { root.innerHTML = `<div class="page wrap"><div class="empty glass" style="max-width:640px;margin:40px auto"><div class="big">🔭</div><h2>${esc(h.name)}</h2><p>${esc(h.intro)}</p><a class="btn btn-gold" href="#/hubs">كل الهبات</a></div></div>`; return { destroy() {} }; }
  const cats = CATS.filter((c) => c.hub === h.id);
  root.innerHTML = `<div class="page wrap"><div class="section-head"><div><h1>${esc(h.name)}</h1><p>${esc(h.intro)}</p></div><a class="btn btn-gold" href="#/store">افتح الأرفف</a></div><div class="cats">${cats.map((c) => `<a class="cat-card glass tone-${c.tone}" href="#/cat/${c.id}"><span class="emoji">${c.emoji}</span><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p><span class="n">${inCat(c.id).length} منتج</span></a>`).join('')}</div>${footerHTML()}</div>`;
  return { destroy() {} };
}

export function notFound(root) {
  root.innerHTML = `<div class="page wrap"><div class="empty glass" style="max-width:560px;margin:60px auto"><div class="big">🫥</div><h2>الصفحة دي مش على الرف</h2><p>يمكن اتنقلت أو الرابط غلط.</p><a class="btn btn-gold" href="#/">الرئيسية</a></div></div>`;
  return { destroy() {} };
}
