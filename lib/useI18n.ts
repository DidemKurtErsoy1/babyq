'use client';

import { useMemo } from 'react';

type Lang = 'en' | 'tr';

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
    questionPreview: 'Question',
    copied: '✅ Copied',
    copyAnswer: 'Copy answer',
    answerTitle: 'Answer',
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
    questionPreview: 'Soru',
    copied: '✅ Kopyalandı',
    copyAnswer: 'Yanıtı kopyala',
    answerTitle: 'Yanıt',
  },
};

type MessageKey = keyof typeof messages.en;

export function useI18n() {
  const lang: Lang = 'en'; // UI is locked to English

  const t = useMemo(
    () => (key: MessageKey) => {
      return messages[lang][key] ?? key;
    },
    []
  );

  return { lang, t };
}
