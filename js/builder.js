// ===============================================
//  اصنع منتجك بنفسك: اختيار النوع والألوان والتعليقة والحروف
//  مع معاينة 3D حية وسعر بيتحسب لحظياً، ووصف بالكلام → تصميم (AI)
// ===============================================
import { Viewer, hasWebGL } from './three-utils.js';
import { starGeo, heartGeo } from './models.js';
import { Cart, fmt, toast, esc } from './state.js';
import { interpretDesignAI, aiMode } from './ai.js';

export const BASES = [
  { id: 'bracelet', name: 'إسورة', e: '📿', base: 90, charm: 15, letter: 8, hint: 'خرز كريستال أو لؤلؤ' },
  { id: 'necklace', name: 'سلسلة', e: '✨', base: 150, charm: 25, letter: 0, hint: 'سلسلة ذهبي أو فضي' },
  { id: 'phonecharm', name: 'تعليقة موبايل', e: '📱', base: 70, charm: 12, letter: 8, hint: 'بتركب على أي جراب' },
  { id: 'keychain', name: 'ميدالية ريزن', e: '🔑', base: 60, charm: 10, letter: 0, hint: 'ريزن شفاف بالجليتر' },
  { id: 'candle', name: 'شمعة', e: '🕯️', base: 140, charm: 0, letter: 5, hint: 'صويا، اختار الريحة' },
  { id: 'sign', name: 'لوحة خشب', e: '🪵', base: 220, charm: 0, letter: 6, hint: 'أبلكاش محفور ليزر' },
  { id: 'chocolate', name: 'بار شيكولاتة', e: '🍫', base: 70, charm: 0, letter: 3, hint: 'بيتكتب بالشيكولاتة البيضا' },
];
export const PALETTE = [
  ['#ffffff', 'أبيض لؤلؤ'], ['#f4a7c3', 'وردي'], ['#e6c27a', 'ذهبي'], ['#d8d8d8', 'فضي'], ['#7fb3d5', 'سماوي'], ['#c0392b', 'أحمر'],
  ['#8fc9a8', 'نعناعي'], ['#9b7bd1', 'لافندر'], ['#2a9d8f', 'تركواز'], ['#1d1230', 'أسود'], ['#f6e7c1', 'بيج'], ['#7a1f2b', 'عنابي'], ['#f28c28', 'برتقالي'], ['#ffd166', 'أصفر'],
];
const EXTRAS = {
  candle: { label: 'الريحة', key: 'scent', values: ['فانيليا وعنبر', 'لافندر', 'ورد وعود', 'ليمون ونعناع', 'قهوة'] },
  sign: { label: 'المقاس', key: 'size', values: ['30×20', '45×30', '60×40'], add: [0, 90, 200] },
  chocolate: { label: 'النكهة', key: 'flavor', values: ['ميلك', 'دارك', 'أبيض', 'لوتس'] },
  necklace: { label: 'المعدن', key: 'metal', values: ['ذهبي', 'فضي', 'روز جولد'] },
};
const CHARMS = [['star', 'نجمة ⭐'], ['heart', 'قلب ❤️'], ['none', 'من غير']];

export function mountBuilder(root, initial = {}) {
  const S = { base: initial.base || 'bracelet', colors: initial.colors || ['#ffffff', '#f4a7c3', '#e6c27a'], charm: initial.charm || 'star', letters: initial.letters || '', glitter: initial.glitter ?? 0.6, extra: {}, qty: 1, slot: 0 };

  root.innerHTML = `
  <div class="page wrap">
    <div class="section-head"><div><h1>اصنع منتجك بنفسك</h1><p>اختار النوع، لوّن الخرز، حط حروف اسمك، وشوفه بيلف قدامك قبل ما تطلب. السعر بيتحسب لوحده.</p></div></div>
    <div class="builder">
      <div class="viewer glass" id="b-viewer">${hasWebGL ? '' : '<div class="empty"><div class="big">🧩</div>المعاينة ثلاثية الأبعاد مش مدعومة على المتصفح ده، لكن تقدر تكمل التصميم وتطلب.</div>'}<div class="hint glass">اسحب عشان تلفّه</div></div>
      <div class="bsteps">
        <div class="glass ai-box">
          <h3>اوصف اللي في دماغك وسيب الباقي علينا</h3>
          <p class="sub">${aiMode() === 'local' ? 'بيفهم الألوان والنوع والتعليقة والاسم من كلامك' : 'بيستخدم الذكاء الاصطناعي عشان يحوّل كلامك لتصميم'}</p>
          <textarea id="b-ai" placeholder="مثلاً: عايزة إسورة لؤلؤ وبينك عليها قلب واسم مريم وفيها لمعة"></textarea>
          <div class="row"><button class="btn btn-rose" id="b-ai-go" type="button">حوّله لتصميم</button><span class="out" id="b-ai-out"></span></div>
        </div>
        <div class="glass bstep"><h3>النوع</h3><div class="bases" id="b-bases"></div></div>
        <div class="glass bstep"><h3>الألوان</h3><p class="sub">اختار خانة في النمط وبعدين دوس على لون</p><div class="pattern" id="b-pattern"></div><div class="palette" id="b-palette" style="margin-top:12px"></div></div>
        <div class="glass bstep" id="b-charm-step"><h3>التعليقة</h3><div class="chips" id="b-charms"></div></div>
        <div class="glass bstep" id="b-extra-step"></div>
        <div class="glass bstep" id="b-letters-step"><h3>حروف أو اسم</h3><p class="sub" id="b-letters-sub"></p><div class="field"><input id="b-letters" maxlength="12" placeholder="اكتب الاسم أو الحروف" /></div></div>
        <div class="glass bstep"><h3>اللمعة</h3><input type="range" id="b-glitter" min="0" max="1" step="0.1" style="width:100%" /></div>
        <div class="glass bprice">
          <div><div class="price" id="b-price"></div><div class="brk" id="b-brk"></div></div>
          <div class="buy-row"><div class="qty glass"><button type="button" id="b-minus">−</button><span id="b-qty">1</span><button type="button" id="b-plus">+</button></div><button class="btn btn-gold btn-lg" id="b-add" type="button">ضيف للسلة</button></div>
        </div>
      </div>
    </div>
  </div>`;

  const $ = (s) => root.querySelector(s);
  let viewer = null;
  if (hasWebGL) viewer = new Viewer($('#b-viewer'), { autoRotate: true });

  const baseDef = () => BASES.find((b) => b.id === S.base);
  function price() {
    const b = baseDef();
    let p = b.base;
    const brk = [`${b.name} ${b.base}`];
    if (b.charm && S.charm !== 'none') { p += b.charm; brk.push(`تعليقة ${b.charm}`); }
    if (b.letter && S.letters.trim()) { const n = S.letters.trim().replace(/\s/g, '').length; p += n * b.letter; brk.push(`${n} حرف × ${b.letter}`); }
    const ex = EXTRAS[S.base];
    if (ex?.add) { const i = ex.values.indexOf(S.extra[ex.key] || ex.values[0]); if (ex.add[i]) { p += ex.add[i]; brk.push(`مقاس +${ex.add[i]}`); } }
    if (S.glitter > 0.7) { p += 10; brk.push('جليتر زيادة 10'); }
    return { total: p, brk };
  }
  function modelOpts() {
    const charmGeo = S.charm === 'heart' ? heartGeo(0.14) : S.charm === 'star' ? starGeo(0.13) : null;
    const o = { pattern: S.colors, charm: S.charm !== 'none', charmGeo, letters: S.letters.trim() };
    if (S.base === 'necklace') o.charmGeo = charmGeo || starGeo(0.01);
    return o;
  }
  function colorsFor() {
    if (S.base === 'necklace') { const m = S.extra.metal; return [m === 'فضي' ? '#d8d8d8' : m === 'روز جولد' ? '#e8a79a' : '#e6c27a', S.colors[0]]; }
    if (S.base === 'candle') return [S.colors[0], S.colors[1]];
    if (S.base === 'sign') return ['#d9a66b', S.colors[0]];
    if (S.base === 'chocolate') return [S.extra.flavor === 'أبيض' ? '#f3e2c0' : S.extra.flavor === 'دارك' ? '#3b2a20' : '#5a3825', S.colors[0]];
    return [S.colors[0], S.colors[1]];
  }
  let t;
  function render() {
    const b = baseDef();
    $('#b-bases').innerHTML = BASES.map((x) => `<button type="button" class="base ${x.id === S.base ? 'on' : ''}" data-b="${x.id}"><span class="e">${x.e}</span>${x.name}<small>${x.hint}</small></button>`).join('');
    $('#b-pattern').innerHTML = S.colors.map((c, i) => `<button type="button" class="slot ${i === S.slot ? 'on' : ''}" data-i="${i}" style="background:${c}" aria-label="خانة ${i + 1}"></button>`).join('') + '<span style="font-size:.8rem;color:var(--pearl-45);margin-inline-start:6px">النمط بيتكرر</span>';
    $('#b-palette').innerHTML = PALETTE.map(([c, n]) => `<button type="button" class="swatch ${S.colors[S.slot] === c ? 'on' : ''}" data-c="${c}" style="background:${c}" title="${n}" aria-label="${n}"></button>`).join('');
    $('#b-charm-step').style.display = b.charm ? '' : 'none';
    $('#b-charms').innerHTML = CHARMS.map(([id, n]) => `<button type="button" class="chip rose ${S.charm === id ? 'on' : ''}" data-ch="${id}">${n}</button>`).join('');
    const ex = EXTRAS[S.base];
    $('#b-extra-step').style.display = ex ? '' : 'none';
    if (ex) { if (!S.extra[ex.key]) S.extra[ex.key] = ex.values[0]; $('#b-extra-step').innerHTML = `<h3>${ex.label}</h3><div class="chips">${ex.values.map((v) => `<button type="button" class="chip ${S.extra[ex.key] === v ? 'on' : ''}" data-ex="${esc(v)}">${v}</button>`).join('')}</div>`; }
    $('#b-letters-step').style.display = b.letter ? '' : 'none';
    $('#b-letters-sub').textContent = `${b.letter} ج.م للحرف`;
    $('#b-letters').value = S.letters;
    $('#b-glitter').value = S.glitter;
    const pr = price();
    $('#b-price').textContent = fmt(pr.total * S.qty);
    $('#b-brk').textContent = pr.brk.join(' + ') + (S.qty > 1 ? ` × ${S.qty}` : '');
    $('#b-qty').textContent = S.qty;
    clearTimeout(t); t = setTimeout(() => viewer && viewer.set(S.base, colorsFor(), S.glitter, modelOpts()), 60);
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-b]'); if (b) { S.base = b.dataset.b; render(); }
    const sl = e.target.closest('[data-i]'); if (sl) { S.slot = +sl.dataset.i; render(); }
    const sw = e.target.closest('[data-c]'); if (sw) { S.colors[S.slot] = sw.dataset.c; S.slot = (S.slot + 1) % S.colors.length; render(); }
    const ch = e.target.closest('[data-ch]'); if (ch) { S.charm = ch.dataset.ch; render(); }
    const ex = e.target.closest('[data-ex]'); if (ex) { S.extra[EXTRAS[S.base].key] = ex.dataset.ex; render(); }
    if (e.target.id === 'b-plus') { S.qty++; render(); }
    if (e.target.id === 'b-minus') { S.qty = Math.max(1, S.qty - 1); render(); }
    if (e.target.id === 'b-add') addToCart();
    if (e.target.id === 'b-ai-go') runAI();
  });
  $('#b-letters').addEventListener('input', (e) => { S.letters = e.target.value; render(); });
  $('#b-glitter').addEventListener('input', (e) => { S.glitter = +e.target.value; render(); });

  async function runAI() {
    const text = $('#b-ai').value.trim(); if (!text) { $('#b-ai-out').textContent = 'اكتب وصف الأول'; return; }
    $('#b-ai-out').innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    const spec = await interpretDesignAI(text);
    if (spec.base) S.base = spec.base;
    if (spec.colors?.length) { S.colors = [spec.colors[0], spec.colors[1] || '#ffffff', spec.colors[2] || spec.colors[0]]; }
    if (spec.charm) S.charm = spec.charm;
    if (spec.letters) S.letters = spec.letters;
    if (S.base === 'necklace' && spec.colors?.length) { S.extra.metal = spec.colors.includes('#d8d8d8') ? 'فضي' : spec.colors.includes('#e8a79a') ? 'روز جولد' : 'ذهبي'; }
    if (spec.glitter != null) S.glitter = +spec.glitter;
    const got = [spec.base && 'النوع', spec.colors?.length && 'الألوان', spec.charm && 'التعليقة', spec.letters && 'الاسم'].filter(Boolean);
    $('#b-ai-out').textContent = spec.note || (got.length ? `فهمت: ${got.join('، ')}. عدّل براحتك.` : 'مفهمتش كويس.. جرّب تذكر النوع واللون (مثلاً: إسورة بينك بقلب).');
    render();
  }
  function addToCart() {
    const b = baseDef(); const pr = price();
    const custom = { base: S.base, colors: [...S.colors], charm: S.charm, letters: S.letters.trim(), glitter: S.glitter, extra: { ...S.extra } };
    const desc = [S.colors.map((c) => PALETTE.find((p) => p[0] === c)?.[1] || c).join('/'), S.charm !== 'none' && b.charm ? CHARMS.find((c) => c[0] === S.charm)[1] : '', b.letter && S.letters.trim() ? `حروف: ${S.letters.trim()}` : '', ...Object.entries(S.extra).filter(([k]) => EXTRAS[S.base]?.key === k).map(([, v]) => v)].filter(Boolean).join(' • ');
    Cart.add({ id: 'custom-' + S.base + '-' + btoa(unescape(encodeURIComponent(JSON.stringify(custom)))).slice(0, 10), name: `تصميمك: ${b.name}`, price: pr.total, qty: S.qty, custom, customText: desc, model: S.base, colors: colorsFor(), glitter: S.glitter });
    toast('تصميمك اتضاف للسلة ✨');
  }
  render();
  return { destroy() { viewer && viewer.destroy(); } };
}
