/**
 * YouTube 다국어 자막 변환 - i18n 시스템
 * 모든 언어 지원 (무제한)
 */

(function (window) {
  'use strict';

  var RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'ps', 'sd'];

  var MENU_TEXTS = {
    subtitles: ['Subtitles', 'CC', 'Captions', '字幕', '자막', ' Subtitles'],
    autoTranslate: ['Auto-translate', '自動翻訳', '자동 번역', ' translate'],
    english: ['English (auto-generated)', 'English', '英語', '영어'],
    off: ['Off', '끄기', '사용 안함', 'Disabled']
  };

  var TOAST_MESSAGES = {
    activated: '✓ {lang} subtitles activated',
    deactivated: '✓ Subtitles turned off',
    error: '⚠ {error}'
  };

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function detectSystemLanguage() {
    var lang = (navigator.language || navigator.userLanguage || 'ko').split('-')[0];
    return lang || 'ko';
  }

  function getTargetLanguageNames(langCode) {
    return [capitalize(langCode)];
  }

  function getLanguageName(langCode) {
    return capitalize(langCode);
  }

  function getButtonChar() {
    return '가';
  }

  function isRTL(langCode) {
    return RTL_LANGUAGES.indexOf(langCode) !== -1;
  }

  function getToastMessage(key, replacements) {
    var message = TOAST_MESSAGES[key] || key;
    if (replacements) {
      for (var k in replacements) {
        if (replacements.hasOwnProperty(k)) {
          message = message.replace('{' + k + '}', replacements[k]);
        }
      }
    }
    return message;
  }

  function getToastMessageForLanguage(langCode, key, replacements) {
    return getToastMessage(key, replacements);
  }

  window.i18n = {
    MENU_TEXTS: MENU_TEXTS,
    TOAST_MESSAGES: TOAST_MESSAGES,
    detectSystemLanguage: detectSystemLanguage,
    getTargetLanguageNames: getTargetLanguageNames,
    getLanguageName: getLanguageName,
    getButtonChar: getButtonChar,
    isRTL: isRTL,
    getToastMessage: getToastMessage,
    getToastMessageForLanguage: getToastMessageForLanguage
  };

})(window);