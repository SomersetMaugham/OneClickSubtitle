/**
 * YouTube 다국어 자막 변환 - 언어 매핑 및 i18n 시스템
 */

const LANGUAGE_MAP = {
  ko: { target: ['Korean', '한국어'], code: 'ko' },
  ja: { target: ['Japanese', '日本語'], code: 'ja' },
  es: { target: ['Spanish', 'Español'], code: 'es' },
  fr: { target: ['French', 'Français'], code: 'fr' },
  de: { target: ['German', 'Deutsch'], code: 'de' },
  pt: { target: ['Portuguese', 'Português'], code: 'pt' },
  ru: { target: ['Russian', 'Русский'], code: 'ru' },
  zh: { target: ['Chinese', '中文'], code: 'zh-CN' },
  it: { target: ['Italian', 'Italiano'], code: 'it' },
  nl: { target: ['Dutch', 'Nederlands'], code: 'nl' },
  hi: { target: ['Hindi', 'हिन्दी'], code: 'hi' },
  ar: { target: ['Arabic', 'العربية'], code: 'ar', rtl: true },
  id: { target: ['Indonesian', 'Bahasa Indonesia'], code: 'id' },
  tl: { target: ['Filipino', 'Filipino'], code: 'tl' },
  ur: { target: ['Urdu', 'اردو'], code: 'ur', rtl: true },
  fa: { target: ['Persian', 'فارسی'], code: 'fa', rtl: true }
};

const MENU_TEXTS = {
  subtitles: ['Subtitles', 'CC', 'Captions', '字幕', '자막', ' Subtitles'],
  autoTranslate: ['Auto-translate', '自動翻訳', '자동 번역'],
  english: ['English (auto-generated)', 'English', '英語', '영어'],
  off: ['Off', '끄기', '사용 안함', 'Disabled']
};

const TOAST_MESSAGES = {
  activated: '✓ {lang} 자막이 활성화되었습니다',
  deactivated: '✓ 자막이 비활성화되었습니다',
  error: '⚠ {error}',
  retry: '시도 중...'
};

function detectSystemLanguage() {
  const lang = navigator.language || navigator.userLanguage || 'ko';
  const shortLang = lang.split('-')[0];

  if (LANGUAGE_MAP[shortLang]) {
    return shortLang;
  }

  return 'ko';
}

function getTargetLanguageNames(langCode) {
  const lang = LANGUAGE_MAP[langCode];
  return lang ? lang.target : ['Korean', '한국어'];
}

function isRTL(langCode) {
  const lang = LANGUAGE_MAP[langCode];
  return lang ? lang.rtl === true : false;
}

function getToastMessage(key, replacements = {}) {
  let message = TOAST_MESSAGES[key] || key;
  for (const [placeholder, value] of Object.entries(replacements)) {
    message = message.replace(`{${placeholder}}`, value);
  }
  return message;
}