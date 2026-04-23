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

  var LANGUAGE_NAMES = {
    aa: 'Afar',
    ab: 'Abkhazian',
    af: 'Afrikaans',
    ak: 'Akan',
    sq: 'Albanian',
    am: 'Amharic',
    an: 'Aragonese',
    ar: 'Arabic',
    'ar-AE': 'Arabic (United Arab Emirates)',
    'ar-BH': 'Arabic (Bahrain)',
    'ar-DZ': 'Arabic (Algeria)',
    'ar-EG': 'Arabic (Egypt)',
    'ar-IQ': 'Arabic (Iraq)',
    'ar-JO': 'Arabic (Jordan)',
    'ar-KW': 'Arabic (Kuwait)',
    'ar-LB': 'Arabic (Lebanon)',
    'ar-LY': 'Arabic (Libya)',
    'ar-MA': 'Arabic (Morocco)',
    'ar-OM': 'Arabic (Oman)',
    'ar-QA': 'Arabic (Qatar)',
    'ar-SA': 'Arabic (Saudi Arabia)',
    'ar-SD': 'Arabic (Sudan)',
    'ar-SY': 'Arabic (Syria)',
    'ar-TN': 'Arabic (Tunisia)',
    'ar-YE': 'Arabic (Yemen)',
    hy: 'Armenian',
    as: 'Assamese',
    av: 'Avaric',
    ay: 'Aymara',
    az: 'Azerbaijani',
    ba: 'Bashkir',
    be: 'Belarusian',
    bg: 'Bulgarian',
    bi: 'Bislama',
    bn: 'Bengali',
    bo: 'Tibetan',
    br: 'Breton',
    bs: 'Bosnian',
    ca: 'Catalan',
    ce: 'Chechen',
    ch: 'Chamorro',
    co: 'Corsican',
    cr: 'Cree',
    cy: 'Welsh',
    cs: 'Czech',
    da: 'Danish',
    de: 'German',
    'de-AT': 'German (Austria)',
    'de-CH': 'German (Switzerland)',
    'de-DE': 'German (Germany)',
    'de-LI': 'German (Liechtenstein)',
    'de-LU': 'German (Luxembourg)',
    dv: 'Divehi',
    dz: 'Dzongkha',
    el: 'Greek',
    en: 'English',
    'en-AU': 'English (Australia)',
    'en-BZ': 'English (Belize)',
    'en-CA': 'English (Canada)',
    'en-GB': 'English (UK)',
    'en-IE': 'English (Ireland)',
    'en-IN': 'English (India)',
    'en-JM': 'English (Jamaica)',
    'en-MY': 'English (Malaysia)',
    'en-NZ': 'English (New Zealand)',
    'en-PH': 'English (Philippines)',
    'en-SG': 'English (Singapore)',
    'en-US': 'English (US)',
    'en-ZA': 'English (South Africa)',
    'en-ZW': 'English (Zimbabwe)',
    eo: 'Esperanto',
    et: 'Estonian',
    eu: 'Basque',
    ee: 'Ewe',
    fo: 'Faroese',
    fa: 'Persian',
    fj: 'Fijian',
    fi: 'Finnish',
    fr: 'French',
    'fr-BE': 'French (Belgium)',
    'fr-CA': 'French (Canada)',
    'fr-CH': 'French (Switzerland)',
    'fr-FR': 'French (France)',
    'fr-LU': 'French (Luxembourg)',
    'fr-MC': 'French (Monaco)',
    'fr-SN': 'French (Senegal)',
    fy: 'Western Frisian',
    ff: 'Fulah',
    ga: 'Irish',
    gd: 'Scottish Gaelic',
    gl: 'Galician',
    gv: 'Manx',
    gn: 'Guarani',
    gu: 'Gujarati',
    ht: 'Haitian Creole',
    ha: 'Hausa',
    he: 'Hebrew',
    hz: 'Herero',
    hi: 'Hindi',
    ho: 'Hiri Motu',
    hr: 'Croatian',
    hu: 'Hungarian',
    hy: 'Armenian',
    id: 'Indonesian',
    ie: 'Interlingue',
    ig: 'Igbo',
    ii: 'Sichuan Yi',
    ik: 'Inupiaq',
    io: 'Ido',
    is: 'Icelandic',
    it: 'Italian',
    'it-IT': 'Italian (Italy)',
    'it-CH': 'Italian (Switzerland)',
    iu: 'Inuktitut',
    ja: 'Japanese',
    jv: 'Javanese',
    ka: 'Georgian',
    kg: 'Kongo',
    ki: 'Kikuyu',
    kj: 'Kuanyama',
    kk: 'Kazakh',
    kl: 'Kalaallisut',
    km: 'Khmer',
    kn: 'Kannada',
ko: ['Korean', '한국어'],
    kr: ['Korean', '한국어'],
    ja: ['Japanese', '日本語'],
    jv: 'Javanese',
    ka: 'Georgian',
    kg: 'Kongo',
    ki: 'Kikuyu',
    kj: 'Kuanyama',
    kk: 'Kazakh',
    kl: 'Kalaallisut',
    km: 'Khmer',
    kn: 'Kannada',
    ks: 'Kashmiri',
    ku: 'Kurdish',
    kv: 'Komi',
    kw: 'Cornish',
    ky: 'Kirghiz',
    lo: 'Lao',
    la: 'Latin',
    lb: 'Luxembourgish',
    lg: 'Ganda',
    li: 'Limburgish',
    ln: 'Lingala',
    lt: 'Lithuanian',
    lu: 'Luba-Katanga',
    lv: 'Latvian',
    mg: 'Malagasy',
    ms: 'Malay',
    'ms-BN': 'Malay (Brunei)',
    'ms-MY': 'Malay (Malaysia)',
    ml: 'Malayalam',
    mt: 'Maltese',
    mi: 'Maori',
    mr: 'Marathi',
    mh: 'Marshallese',
    mn: 'Mongolian',
    na: 'Nauru',
    nv: 'Navajo',
    nb: 'Norwegian Bokmål',
    nd: 'North Ndebele',
    ne: 'Nepali',
    ng: 'Ndonga',
    nl: ['Dutch', 'Nederlands', 'オランダ語'],
    'nl-BE': 'Dutch (Belgium)',
    'nl-NL': 'Dutch (Netherlands)',
    nn: 'Norwegian Nynorsk',
    no: ['Norwegian', 'Norsk', 'ノルウェー語'],
    nr: 'South Ndebele',
    ny: 'Chichewa',
    oc: 'Occitan',
    oj: 'Ojibwa',
    om: 'Oromo',
    or: 'Oriya',
    os: 'Ossetian',
    pa: 'Punjabi',
    fa: 'Persian',
    pl: ['Polish', 'Polski', 'ポーランド語'],
    ps: 'Pashto',
    pt: ['Portuguese', 'Português', 'ポルトガル語'],
    'pt-BR': 'Portuguese (Brazil)',
    'pt-PT': 'Portuguese (Portugal)',
    qu: 'Quechua',
    rm: 'Romansh',
    ro: ['Romanian', 'Română', 'ルーマニア語'],
    'ro-MD': 'Romanian (Moldova)',
    ru: ['Russian', 'Русский', 'ロシア語'],
    'ru-UA': 'Russian (Ukraine)',
    rw: 'Kinyarwanda',
    sa: 'Sanskrit',
    sc: 'Sardinian',
    sd: 'Sindhi',
    se: 'Northern Sami',
    sm: 'Samoan',
    sg: 'Sango',
    sr: 'Serbian',
    'sr-Cyrl': 'Serbian (Cyrillic)',
    'sr-Latn': 'Serbian (Latin)',
    sn: 'Shona',
    si: 'Sinhala',
    sk: 'Slovak',
    sl: 'Slovenian',
    so: 'Somali',
    st: 'Southern Sotho',
    es: ['Spanish', 'Español', 'スペイン語'],
    'es-AR': 'Spanish (Argentina)',
    'es-BO': 'Spanish (Bolivia)',
    'es-CL': 'Spanish (Chile)',
    'es-CO': 'Spanish (Colombia)',
    'es-CR': 'Spanish (Costa Rica)',
    'es-DO': 'Spanish (Dominican Republic)',
    'es-EC': 'Spanish (Ecuador)',
    'es-ES': 'Spanish (Spain)',
    'es-GT': 'Spanish (Guatemala)',
    'es-HN': 'Spanish (Honduras)',
    'es-MX': 'Spanish (Mexico)',
    'es-NI': 'Spanish (Nicaragua)',
    'es-PA': 'Spanish (Panama)',
    'es-PE': 'Spanish (Peru)',
    'es-PR': 'Spanish (Puerto Rico)',
    'es-PY': 'Spanish (Paraguay)',
    'es-SV': 'Spanish (El Salvador)',
    'es-US': 'Spanish (US)',
    'es-UY': 'Spanish (Uruguay)',
    'es-VE': 'Spanish (Venezuela)',
    su: 'Sundanese',
    sw: 'Swahili',
    ss: 'Swati',
    sv: ['Swedish', 'Svenska', 'スウェーデン語'],
    'sv-FI': 'Swedish (Finland)',
    ta: 'Tamil',
    te: 'Telugu',
    tg: 'Tajik',
    th: ['Thai', 'ภาษาไทย', 'タイ語'],
    ti: 'Tigrinya',
    to: 'Tonga',
    ts: 'Tsonga',
    tn: 'Tswana',
    tr: ['Turkish', 'Türkçe', '土耳其語'],
    tk: 'Turkmen',
    tl: 'Tagalog',
    tw: 'Twi',
    ug: 'Uighur',
    uk: ['Ukrainian', 'Українська', 'ウクライナ語'],
    ur: 'Urdu',
    uz: 'Uzbek',
    ve: 'Venda',
    vi: ['Vietnamese', 'Tiếng Việt', 'ベトナム語'],
    vo: 'Volapük',
    wa: 'Walloon',
    wo: 'Wolof',
    xh: 'Xhosa',
    yi: 'Yiddish',
    yo: 'Yoruba',
    za: 'Zhuang',
    zu: 'Zulu',
    zh: ['Chinese', '中文'],
    'zh-CN': ['Chinese (Simplified)', '简体中文'],
    'zh-HK': 'Chinese (Hong Kong)',
    'zh-MO': 'Chinese (Macau)',
    'zh-SG': 'Chinese (Singapore)',
    'zh-TW': ['Chinese (Traditional)', '繁體中文']
  };

  function getTargetLanguageNames(langCode) {
    var name = LANGUAGE_NAMES[langCode];
    if (typeof name === 'string') {
      if (langCode === 'ko' || langCode === 'kr') {
        return [name, '한국어'];
      }
      return [name];
    }
    if (Array.isArray(name)) {
      return name;
    }
    return [capitalize(langCode)];
  }

  function getLanguageName(langCode) {
    var name = LANGUAGE_NAMES[langCode];
    if (typeof name === 'string') {
      return name;
    }
    if (Array.isArray(name)) {
      return name[0];
    }
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