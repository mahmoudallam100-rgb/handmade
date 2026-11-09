// ===============================================
//  الذكاء الاصطناعي في إفتكس
//  - محرك محلي بيفهم المناسبة والميزانية والألوان (بدون أي مفتاح)
//  - أو Claude / Gemini لو حطيت مفتاح في config.js
// ===============================================
import { CONFIG, PRODUCTS, CATS, OCCASIONS, catById, fmt } from './state.js';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const normalize = (s) => String(s || '')
  .replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d))
  .replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ـ/g, '')
  .toLowerCase();

const OCC_WORDS = {
  wedding: ['فرح', 'عروس', 'عريس', 'زفاف', 'كوشه', 'وصيف', 'حنه', 'شبكه', 'طرحه'],
  engagement: ['خطوب', 'دبل', 'خطيب'],
  birthday: ['عيد ميلاد', 'بيرثداي', 'birthday', 'تورته', 'سنه حلوه'],
  baby: ['سبوع', 'بيبي', 'مولود', 'ولاده', 'طفل'],
  graduation: ['تخرج', 'جرادويشن', 'كليه', 'نجاح'],
  ramadan: ['رمضان', 'فانوس', 'عيد الفطر', 'العيد', 'عمره', 'قران'],
  love: ['حب', 'حبيب', 'فالنتاين', 'valentine', 'ذكري', 'انيفرسري', 'رومانس', 'مراتي', 'جوزي'],
  mother: ['ماما', 'امي', 'عيد الام', 'الام', 'والدتي'],
  friend: ['صاحب', 'صديق', 'بيست', 'اصحاب', 'زميل', 'اخت', 'اخوي'],
};
const CAT_WORDS = {
  beads: ['اسوره', 'سلسله', 'حلق', 'خرز', 'كريستال', 'ميداليه', 'تعليقه', 'اكسسوار', 'لولي', 'لؤلؤ'],
  chocolate: ['شيكولات', 'شوكولا', 'حلويات', 'ياكل', 'بتحب الاكل'],
  candles: ['شمع', 'ريحه', 'معطر', 'عطر'],
  wood: ['خشب', 'ابلكاش', 'حفر', 'ليزر', 'لوحه', 'صينيه', 'ريزن'],
  gifts: ['بوكس', 'هديه', 'هدايا', 'جيفت', 'علبه'],
  bride: ['عروس', 'تاج', 'طرحه', 'وصيف', 'شبكه'],
  occasions: ['توزيع', 'دعوه', 'توبر', 'فانوس', 'سبوع', 'تخرج'],
  supplies: ['خامات', 'كيت', 'مسدس شمع', 'ادوات', 'جليتر', 'بشتغل', 'اتعلم'],
};
const COLOR_WORDS = {
  '#c0392b': ['احمر', 'حمرا', 'red'], '#7fb3d5': ['ازرق', 'زرقا', 'سماوي', 'blue', 'لبني'], '#f4a7c3': ['وردي', 'بينك', 'بمبي', 'روز', 'pink', 'زهري'],
  '#e6c27a': ['ذهبي', 'دهبي', 'جولد', 'gold'], '#d8d8d8': ['فضي', 'سيلفر', 'silver'], '#ffffff': ['ابيض', 'بيضا', 'white', 'لولي'],
  '#1d1230': ['اسود', 'سودا', 'black'], '#8fc9a8': ['اخضر', 'خضرا', 'نعناعي', 'green', 'مينت'], '#9b7bd1': ['بنفسجي', 'موف', 'purple', 'لافندر'],
  '#2a9d8f': ['تركواز', 'تيفاني', 'turquoise'], '#f6e7c1': ['بيج', 'كريمي', 'اوف وايت', 'نيود'], '#7a1f2b': ['عنابي', 'نبيتي', 'بوردو'], '#f28c28': ['برتقالي', 'اورنج'], '#ffd166': ['اصفر', 'صفرا'],
};
const BASE_WORDS = {
  bracelet: ['اسوره', 'اسورة', 'غويشه', 'bracelet'], necklace: ['سلسله', 'عقد', 'necklace', 'قلاده'], phonecharm: ['تعليقه موبايل', 'تعليقه', 'موبايل', 'فون'],
  keychain: ['ميداليه', 'مداليه', 'keychain', 'مفاتيح'], candle: ['شمعه', 'شمع', 'candle'], sign: ['لوحه', 'خشب', 'ابلكاش', 'تابلوه'], chocolate: ['شيكولات', 'شوكولا', 'بار'],
};
const CHARM_WORDS = { heart: ['قلب', 'قلوب', 'heart'], star: ['نجمه', 'نجم', 'star'], none: ['من غير تعليقه', 'بدون تعليقه'] };

function has(text, words) { return words.some((w) => text.includes(normalize(w))); }
function findBudget(text) {
  const m = text.match(/(\d{2,5})/g);
  if (!m) return null;
  return Math.max(...m.map(Number).filter((n) => n >= 30 && n <= 20000));
}

// ———— توصيات محلية ————
export function recommend(query, limit = 4) {
  const t = normalize(query);
  const occ = Object.keys(OCC_WORDS).filter((k) => has(t, OCC_WORDS[k]));
  const cats = Object.keys(CAT_WORDS).filter((k) => has(t, CAT_WORDS[k]));
  const budget = findBudget(t);
  const fem = has(t, ['صاحبتي', 'اختي', 'خطيبتي', 'حبيبتي', 'بنت', 'مراتي', 'ماما', 'امي', 'ليها', 'عروس', 'زميلتي']);
  const masc = has(t, ['صاحبي', 'اخويا', 'خطيبي', 'حبيبي', 'ولد', 'جوزي', 'بابا', 'ابويا', 'ليه ', 'راجل', 'زميلي']);
  const scored = PRODUCTS.map((p) => {
    let s = 0; const why = [];
    const occCats = occ.flatMap((o) => OCCASIONS.find((x) => x.id === o)?.cats || []);
    if (occCats.includes(p.cat)) { s += 3; }
    const tagText = normalize([p.name, ...(p.tags || [])].join(' '));
    occ.forEach((o) => OCC_WORDS[o].forEach((w) => { if (tagText.includes(normalize(w))) { s += 4; why.push('مناسب للمناسبة'); } }));
    if (cats.includes(p.cat)) { s += 4; why.push(`من قسم ${catById(p.cat)?.name}`); }
    CAT_WORDS[p.cat]?.forEach((w) => { if (t.includes(normalize(w)) && tagText.includes(normalize(w))) s += 1; });
    if (budget) { if (p.price <= budget) { s += 2; why.push('في حدود الميزانية'); } else if (p.price <= budget * 1.15) s += 0; else s -= 6; }
    if (fem && /رجال|كوفي|راجل/.test(p.name)) s -= 4;
    if (masc && /بنات|عروس|وردي|تاج|طرحه|لؤلؤ/.test(normalize(p.name))) s -= 4;
    if (masc && /رجال/.test(p.name)) s += 3;
    if (p.badge === 'الأكثر طلباً') { s += 1; why.push('من الأكثر طلباً'); }
    if (p.unit) s -= 1; // التوزيعات مش هدية فردية غالباً
    if (p.cat === 'supplies' && !cats.includes('supplies')) s -= 5;
    if (has(t, ['هديه', 'هدايا', 'جيفت']) && p.cat === 'occasions') s -= 2;
    for (const [hex, words] of Object.entries(COLOR_WORDS)) if (has(t, words) && (p.colors || []).map((c) => c.toLowerCase()).includes(hex)) { s += 2; why.push('باللون اللي طلبته'); }
    return { p, s, why: [...new Set(why)].slice(0, 2) };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  return { items: scored.slice(0, limit), occ, cats, budget, fem, masc };
}

const FAQ = [
  { k: ['شحن', 'توصيل', 'يوصل', 'الدليفري'], a: `بنشحن لكل المحافظات. القاهرة والجيزة ${CONFIG.shipping.zones[0].price} ج.م والباقي من ${CONFIG.shipping.zones[1].price} لـ ${CONFIG.shipping.zones[3].price} ج.م. والشحن مجاني فوق ${fmt(CONFIG.shipping.freeAbove)}. التوصيل من 3 لـ 7 أيام لأن كل حاجة بتتعمل خصيصاً ليك.` },
  { k: ['دفع', 'فيزا', 'انستا', 'فودافون', 'كاش'], a: 'الدفع عند الاستلام، أو إنستاباي / فودافون كاش قبل الشحن. بنأكد معاك كل حاجة على واتساب.' },
  { k: ['مده', 'ياخد وقت', 'امتي', 'كام يوم', 'مستعجل'], a: 'المنتجات الجاهزة 2-3 أيام، والمخصصة (بالاسم أو من "اصنع منتجك") من 4 لـ 7 أيام. لو مستعجل قولي وهنشوف أسرع حل.' },
  { k: ['ارجاع', 'استبدال', 'اتكسر'], a: 'لو وصلك حاجة متكسرة صوّرها في نفس اليوم وبنستبدلها على حسابنا. المنتجات المخصصة بالاسم مش بتترجع إلا لو فيها عيب.' },
  { k: ['اصمم', 'اصنع', 'بنفسي', 'تصميم', 'اعمل بنفسي'], a: 'تقدر تصمم بنفسك من صفحة "اصنع منتجك": تختار النوع والألوان والتعليقة والحروف وبتشوف النتيجة 3D قبل ما تطلب.', link: '#/build' },
  { k: ['مين انت', 'انت مين', 'ايه ده', 'بتعمل ايه'], a: 'أنا مساعد إفتكس. قولي المناسبة والشخص والميزانية وأنا أرشّح لك أنسب حاجة من الأرفف.' },
];

function localReply(query, history) {
  const t = normalize(query);
  const faq = FAQ.find((f) => has(t, f.k));
  const r = recommend(query);
  if (faq && !r.items.length) return { text: faq.a, items: [], link: faq.link };
  if (!r.items.length) {
    return { text: 'قولي أكتر: لمين الهدية؟ المناسبة إيه؟ وميزانيتك قد إيه تقريباً؟ ولو عندك لون بتحبه قوله كمان.', items: [], chips: ['هدية لصاحبتي بـ 300', 'خطوبة أختي', 'بوكس للرجالة', 'توزيعات سبوع'] };
  }
  const parts = [];
  if (r.occ.length) parts.push({ wedding: 'ألف مبروك مقدماً! 🎉', engagement: 'ألف مبروك للخطوبة!', birthday: 'عيد ميلاد سعيد!', baby: 'يتربى في عزكم 💙', graduation: 'مبروك التخرج 🎓', ramadan: 'رمضان كريم 🌙', love: 'جميل ❤️', mother: 'أحلى هدية في الدنيا', friend: 'الصحاب أهم حاجة' }[r.occ[0]]);
  parts.push(r.budget ? `دي أنسب اختيارات في حدود ${fmt(r.budget)}:` : 'دي أنسب اختيارات من الأرفف:');
  if (faq) parts.push(faq.a);
  return { text: parts.join(' '), items: r.items, chips: ['أرخص شوية', 'حاجة بالاسم', 'بوكس كامل', 'أصممها بنفسي'] };
}

// ———— مزودو الـ API ————
function catalogSummary() {
  return PRODUCTS.map((p) => `${p.id}|${p.name}|${catById(p.cat)?.name}|${p.price}${p.unit ? ' ' + p.unit : ''}|${(p.tags || []).join(',')}`).join('\n');
}
const SYSTEM = () => `أنت مساعد تسوّق لمنصة "إفتكس" للهاند ميد في مصر. تكلم بلهجة مصرية خفيفة وودودة ومختصرة (3 جمل بحد أقصى).
مهمتك ترشّح منتجات من الكتالوج فقط حسب المناسبة والشخص والميزانية. الشحن: ${CONFIG.shipping.zones.map((z) => `${z.name} ${z.price}`).join('، ')} ج.م، مجاني فوق ${CONFIG.shipping.freeAbove}. الدفع عند الاستلام أو إنستاباي. التنفيذ 2-7 أيام.
أجب دائماً بصيغة JSON فقط: {"reply":"النص","ids":["id1","id2"]} — ids من الكتالوج (0 إلى 4 منتجات).
الكتالوج (id|الاسم|القسم|السعر|الوسوم):\n${catalogSummary()}`;

async function askClaude(messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': CONFIG.ai.claudeKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: CONFIG.ai.claudeModel, max_tokens: 500, system: SYSTEM(), messages }),
  });
  if (!res.ok) throw new Error('claude ' + res.status);
  const j = await res.json();
  return j.content?.[0]?.text || '';
}
async function askGemini(messages) {
  const contents = messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.ai.geminiModel}:generateContent?key=${CONFIG.ai.geminiKey}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM() }] }, contents, generationConfig: { responseMimeType: 'application/json' } }),
  });
  if (!res.ok) throw new Error('gemini ' + res.status);
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
function parseJson(text) {
  try { const m = text.match(/\{[\s\S]*\}/); return JSON.parse(m ? m[0] : text); } catch { return null; }
}

export function aiMode() {
  if (CONFIG.ai.provider === 'claude' && CONFIG.ai.claudeKey) return 'claude';
  if (CONFIG.ai.provider === 'gemini' && CONFIG.ai.geminiKey) return 'gemini';
  return 'local';
}

// الدالة الرئيسية للشات: بترجع { text, items:[{p, why}], chips?, link? }
export async function chat(query, history = []) {
  const mode = aiMode();
  if (mode !== 'local') {
    try {
      const messages = [...history.slice(-6), { role: 'user', content: query }];
      const raw = mode === 'claude' ? await askClaude(messages) : await askGemini(messages);
      const j = parseJson(raw);
      if (j && j.reply) {
        const items = (j.ids || []).map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean).map((p) => ({ p, why: [] }));
        return { text: j.reply, items, chips: ['أرخص شوية', 'حاجة بالاسم', 'بوكس كامل'] };
      }
    } catch (e) { console.warn('AI provider failed, falling back to local', e); }
  }
  return localReply(query, history);
}

// ———— تفسير وصف التصميم (اصنع منتجك) ————
export function interpretDesign(text) {
  const t = normalize(text);
  const spec = {};
  for (const [base, words] of Object.entries(BASE_WORDS)) if (has(t, words)) { spec.base = base; break; }
  const colors = [];
  for (const [hex, words] of Object.entries(COLOR_WORDS)) if (has(t, words)) colors.push(hex);
  if (colors.length) spec.colors = colors.slice(0, 3);
  for (const [charm, words] of Object.entries(CHARM_WORDS)) if (has(t, words)) { spec.charm = charm; break; }
  const name = text.match(/(?:اسم|حرف|حروف|مكتوب عليها|مكتوب عليه|باسم)\s+([^\s,،.]+)/);
  if (name) spec.letters = name[1].replace(/^(ال)/, '').slice(0, 8);
  if (has(t, ['جليتر', 'لامع', 'لمعه', 'بريق'])) spec.glitter = 1;
  if (has(t, ['بسيط', 'هادي', 'من غير لمعه', 'مش لامع'])) spec.glitter = 0.1;
  const occ = Object.keys(OCC_WORDS).find((k) => has(t, OCC_WORDS[k]));
  if (occ) spec.occasion = occ;
  return spec;
}

export async function interpretDesignAI(text) {
  const local = interpretDesign(text);
  const mode = aiMode();
  if (mode === 'local') return local;
  try {
    const prompt = `حوّل وصف العميل ده لمواصفات منتج هاند ميد. أجب JSON فقط بالشكل:
{"base":"bracelet|necklace|phonecharm|keychain|candle|sign|chocolate","colors":["#hex",...(1-3)],"charm":"heart|star|none","letters":"حروف أو اسم أو فاضي","glitter":0..1,"note":"جملة قصيرة بالمصري تشرح الاختيار"}
الوصف: ${text}`;
    const raw = mode === 'claude' ? await askClaude([{ role: 'user', content: prompt }]) : await askGemini([{ role: 'user', content: prompt }]);
    const j = parseJson(raw);
    return j ? { ...local, ...j } : local;
  } catch { return local; }
}

// ———— توليد اسم ووصف للوحة التحكم ————
export async function generateCopy({ name = '', cat = '', tags = [], material = '' }) {
  const c = CATS.find((x) => x.id === cat);
  const mode = aiMode();
  if (mode !== 'local') {
    try {
      const prompt = `اكتب اسم جذاب (3-5 كلمات) ووصف (جملتين بالمصري الخفيف) لمنتج هاند ميد. القسم: ${c?.name || ''}. الاسم المبدئي: ${name}. الخامة: ${material}. الوسوم: ${tags.join('،')}. أجب JSON فقط: {"name":"..","desc":".."}`;
      const raw = mode === 'claude' ? await askClaude([{ role: 'user', content: prompt }]) : await askGemini([{ role: 'user', content: prompt }]);
      const j = parseJson(raw); if (j?.desc) return j;
    } catch { /* fallback */ }
  }
  const openers = ['مشغول يدوي قطعة قطعة', 'اتعمل بإيد وبصبر', 'كل تفصيلة فيه معمولة بالإيد'];
  const closers = { bride: 'يليق بليلة العمر ويفضل ذكرى.', occasions: 'بيخلي المناسبة ليها شكل مختلف.', beads: 'خفيف ومريح وبيلفت النظر.', chocolate: 'طعمه حلو وشكله أحلى.', candles: 'ريحته بتملا المكان دفا.', wood: 'خشب طبيعي بيعيش سنين.', gifts: 'هدية جاهزة من غير ما تفكر كتير.', supplies: 'خامة نضيفة تخلي شغلك يطلع احترافي.' };
  const o = openers[Math.floor(Math.random() * openers.length)];
  return { name: name || `${c?.name || 'منتج'} إفتكس`, desc: `${o}${material ? ' من ' + material : ''}${tags.length ? '، ' + tags.join(' و') : ''}. ${closers[cat] || 'بيتعمل خصيصاً ليك.'}` };
}
