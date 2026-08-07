'use client';

import { useEffect, useMemo, useState } from 'react';

export type Lang = 'en' | 'tr';

export type ExampleChip = { label: string; emoji: string; example: string };

const EXAMPLE_CHIPS: Record<Lang, ExampleChip[]> = {
  en: [
    { label: 'Fever', emoji: '🌡️', example: 'My baby has a fever today, what should I do?' },
    { label: 'Sleep', emoji: '😴', example: "My baby won't sleep through the night, any tips?" },
    { label: 'Feeding', emoji: '🍼', example: 'My baby is eating very little today, should I worry?' },
    { label: 'Crying', emoji: '😢', example: "My baby keeps crying and I can't soothe them, what can I try?" },
    { label: 'Rash', emoji: '🔴', example: 'My baby has a red rash on their cheeks, what should I do?' },
  ],
  tr: [
    { label: 'Ateş', emoji: '🌡️', example: 'Bebeğim bugün ateşlendi, ne yapmalıyım?' },
    { label: 'Uyku', emoji: '😴', example: 'Bebeğim gece boyunca uyumuyor, ne önerirsiniz?' },
    { label: 'Beslenme', emoji: '🍼', example: 'Bebeğim bugün çok az yedi, endişelenmeli miyim?' },
    { label: 'Ağlama', emoji: '😢', example: 'Bebeğim sürekli ağlıyor, sakinleştiremiyorum, ne yapabilirim?' },
    { label: 'Döküntü', emoji: '🔴', example: 'Bebeğimin yanaklarında kırmızı döküntü var, ne yapmalıyım?' },
  ],
};

const messages = {
  en: {
    askTitle: 'Ask BabyQ',
    subtitle: 'Short, parent-friendly answers. Not medical advice.',
    ageLabel: "Baby's age (months)",
    sexLabel: "Baby's sex",
    concernLabel: "What's your concern?",
    profileTitle: 'My Questions',
    createProfileTitle: 'Complete your profile',
    createProfileDesc:
      'Create your BabyQ profile so we can personalize answers and keep your question history in one place.',
    createProfileCta: 'Create your profile',
    referencesTitle: 'References',
    preparingAnswer: 'Preparing answer…',
    getAnswer: 'Get answer',
    loginPrompt: 'Please log in to view your questions.',
    loadingQuestions: 'Loading your questions…',
    errorQuestions: 'Questions could not be loaded.',
    noQuestions: 'No questions recorded yet.',
    ageMonthsLabel: 'Age (months)',
    genderLabel: 'Gender',
    sourceLabel: 'Source',
    sourceGeneral: 'General',
    sourcesHint: 'Curated pediatric references used to inform this answer.',
    questionPreview: 'Question',
    copied: '✅ Copied',
    copyAnswer: 'Copy answer',
    answerTitle: 'Answer',
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    historyTitle: 'My History',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    authError: 'Authentication error',
    profileSaved: 'Profile saved to your account ✓',
    heroBadge: 'Trusted pediatric Q&A',
    heroTitleLine1: 'Answers for every',
    heroTitleLine2: 'parenting question',
    heroSubtitle:
      "Fast, clear answers about your baby's health — backed by trusted pediatric guidelines. Always consult your doctor for emergencies.",
    heroCta: 'Get instant answers →',
    heroTryLabel: 'Or try instantly:',
    heroChipSeconds: '⚡ Seconds, not searches',
    heroChipBilingual: '🌍 TR & EN',
    heroChipSafety: '🛟 Safety-first',
    trustNotMedical: '🔒 Not medical advice',
    trustPediatric: '✓ Pediatric-backed',
    trustBilingual: '🌍 TR/EN bilingual',
    formDisclaimer:
      'Not a substitute for professional medical advice. In emergencies call your local emergency number.',
    errorPrefix: 'Error:',
    whoAbout: "Who's this about?",
    someoneElse: 'Someone else',
    babyAge: "Baby's age",
    newborn: 'Newborn',
    month: 'month',
    months: 'months',
    ageRangeMax: '5 years (60 mo)',
    sexPreferNot: 'Prefer not to say',
    sexFemale: 'Female',
    sexMale: 'Male',
    concernPlaceholder: "Describe what you're noticing…",
    tryExample: '✨ Try an example — one tap for an instant answer',
    genericError: 'Something went wrong.',
    urgentTitle: 'This looks urgent — call emergency services',
    urgentBody:
      'Please contact your local emergency number or visit the nearest healthcare facility immediately.',
    feedbackQuestion: 'Was this answer helpful?',
    feedbackThanks: 'Thank you! 🙏',
    shareWhatsApp: 'Share on WhatsApp',
    sharePrefix: 'BabyQ answer:',
    sourcesCount: 'Sources',
    whyTitle: 'Why BabyQ, not a generic chatbot?',
    whySubtitle: "Same AI underneath — a very different experience when it's your baby at 2am.",
    whySafetyTitle: 'Safety runs first',
    whySafetyBody: "Red-flag symptoms trigger an urgent-care warning instantly — before any AI is even called. A general chatbot won't stop to do that.",
    whyKnowsTitle: 'It knows your baby',
    whyKnowsBody: "Age and profile go into every answer, so you're not re-explaining your child each time you ask.",
    whySourcesTitle: 'It shows its sources',
    whySourcesBody: 'Every answer points to the pediatric references behind it — so you can trust it, not just believe it.',
    whyAuthority: 'Reference material drawn from',
    topicsTitle: 'Popular topics parents ask about',
    topicsSubtitle: 'Short, source-backed guides for the questions that come up most.',
    topicsAll: 'See all articles →',
  },
  tr: {
    askTitle: "BabyQ'ya Sor",
    subtitle: 'Kısa, ebeveyn dostu cevaplar. Tıbbi tavsiye değildir.',
    ageLabel: 'Bebeğin yaşı (ay)',
    sexLabel: 'Bebeğin cinsiyeti',
    concernLabel: 'Seni en çok ne endişelendiriyor?',
    profileTitle: 'Sorularım',
    createProfileTitle: 'Profilini tamamla',
    createProfileDesc:
      'BabyQ profilini oluştur, yanıtları sana göre kişiselleştirelim ve soru geçmişini tek yerde toplayalım.',
    createProfileCta: 'Profil oluştur',
    referencesTitle: 'Kaynaklar',
    preparingAnswer: 'Yanıt hazırlanıyor…',
    getAnswer: 'Yanıt al',
    loginPrompt: 'Sorularını görmek için lütfen giriş yap.',
    loadingQuestions: 'Soruların yükleniyor…',
    errorQuestions: 'Sorular yüklenemedi.',
    noQuestions: 'Henüz kayıtlı sorunuz yok.',
    ageMonthsLabel: 'Yaş (ay)',
    genderLabel: 'Cinsiyet',
    sourceLabel: 'Kaynak',
    sourceGeneral: 'Genel',
    sourcesHint: 'Bu yanıtı oluştururken kullanılan güvenilir pediatrik referanslar.',
    questionPreview: 'Soru',
    copied: '✅ Kopyalandı',
    copyAnswer: 'Yanıtı kopyala',
    answerTitle: 'Yanıt',
    signIn: 'Giriş Yap',
    signUp: 'Kayıt Ol',
    signOut: 'Çıkış',
    historyTitle: 'Geçmişim',
    emailLabel: 'E-posta',
    passwordLabel: 'Şifre',
    authError: 'Kimlik doğrulama hatası',
    profileSaved: 'Profil hesabına kaydedildi ✓',
    heroBadge: 'Güvenilir pediatrik Q&A',
    heroTitleLine1: 'Her ebeveyn sorusuna',
    heroTitleLine2: 'anında yanıt',
    heroSubtitle:
      'Bebeğinizin sağlığı hakkında hızlı, net yanıtlar — güvenilir pediatrik rehberlere dayanır. Acil durumlarda mutlaka doktorunuza danışın.',
    heroCta: 'Hemen yanıt al →',
    heroTryLabel: 'Ya da tek tıkla dene:',
    heroChipSeconds: '⚡ Arama değil, saniyeler',
    heroChipBilingual: '🌍 TR & EN',
    heroChipSafety: '🛟 Güvenlik öncelikli',
    trustNotMedical: '🔒 Tıbbi tavsiye değildir',
    trustPediatric: '✓ Pediatrik kaynaklı',
    trustBilingual: '🌍 TR/EN iki dilli',
    formDisclaimer:
      'Profesyonel tıbbi tavsiyenin yerini tutmaz. Acil durumda yerel acil numaranızı arayın.',
    errorPrefix: 'Hata:',
    whoAbout: 'Bu soru kimin hakkında?',
    someoneElse: 'Başka biri',
    babyAge: 'Bebeğin yaşı',
    newborn: 'Yenidoğan',
    month: 'ay',
    months: 'ay',
    ageRangeMax: '5 yaş (60 ay)',
    sexPreferNot: 'Belirtmek istemiyorum',
    sexFemale: 'Kız',
    sexMale: 'Erkek',
    concernPlaceholder: 'Gözlemlediğiniz durumu anlatın…',
    tryExample: '✨ Örnek deneyin — tek tıkla anında yanıt',
    genericError: 'Bir şeyler ters gitti.',
    urgentTitle: 'Acil görünüyor — acil servisi arayın',
    urgentBody:
      'Lütfen hemen yerel acil numaranızı arayın veya en yakın sağlık kuruluşuna başvurun.',
    feedbackQuestion: 'Bu yanıt faydalı oldu mu?',
    feedbackThanks: 'Teşekkürler! 🙏',
    shareWhatsApp: "WhatsApp'ta paylaş",
    sharePrefix: 'BabyQ yanıtı:',
    sourcesCount: 'Kaynaklar',
    whyTitle: 'Neden BabyQ, sıradan bir sohbet botu değil?',
    whySubtitle: 'Altında aynı yapay zeka var — ama gece 2’de bebeğiniz söz konusuysa deneyim bambaşka.',
    whySafetyTitle: 'Önce güvenlik',
    whySafetyBody: 'Kırmızı bayrak belirtiler, yapay zekaya sorulmadan anında acil uyarısı verir. Sıradan bir bot bunu yapmaz.',
    whyKnowsTitle: 'Bebeğinizi tanır',
    whyKnowsBody: 'Yaş ve profil her yanıta girer; her seferinde çocuğunuzu baştan anlatmanız gerekmez.',
    whySourcesTitle: 'Kaynağını gösterir',
    whySourcesBody: 'Her yanıt, dayandığı pediatrik kaynakları gösterir — inanmak zorunda kalmazsınız, güvenirsiniz.',
    whyAuthority: 'Referans alınan kaynaklar',
    topicsTitle: 'Ebeveynlerin en çok sorduğu konular',
    topicsSubtitle: 'En sık gelen sorular için kısa, kaynaklı rehberler.',
    topicsAll: 'Tüm makaleler →',
  },
};

type MessageKey = keyof typeof messages.en;

export function getExampleChips(lang: Lang): ExampleChip[] {
  return EXAMPLE_CHIPS[lang];
}

export function useI18n() {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const navLang = navigator.languages?.[0] || navigator.language || '';
    const next = navLang.toLowerCase().startsWith('tr') ? 'tr' : 'en';
    setLang(next);
  }, []);

  const t = useMemo(
    () => (key: MessageKey) => {
      return messages[lang][key] ?? key;
    },
    [lang]
  );

  const chips = useMemo(() => getExampleChips(lang), [lang]);

  return { lang, t, chips };
}
