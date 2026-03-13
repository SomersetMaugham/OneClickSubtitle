/**

 * YouTube 한글 자막 변환 콘텐츠 스크립트

 * YouTube 플레이어 컨트롤바에 한글 자막 변환 버튼을 추가합니다.

 */



(function () {

  'use strict';



  const BUTTON_ID = 'ytp-korean-subtitle-btn';



  // 한글 자막 버튼 SVG 아이콘 (자막 + 한글 "가" 모티브)

  const BUTTON_SVG = `

    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">

      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>

      <text x="12" y="15" text-anchor="middle" font-size="8" font-weight="bold" fill="currentColor" font-family="sans-serif">가</text>

    </svg>

  `;



  /**

   * 토스트 메시지 표시

   */

  function showToast(message) {

    const existingToast = document.querySelector('.ytp-korean-subtitle-toast');

    if (existingToast) {

      existingToast.remove();

    }



    const toast = document.createElement('div');

    toast.className = 'ytp-korean-subtitle-toast';

    toast.textContent = message;

    document.body.appendChild(toast);



    setTimeout(() => toast.remove(), 2000);

  }



  /**

   * 설정 패널에서 특정 텍스트를 가진 메뉴 아이템 클릭

   */

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



  /**

   * 설정 패널이 열릴 때까지 대기

   */

  function waitForPanel(timeout = 3000) {

    return new Promise((resolve, reject) => {

      const startTime = Date.now();



      const check = () => {

        const panel = document.querySelector('.ytp-settings-menu');

        // 패널이 존재하고, 표시되어 있고, 메뉴 아이템이 있는지 확인

        if (panel && panel.style.display !== 'none' && panel.querySelectorAll('.ytp-menuitem').length > 0) {

          resolve(panel);

        } else if (Date.now() - startTime > timeout) {

          reject(new Error('Panel timeout'));

        } else {

          setTimeout(check, 50);

        }

      };



      check();

    });

  }



  /**

   * 설정 패널이 닫힐 때까지 대기

   */

  function waitForPanelClose(timeout = 1000) {

    return new Promise((resolve) => {

      const startTime = Date.now();



      const check = () => {

        const panel = document.querySelector('.ytp-settings-menu');

        if (!panel || panel.style.display === 'none') {

          resolve();

        } else if (Date.now() - startTime > timeout) {

          resolve(); // 타임아웃 시에도 계속 진행

        } else {

          setTimeout(check, 50);

        }

      };



      check();

    });

  }



  /**

   * 잠시 대기

   */

  function delay(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));

  }



  /**

   * 한글 자막 활성화 메인 로직

   * 플로우: 설정 → 자막 → 영어(자동 생성됨) 선택 → 자막 → 자동 번역 → 한국어

   */

  async function enableKoreanSubtitle(retryCount = 0) {

    const button = document.getElementById(BUTTON_ID);



    // 이미 활성화된 상태면 자막 비활성화 (토글)

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



    // 패널 숨김 상태 관리

    const hidePanel = () => {

      const panel = document.querySelector('.ytp-settings-menu');

      if (panel) panel.classList.add('ytp-korean-subtitle-hidden');

    };



    const showPanel = () => {

      const panel = document.querySelector('.ytp-settings-menu');

      if (panel) panel.classList.remove('ytp-korean-subtitle-hidden');

    };



    try {

      // 1. 설정 버튼 찾기 및 클릭

      const settingsButton = document.querySelector('.ytp-settings-button');

      if (!settingsButton) {

        throw new Error('설정 버튼을 찾을 수 없습니다');

      }



      settingsButton.click();

      await delay(100);

      hidePanel(); // 패널 숨기기

      await delay(200);



      // 2. 자막 메뉴 클릭

      let panel = await waitForPanel();

      hidePanel();

      const subtitleClicked = clickMenuItem(panel, ['자막', 'Subtitles', 'CC', '字幕']);



      if (!subtitleClicked) {

        showPanel();

        settingsButton.click();

        showToast('이 동영상은 자막을 지원하지 않습니다');

        if (button) {

          button.classList.remove('loading');

        }

        return;

      }



      await delay(300);



      // 3. 영어(자동 생성됨) 또는 다른 자막 선택 (자동 번역 메뉴를 활성화하기 위해)

      panel = await waitForPanel();



      // 먼저 자동 번역이 이미 있는지 확인

      let autoTranslateExists = false;

      const menuItems = panel.querySelectorAll('.ytp-menuitem');

      for (const item of menuItems) {

        const label = item.querySelector('.ytp-menuitem-label');

        if (label && (label.textContent.includes('자동 번역') || label.textContent.includes('Auto-translate'))) {

          autoTranslateExists = true;

          break;

        }

      }



      // 자동 번역이 없으면 먼저 자막을 선택해야 함

      if (!autoTranslateExists) {

        const englishClicked = clickMenuItem(panel, [

          '영어(자동 생성됨)', 'English (auto-generated)',

          '영어', 'English',

          '자동 생성', 'auto-generated'

        ]);



        if (!englishClicked) {

          // 아무 자막이나 선택 (끄기 제외)

          let anyClicked = false;

          for (const item of menuItems) {

            const label = item.querySelector('.ytp-menuitem-label');

            if (label) {

              const text = label.textContent.trim();

              if (!text.includes('끄기') && !text.includes('Off') && !text.includes('사용 안함') && !text.includes('자동 번역') && !text.includes('Auto-translate')) {

                item.click();

                anyClicked = true;

                break;

              }

            }

          }

          if (!anyClicked) {

            settingsButton.click();

            throw new Error('사용 가능한 자막이 없습니다');

          }

        }



        // 자막 선택 후 충분히 대기

        await delay(800);



        // ESC 키로 패널 명시적 닫기

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));

        await delay(500);



        // 패널이 완전히 닫힐 때까지 대기

        await waitForPanelClose();

        await delay(300);



        // 다시 설정 메뉴 열기

        settingsButton.click();

        await delay(100);

        hidePanel();

        await delay(200);



        panel = await waitForPanel();

        hidePanel();



        // 자막 메뉴 클릭

        const subtitleClicked2 = clickMenuItem(panel, ['자막', 'Subtitles', 'CC', '字幕']);

        if (!subtitleClicked2) {

          showPanel();

          throw new Error('자막 메뉴를 다시 열 수 없습니다');

        }

        await delay(300);

        panel = await waitForPanel();

        hidePanel();

      }



      // 4. 자동 번역 메뉴 클릭

      const autoTranslateClicked = clickMenuItem(panel, ['자동 번역', 'Auto-translate', '自動翻訳']);



      if (!autoTranslateClicked) {

        // 이미 한국어 자막이 있는지 확인

        const koreanClicked = clickMenuItem(panel, ['한국어', 'Korean', '韓国語']);

        if (koreanClicked) {

          showPanel();

          showToast('✓ 한국어 자막이 활성화되었습니다');

          if (button) {

            button.classList.remove('loading');

            button.classList.add('active');

          }

          return;

        }

        showPanel();

        settingsButton.click();

        throw new Error('자동 번역을 사용할 수 없습니다');

      }



      await delay(300);



      // 5. 한국어 선택

      panel = await waitForPanel();

      const koreanClicked = clickMenuItem(panel, ['한국어', 'Korean', '韓国語']);



      if (!koreanClicked) {

        settingsButton.click();

        throw new Error('한국어를 찾을 수 없습니다');

      }



      showPanel(); // 완료 후 패널 복원 (자동으로 닫힘)

      showToast('✓ 한국어 자막이 활성화되었습니다');



      if (button) {

        button.classList.remove('loading');

        button.classList.add('active');

      }



    } catch (error) {

      showPanel(); // 에러 시 패널 복원



      // 첫 번째 시도 실패 시 자동 재시도 (YouTube 초기화 지연 대응)

      if (retryCount === 0) {

        console.log('[한글 자막] 첫 번째 시도 실패, 자동 재시도...');

        // 설정 패널 정리

        const settingsButton = document.querySelector('.ytp-settings-button');

        if (settingsButton) {

          settingsButton.click(); // 패널 닫기

        }

        await delay(500);

        return enableKoreanSubtitle(1);

      }



      console.error('[한글 자막]', error.message);

      showToast('⚠ ' + error.message);



      if (button) {

        button.classList.remove('loading');

      }

    }

  }



  /**

   * 버튼 생성 및 삽입

   */

  function createButton() {

    // 이미 버튼이 있으면 생성하지 않음

    if (document.getElementById(BUTTON_ID)) {

      return;

    }



    // YouTube 플레이어 우측 컨트롤 영역 찾기

    const rightControls = document.querySelector('.ytp-right-controls');

    if (!rightControls) {

      return;

    }



    // 버튼 생성

    const button = document.createElement('button');

    button.id = BUTTON_ID;

    button.className = 'ytp-button ytp-korean-subtitle-button';

    button.innerHTML = `

      ${BUTTON_SVG}

      <span class="tooltip">한글 자막</span>

    `;

    button.setAttribute('aria-label', '한글 자막 변환');

    button.setAttribute('title', '');



    // 클릭 이벤트

    button.addEventListener('click', (e) => {

      e.preventDefault();

      e.stopPropagation();

      enableKoreanSubtitle();

    });



    // 자막 버튼 앞에 삽입 (또는 맨 앞에)

    const subtitleButton = rightControls.querySelector('.ytp-subtitles-button');

    if (subtitleButton && subtitleButton.parentNode === rightControls) {

      rightControls.insertBefore(button, subtitleButton);

    } else {

      // 안전하게 맨 앞에 삽입

      rightControls.prepend(button);

    }



    console.log('[한글 자막] 버튼이 추가되었습니다');

  }



  /**

   * YouTube SPA 네비게이션 감지 및 버튼 재삽입

   */

  function observePageChanges() {

    // 플레이어 영역 감시

    const observer = new MutationObserver((mutations) => {

      // 동영상 페이지인 경우에만 버튼 생성 시도

      if (window.location.pathname === '/watch') {

        createButton();

      }

    });



    observer.observe(document.body, {

      childList: true,

      subtree: true

    });



    // YouTube의 yt-navigate-finish 이벤트 감지

    window.addEventListener('yt-navigate-finish', () => {

      // 동영상 전환 시 버튼 active 상태 초기화

      const button = document.getElementById(BUTTON_ID);

      if (button) {

        button.classList.remove('active');

      }



      if (window.location.pathname === '/watch') {

        // 약간의 지연 후 버튼 생성 (플레이어 로드 대기)

        setTimeout(createButton, 500);

      }

    });

  }



  /**

   * 초기화

   */

  function init() {

    // 동영상 페이지인 경우 버튼 생성

    if (window.location.pathname === '/watch') {

      // 플레이어가 로드될 때까지 대기

      const checkPlayer = setInterval(() => {

        if (document.querySelector('.ytp-right-controls')) {

          clearInterval(checkPlayer);

          createButton();

        }

      }, 500);



      // 10초 후 중단

      setTimeout(() => clearInterval(checkPlayer), 10000);

    }



    // 페이지 변경 감지 시작

    observePageChanges();

  }



  // DOM 준비 후 초기화

  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', init);

  } else {

    init();

  }



})();

