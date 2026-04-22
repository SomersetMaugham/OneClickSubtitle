/**
 * YouTube 다국어 자막 변환 콘텐츠 스크립트
 * 시스템 언어를 감지하여 타겟 언어로 자동 번역
 */

(function () {
  'use strict';

  const BUTTON_ID = 'ytp-subtitle-btn';
  const i18n = window.i18n || {};

  const LANGUAGE_MAP = i18n.LANGUAGE_MAP || {
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

  const MENU_TEXTS = i18n.MENU_TEXTS || {
    subtitles: ['Subtitles', 'CC', 'Captions', '字幕', '자막'],
    autoTranslate: ['Auto-translate', '自動翻訳', '자동 번역'],
    english: ['English (auto-generated)', 'English', '英語', '영어'],
    off: ['Off', '끄기', '사용 안함']
  };

  let targetLang = 'ko';
  let targetLangNames = ['Korean', '한국어'];

  function getButtonSVG(char) {
    return `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
        <text x="12" y="15" text-anchor="middle" font-size="8" font-weight="bold" fill="currentColor" font-family="sans-serif">${char}</text>
      </svg>
    `;
  }

  function getFirstChar(langCode) {
    const chars = {
      ko: '가', ja: 'あ', es: 'A', fr: 'A', de: 'A',
      pt: 'A', ru: 'А', zh: '中', it: 'A', nl: 'A',
      hi: 'ह', ar: 'ع', id: 'A', tl: 'A', ur: 'ا', fa: 'ف'
    };
    return chars[langCode] || 'A';
  }

  function showToast(message) {
    const existingToast = document.querySelector('.ytp-subtitle-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'ytp-subtitle-toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);
  }

  function clickMenuItem(panel, texts) {
    const menuItems = panel.querySelectorAll('.ytp-menuitem');

    for (const item of menuItems) {
      const label = item.querySelector('.ytp-menuitem-label');
      if (label) {
        const labelText = label.textContent.trim();
        if (texts.some(text => labelText.includes(text))) {
          item.click();
          return true;
        }
      }
    }
    return false;
  }

  function waitForPanel(timeout = 8000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const check = () => {
        let panel = document.querySelector('.ytp-settings-menu');
        if (!panel) {
          panel = document.querySelector('.ytp-popup.ytp-menu-content');
        }
        if (!panel) {
          const popups = document.querySelectorAll('.ytp-popup');
          for (const popup of popups) {
            if (popup.querySelectorAll('.ytp-menuitem').length > 0) {
              panel = popup;
              break;
            }
          }
        }

        if (panel && panel.querySelectorAll('.ytp-menuitem').length > 0) {
          const style = getComputedStyle(panel);
          const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';

          if (isVisible) {
            resolve(panel);
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Panel timeout'));
          } else {
            setTimeout(check, 50);
          }
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Panel timeout'));
        } else {
          setTimeout(check, 50);
        }
      };

      check();
    });
  }

  function waitForPanelClose(timeout = 1000) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const check = () => {
        const panel = document.querySelector('.ytp-settings-menu');

        if (!panel || panel.style.display === 'none') {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };

      check();
    });
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function findSettingsPanel() {
    let panel = document.querySelector('.ytp-popup.ytp-menu-content');

    if (panel && panel.querySelectorAll('.ytp-menuitem').length > 0) {
      return panel;
    }

    panel = document.querySelector('.ytp-settings-menu');

    if (panel && panel.querySelectorAll('.ytp-menuitem').length > 0) {
      return panel;
    }

    const popups = document.querySelectorAll('.ytp-popup');

    for (const popup of popups) {
      if (popup.querySelectorAll('.ytp-menuitem').length > 0) {
        return popup;
      }
    }

    return null;
  }

  async function enableSubtitle(retryCount = 0) {
    const button = document.getElementById(BUTTON_ID);

    if (button && button.classList.contains('active')) {
      const subtitleButton = document.querySelector('.ytp-subtitles-button');

      if (subtitleButton) {
        subtitleButton.click();
      }

      button.classList.remove('active');

      showToast('✓ 자막이 비활성화되었습니다');

      return;
    }

    if (button) {
      button.classList.add('loading');
    }

    try {
      const settingsButton = document.querySelector('.ytp-settings-button');

      if (!settingsButton) {
        throw new Error('설정 버튼을 찾을 수 없습니다');
      }

      settingsButton.click();
      await delay(400);

      let panel = findSettingsPanel();

      while (!panel) {
        await delay(100);
        panel = findSettingsPanel();
      }

      const subtitleClicked = clickMenuItem(panel, MENU_TEXTS.subtitles);

      if (!subtitleClicked) {
        settingsButton.click();
        return;
      }

      await delay(400);

      panel = findSettingsPanel();

      while (!panel) {
        await delay(100);
        panel = findSettingsPanel();
      }

      const menuItems = panel.querySelectorAll('.ytp-menuitem');

      let autoTranslateExists = false;

      for (const item of menuItems) {
        const label = item.querySelector('.ytp-menuitem-label');

        if (label && MENU_TEXTS.autoTranslate.some(text => label.textContent.includes(text))) {
          autoTranslateExists = true;
          break;
        }
      }

      if (!autoTranslateExists) {
        const englishClicked = clickMenuItem(panel, MENU_TEXTS.english);

        if (!englishClicked) {
          let anyClicked = false;

          for (const item of menuItems) {
            const label = item.querySelector('.ytp-menuitem-label');

            if (label) {
              const text = label.textContent.trim();

              if (!MENU_TEXTS.off.some(off => text.includes(off))) {
                item.click();
                anyClicked = true;
                break;
              }
            }
          }

          if (!anyClicked) {
            settingsButton.click();
            return;
          }
        }

        await delay(600);

        panel = findSettingsPanel();

        while (!panel) {
          await delay(100);
          panel = findSettingsPanel();
        }
      }

      const autoTranslateClicked = clickMenuItem(panel, MENU_TEXTS.autoTranslate);

      if (!autoTranslateClicked) {
        const targetClicked = clickMenuItem(panel, targetLangNames);

        if (targetClicked) {
          showToast(`✓ ${targetLangNames[0]} 자막이 활성화되었습니다`);

          if (button) {
            button.classList.remove('loading');
            button.classList.add('active');
          }

          return;
        }

        settingsButton.click();
        throw new Error('자동 번역을 사용할 수 없습니다');
      }

      await delay(400);

      panel = findSettingsPanel();

      while (!panel) {
        await delay(100);
        panel = findSettingsPanel();
      }

      const targetClicked = clickMenuItem(panel, targetLangNames);

      if (!targetClicked) {
        settingsButton.click();
        throw new Error(`${targetLangNames[0]}를 찾을 수 없습니다`);
      }

      showToast(`✓ ${targetLangNames[0]} 자막이 활성화되었습니다`);

      if (button) {
        button.classList.remove('loading');
        button.classList.add('active');
      }

    } catch (error) {
      if (retryCount === 0) {
        console.log('[자막] 첫 번째 시도 실패, 자동 재시도...');

        const settingsButton = document.querySelector('.ytp-settings-button');

        if (settingsButton) {
          settingsButton.click();
        }

        await delay(500);

        return enableSubtitle(1);
      }

      console.error('[자막]', error.message);
      showToast('⚠ ' + error.message);

      if (button) {
        button.classList.remove('loading');
      }
    }
  }

  function createButton() {
    if (document.getElementById(BUTTON_ID)) {
      return;
    }

    const rightControls = document.querySelector('.ytp-right-controls');

    if (!rightControls) {
      return;
    }

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.className = 'ytp-button ytp-subtitle-button';
    button.innerHTML = `
      ${getButtonSVG(getFirstChar(targetLang))}
      <span class="tooltip">${targetLangNames[0]} 자막</span>
    `;
    button.setAttribute('aria-label', `${targetLangNames[0]} 자막 변환`);
    button.setAttribute('title', '');

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      enableSubtitle();
    });

    const subtitleButton = rightControls.querySelector('.ytp-subtitles-button');

    if (subtitleButton && subtitleButton.parentNode === rightControls) {
      rightControls.insertBefore(button, subtitleButton);
    } else {
      rightControls.prepend(button);
    }

    console.log('[자막] 버튼이 추가되었습니다');
  }

  function observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      if (window.location.pathname === '/watch') {
        createButton();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener('yt-navigate-finish', () => {
      const button = document.getElementById(BUTTON_ID);

      if (button) {
        button.classList.remove('active');
      }

      if (window.location.pathname === '/watch') {
        setTimeout(createButton, 500);
      }
    });
  }

  function detectSystemLanguage() {
    const lang = navigator.language || navigator.userLanguage || 'ko';
    const shortLang = lang.split('-')[0];

    if (LANGUAGE_MAP[shortLang]) {
      return shortLang;
    }

    return 'ko';
  }

  function init() {
    targetLang = detectSystemLanguage();
    targetLangNames = LANGUAGE_MAP[targetLang].target;

    if (window.location.pathname === '/watch') {
      const checkPlayer = setInterval(() => {
        if (document.querySelector('.ytp-right-controls')) {
          clearInterval(checkPlayer);
          createButton();
        }
      }, 500);

      setTimeout(() => clearInterval(checkPlayer), 10000);
    }

    observePageChanges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();