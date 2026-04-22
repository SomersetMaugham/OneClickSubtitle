/**
 * YouTube 다국어 자막 변환 - i18n 시스템
 */

(function (window) {
  'use strict';

  var LANGUAGE_MAP = {
    ko: { target: ['Korean', '한국어'], code: 'ko', name: 'Korean', nativeName: '한국어' },
    ja: { target: ['Japanese', '日本語'], code: 'ja', name: 'Japanese', nativeName: '日本語' },
    es: { target: ['Spanish', 'Español'], code: 'es', name: 'Spanish', nativeName: 'Español' },
    fr: { target: ['French', 'Français'], code: 'fr', name: 'French', nativeName: 'Français' },
    de: { target: ['German', 'Deutsch'], code: 'de', name: 'German', nativeName: 'Deutsch' },
    pt: { target: ['Portuguese', 'Português'], code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    ru: { target: ['Russian', 'Русский'], code: 'ru', name: 'Russian', nativeName: 'Русский' },
    zh: { target: ['Chinese', '中文'], code: 'zh-CN', name: 'Chinese', nativeName: '中文' },
    it: { target: ['Italian', 'Italiano'], code: 'it', name: 'Italian', nativeName: 'Italiano' },
    nl: { target: ['Dutch', 'Nederlands'], code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    hi: { target: ['Hindi', 'हिन्दी'], code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    ar: { target: ['Arabic', 'العربية'], code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
    id: { target: ['Indonesian', 'Bahasa Indonesia'], code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    tl: { target: ['Filipino', 'Filipino'], code: 'tl', name: 'Filipino', nativeName: 'Filipino' },
    ur: { target: ['Urdu', 'اردو'], code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true },
    fa: { target: ['Persian', 'فارسی'], code: 'fa', name: 'Persian', nativeName: 'فارسی', rtl: true }
  };

  var MENU_TEXTS = {
    subtitles: ['Subtitles', 'CC', 'Captions', '字幕', '자막', ' Subtitles'],
    autoTranslate: ['Auto-translate', '自動翻訳', '자동 번역', ' translate'],
    english: ['English (auto-generated)', 'English', '英語', '영어'],
    off: ['Off', '끄기', '사용 안함', 'Disabled']
  };

  var TOAST_MESSAGES = {
    activated: '✓ {lang} subtitles activated',
    activatedNative: '✓ {nativeName} 자막이 활성화되었습니다',
    deactivated: '✓ Subtitles turned off',
    deactivatedNative: '✓ 자막이 비활성화되었습니다',
    error: '⚠ {error}',
    retry: 'Retrying...',
    noCaptions: '⚠ No captions available',
    settingsNotFound: '⚠ Settings button not found'
  };

  var BUTTON_CHARS = {
    ko: '가', ja: 'あ', es: 'A', fr: 'A', de: 'A',
    pt: 'A', ru: 'А', zh: '中', it: 'A', nl: 'A',
    hi: 'ह', ar: 'ع', id: 'A', tl: 'A', ur: 'ا', fa: 'ف'
  };

  function detectSystemLanguage() {
    var lang = (navigator.language || navigator.userLanguage || 'ko').split('-')[0];
    return LANGUAGE_MAP[lang] ? lang : 'ko';
  }

  function getTargetLanguageNames(langCode) {
    var lang = LANGUAGE_MAP[langCode];
    return lang ? lang.target : ['Korean', '한국어'];
  }

  function getLanguageName(langCode) {
    var lang = LANGUAGE_MAP[langCode];
    return lang ? lang.name : 'Korean';
  }

  function getLanguageNativeName(langCode) {
    var lang = LANGUAGE_MAP[langCode];
    return lang ? lang.nativeName : '한국어';
  }

  function getButtonChar(langCode) {
    return BUTTON_CHARS[langCode] || 'A';
  }

  function isRTL(langCode) {
    var lang = LANGUAGE_MAP[langCode];
    return lang ? lang.rtl === true : false;
  }

  function getToastMessage(key, replacements) {
    var message = TOAST_MESSAGES[key] || key;
    if (replacements) {
      for (var key in replacements) {
        if (replacements.hasOwnProperty(key)) {
          message = message.replace('{' + key + '}', replacements[key]);
        }
      }
    }
    return message;
  }

  function getToastMessageForLanguage(langCode, key, replacements) {
    var lang = LANGUAGE_MAP[langCode];
    var isKorean = langCode === 'ko';

    if (isKorean) {
      if (key === 'activated') {
        return getToastMessage('activatedNative', replacements);
      } else if (key === 'deactivated') {
        return getToastMessage('deactivatedNative');
      }
    }

    var msgKey = key + 'Native';
    if (TOAST_MESSAGES[msgKey] && isKorean) {
      return getToastMessage(msgKey, replacements);
    }

    return getToastMessage(key, replacements);
  }

  window.i18n = {
    LANGUAGE_MAP: LANGUAGE_MAP,
    MENU_TEXTS: MENU_TEXTS,
    TOAST_MESSAGES: TOAST_MESSAGES,
    detectSystemLanguage: detectSystemLanguage,
    getTargetLanguageNames: getTargetLanguageNames,
    getLanguageName: getLanguageName,
    getLanguageNativeName: getLanguageNativeName,
    getButtonChar: getButtonChar,
    isRTL: isRTL,
    getToastMessage: getToastMessage,
    getToastMessageForLanguage: getToastMessageForLanguage
  };

})(window);