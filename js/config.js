// ===============================================
//  إعدادات منصة إفتكس — غيّر القيم هنا فقط
// ===============================================
export const CONFIG = {
  brand: {
    name: 'إفتكس',
    latin: 'EFTEX',
    tagline: 'كل حاجة هنا اتعملت بإيد.. وبقلب',
    city: 'مصر',
  },

  // رقم الواتساب اللي الطلبات هتتبعت عليه (صيغة دولية بدون + أو مسافات)
  whatsapp: '201555476622',

  currency: 'ج.م',

  // رقم سري بسيط للوحة التحكم (admin.html) — غيّره. ده قفل خفيف مش حماية حقيقية،
  // لأن الموقع ثابت؛ لوحة التحكم بتولّد ملف البيانات اللي بترفعه بنفسك.
  adminPin: '2026',

  shipping: {
    // تكلفة الشحن حسب المنطقة (تقدر تعدّل أو تضيف)
    zones: [
      { id: 'cairo', name: 'القاهرة والجيزة', price: 50 },
      { id: 'alex', name: 'الإسكندرية', price: 60 },
      { id: 'delta', name: 'الدلتا والقناة', price: 65 },
      { id: 'upper', name: 'الصعيد', price: 80 },
      { id: 'pickup', name: 'استلام من الورشة', price: 0 },
    ],
    freeAbove: 1500, // شحن مجاني فوق المبلغ ده
  },

  // الذكاء الاصطناعي: 'local' يشتغل بدون أي مفتاح.
  // لو عندك مفتاح Claude أو Gemini حطه هنا و غيّر provider.
  ai: {
    provider: 'local', // 'local' | 'claude' | 'gemini'
    claudeKey: '',
    claudeModel: 'claude-sonnet-4-5',
    geminiKey: '',
    geminiModel: 'gemini-2.0-flash',
  },

  // روابط السوشيال (اتركها فاضية لو مش موجودة)
  social: {
    instagram: '',
    facebook: '',
    tiktok: '',
  },
};
