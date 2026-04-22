/**
 * YouTube 다국어 자막 변환 콘텐츠 스크립트
 * 시스템 언어를 감지하여 타겟 언어로 자동 번역
 */

(function () {
  'use strict';

  var BUTTON_ID = 'ytp-subtitle-btn';

  var i18n = window.i18n || {};
  var MENU_TEXTS = i18n.MENU_TEXTS || {};
  var detectSystemLanguage = i18n.detectSystemLanguage || function () { return 'ko'; };
  var getTargetLanguageNames = i18n.getTargetLanguageNames || function (code) { return [code, code.toUpperCase()]; };
  var getLanguageName = i18n.getLanguageName || function (code) { return code.charAt(0).toUpperCase() + code.slice(1); };
  var isRTL = i18n.isRTL || function () { return false; };
  var getToastMessage = i18n.getToastMessage || function () { return ''; };

  var targetLang = '';
  var targetLangNames = [];
  var targetLangName = '';

  function getButtonSVG() {
    return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>' +
      '<text x="12" y="15" text-anchor="middle" font-size="8" font-weight="bold" fill="currentColor" font-family="sans-serif">가</text>' +
      '</svg>';
  }

  function showToast(message) {
    var existingToast = document.querySelector('.ytp-subtitle-toast');
    if (existingToast) {
      existingToast.remove();
    }

    var toast = document.createElement('div');
    toast.className = 'ytp-subtitle-toast';
    if (isRTL(targetLang)) {
      toast.classList.add('rtl');
    }
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(function () {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 2000);
  }

  function clickMenuItem(panel, texts) {
    var menuItems = panel.querySelectorAll('.ytp-menuitem');
    var clicked = false;

    for (var i = 0; i < menuItems.length; i++) {
      var item = menuItems[i];
      var label = item.querySelector('.ytp-menuitem-label');
      if (label) {
        var labelText = label.textContent.trim();
        for (var j = 0; j < texts.length; j++) {
          if (labelText.indexOf(texts[j]) !== -1) {
            item.click();
            clicked = true;
            break;
          }
        }
        if (clicked) {
          break;
        }
      }
    }
    return clicked;
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function findSettingsPanel() {
    var panel = document.querySelector('.ytp-popup.ytp-menu-content');

    if (panel && panel.querySelectorAll('.ytp-menuitem').length > 0) {
      return panel;
    }

    panel = document.querySelector('.ytp-settings-menu');

    if (panel && panel.querySelectorAll('.ytp-menuitem').length > 0) {
      return panel;
    }

    var popups = document.querySelectorAll('.ytp-popup');

    for (var i = 0; i < popups.length; i++) {
      if (popups[i].querySelectorAll('.ytp-menuitem').length > 0) {
        return popups[i];
      }
    }

    return null;
  }

  function hasAutoTranslate(panel) {
    var menuItems = panel.querySelectorAll('.ytp-menuitem');
    for (var i = 0; i < menuItems.length; i++) {
      var label = menuItems[i].querySelector('.ytp-menuitem-label');
      if (label) {
        var text = label.textContent;
        for (var j = 0; j < MENU_TEXTS.autoTranslate.length; j++) {
          if (text.indexOf(MENU_TEXTS.autoTranslate[j]) !== -1) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function isOffOption(text) {
    for (var i = 0; i < MENU_TEXTS.off.length; i++) {
      if (text.indexOf(MENU_TEXTS.off[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  async function enableSubtitle(retryCount) {
    retryCount = retryCount || 0;
    var button = document.getElementById(BUTTON_ID);

    if (button && button.classList.contains('active')) {
      var subtitleButton = document.querySelector('.ytp-subtitles-button');
      if (subtitleButton) {
        subtitleButton.click();
      }
      button.classList.remove('active');
      showToast(getToastMessage('deactivated'));
      return;
    }

    if (button) {
      button.classList.add('loading');
    }

    try {
      var settingsButton = document.querySelector('.ytp-settings-button');
      if (!settingsButton) {
        throw new Error(i18n.getToastMessage('settingsNotFound') || 'Settings button not found');
      }

      settingsButton.click();
      await delay(400);

      var panel = findSettingsPanel();
      while (!panel) {
        await delay(100);
        panel = findSettingsPanel();
      }

      if (!clickMenuItem(panel, MENU_TEXTS.subtitles)) {
        settingsButton.click();
        return;
      }

      await delay(400);
      panel = findSettingsPanel();
      while (!panel) {
        await delay(100);
        panel = findSettingsPanel();
      }

      var menuItems = panel.querySelectorAll('.ytp-menuitem');
      var autoTranslateExists = hasAutoTranslate(panel);

      if (!autoTranslateExists) {
        var englishClicked = clickMenuItem(panel, MENU_TEXTS.english);
        if (!englishClicked) {
          var anyClicked = false;
          for (var i = 0; i < menuItems.length; i++) {
            var label = menuItems[i].querySelector('.ytp-menuitem-label');
            if (label && !isOffOption(label.textContent.trim())) {
              menuItems[i].click();
              anyClicked = true;
              break;
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

      var autoTranslateClicked = clickMenuItem(panel, MENU_TEXTS.autoTranslate);
      if (!autoTranslateClicked) {
        var targetClicked = clickMenuItem(panel, targetLangNames);
        if (targetClicked) {
          showToast(getToastMessage('activated', { lang: targetLangName }));
          if (button) {
            button.classList.remove('loading');
            button.classList.add('active');
          }
          return;
        }
        settingsButton.click();
        throw new Error('Auto-translate not available');
      }

      await delay(400);
      panel = findSettingsPanel();
      while (!panel) {
        await delay(100);
        panel = findSettingsPanel();
      }

      var targetClicked = clickMenuItem(panel, targetLangNames);
      if (!targetClicked) {
        settingsButton.click();
        throw new Error(targetLangName + ' not found');
      }

      showToast(getToastMessage('activated', { lang: targetLangName }));

      if (button) {
        button.classList.remove('loading');
        button.classList.add('active');
      }

    } catch (error) {
      if (retryCount === 0) {
        console.log('[Subtitle] First attempt failed, retrying...');
        var settingsButton = document.querySelector('.ytp-settings-button');
        if (settingsButton) {
          settingsButton.click();
        }
        await delay(500);
        return enableSubtitle(1);
      }

      console.error('[Subtitle]', error.message);
      showToast(getToastMessage('error', { error: error.message }));

      if (button) {
        button.classList.remove('loading');
      }
    }
  }

  function updateTargetLanguage() {
    targetLang = detectSystemLanguage();
    targetLangNames = getTargetLanguageNames(targetLang);
    targetLangName = getLanguageName(targetLang);
  }

  function createButton() {
    if (document.getElementById(BUTTON_ID)) {
      return;
    }

    var rightControls = document.querySelector('.ytp-right-controls');
    if (!rightControls) {
      return;
    }

    updateTargetLanguage();

    var button = document.createElement('button');
    button.id = BUTTON_ID;
    button.className = 'ytp-button ytp-subtitle-button';
    if (isRTL(targetLang)) {
      button.classList.add('rtl');
    }

    var tooltipText = targetLangNames[0] + ' subtitles';

    button.innerHTML = getButtonSVG() +
      '<span class="tooltip">' + tooltipText + '</span>';
    button.setAttribute('aria-label', 'Translate subtitles to ' + targetLangNames[0]);
    button.setAttribute('title', '');

    button.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      enableSubtitle();
    });

    var subtitleButton = rightControls.querySelector('.ytp-subtitles-button');
    if (subtitleButton && subtitleButton.parentNode === rightControls) {
      rightControls.insertBefore(button, subtitleButton);
    } else {
      rightControls.prepend(button);
    }

    console.log('[Subtitle] Button added for ' + targetLangName);
  }

  function observePageChanges() {
    var observer = new MutationObserver(function (mutations) {
      if (window.location.pathname === '/watch') {
        createButton();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener('yt-navigate-finish', function () {
      var button = document.getElementById(BUTTON_ID);
      if (button) {
        button.classList.remove('active');
      }

      if (window.location.pathname === '/watch') {
        setTimeout(createButton, 500);
      }
    });
  }

  function observeLanguageChange() {
    setInterval(function () {
      var currentLang = detectSystemLanguage();
      if (currentLang !== targetLang) {
        var button = document.getElementById(BUTTON_ID);
        if (button) {
          button.classList.remove('active');
        }
        updateTargetLanguage();
        if (window.location.pathname === '/watch') {
          var rightControls = document.querySelector('.ytp-right-controls');
          if (rightControls) {
            var existingButton = document.getElementById(BUTTON_ID);
            if (existingButton) {
              existingButton.remove();
            }
            createButton();
          }
        }
      }
    }, 30000);
  }

  function init() {
    updateTargetLanguage();

    if (window.location.pathname === '/watch') {
      var checkPlayer = setInterval(function () {
        if (document.querySelector('.ytp-right-controls')) {
          clearInterval(checkPlayer);
          createButton();
        }
      }, 500);

      setTimeout(function () {
        clearInterval(checkPlayer);
      }, 10000);
    }

    observePageChanges();
    observeLanguageChange();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();