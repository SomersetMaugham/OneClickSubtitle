/**

 * YouTube 한글 자막 변환 콘텐츠 스크립트

 * YouTube 플레이어 컨트롤바에 한글 자막 변환 버튼을 추가합니다.

 */



(function () {

  'use strict';



  const BUTTON_ID = 'ytp-korean-subtitle-btn';



  // 타이밍 관련 상수 (ms 단위)

  const TIMING = {

    MENU_OPEN_DELAY: 400,       // 설정 버튼 클릭 후 메뉴가 열리기를 기다리는 시간

    SUBMENU_DELAY: 400,         // 하위 메뉴 클릭 후 다음 메뉴가 열리기를 기다리는 시간

    MENU_UPDATE_TIMEOUT: 3000,  // 자막 트랙 선택 후 "자동 번역" 옵션이 나타나기를 기다리는 최대 시간

    RETRY_DELAY: 500,           // 재시도 전 대기 시간

    PANEL_WAIT_TIMEOUT: 8000,   // 설정 패널이 열리기를 기다리는 최대 시간

    PANEL_CLOSE_TIMEOUT: 1000,  // 설정 패널이 닫히기를 기다리는 최대 시간

    PANEL_POLL_INTERVAL: 50,    // 패널 상태를 확인하는 간격

    TOAST_DURATION: 2000,       // 토스트 메시지 노출 시간

    PLAYER_CHECK_INTERVAL: 500, // 플레이어 로드 확인 간격

    PLAYER_CHECK_TIMEOUT: 10000,// 플레이어 로드 확인을 포기하는 시간

    NAV_BUTTON_DELAY: 500,      // 페이지 전환 후 버튼 재생성을 기다리는 시간

    MUTATION_DEBOUNCE: 150      // MutationObserver 콜백 디바운스 간격

  };



  // 재시도해도 결과가 달라질 수 있는, 타이밍성 오류만 재시도 대상으로 취급한다.

  // (예: "이 동영상에는 자막이 없습니다" 같은 오류는 몇 번을 다시 시도해도 동일하다.)

  const RETRYABLE_ERRORS = [

    '설정 버튼을 찾을 수 없습니다',

    'Panel timeout'

  ];



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



    setTimeout(() => toast.remove(), TIMING.TOAST_DURATION);

  }



  /**

   * 디버그 로그 (문제 재현 시 어느 단계에서 무엇을 보고 어떻게 판단했는지

   * 추적하기 위한 용도. 콘솔에서 "[한글 자막]"으로 필터링해서 볼 수 있다.)

   */

  function logDebug(...args) {

    console.log('[한글 자막][debug]', ...args);

  }



  /**

   * 패널 안의 모든 메뉴 항목 라벨 텍스트 목록

   */

  function getMenuLabels(panel) {

    return Array.from(panel.querySelectorAll('.ytp-menuitem-label')).map(label => label.textContent.trim());

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

   * 현재 DOM에서 열려 있는 설정 패널(메뉴 아이템을 포함한)을 찾는다.

   * 패널이 없거나 아직 보이지 않으면 null을 반환한다.

   */

  function findOpenSettingsPanel() {

    let panel = document.querySelector('.ytp-popup.ytp-menu-content');

    if (!panel) {

      panel = document.querySelector('.ytp-settings-menu');

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



    if (!panel || panel.querySelectorAll('.ytp-menuitem').length === 0) {

      return null;

    }



    // computed style로 가시성 체크 (YouTube는 CSS 클래스로 표시/숨김을 제어함)

    const style = getComputedStyle(panel);

    const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';

    return isVisible ? panel : null;

  }



  /**

   * 설정 패널이 열릴 때까지 대기 (타임아웃 시 reject)

   */

  function waitForPanel(timeout = TIMING.PANEL_WAIT_TIMEOUT) {

    return new Promise((resolve, reject) => {

      const startTime = Date.now();



      const check = () => {

        const panel = findOpenSettingsPanel();



        if (panel) {

          resolve(panel);

        } else if (Date.now() - startTime > timeout) {

          reject(new Error('Panel timeout'));

        } else {

          setTimeout(check, TIMING.PANEL_POLL_INTERVAL);

        }

      };



      check();

    });

  }



  /**

   * 설정 패널이 닫힐 때까지 대기 (타임아웃 시에도 조용히 진행)

   */

  function waitForPanelClose(timeout = TIMING.PANEL_CLOSE_TIMEOUT) {

    return new Promise((resolve) => {

      const startTime = Date.now();



      const check = () => {

        if (!findOpenSettingsPanel()) {

          resolve();

        } else if (Date.now() - startTime > timeout) {

          resolve(); // 타임아웃 시에도 계속 진행

        } else {

          setTimeout(check, TIMING.PANEL_POLL_INTERVAL);

        }

      };



      check();

    });

  }



  /**

   * 패널 내용이 실제로 갱신되어 주어진 텍스트 중 하나를 가진 메뉴 항목이

   * 나타날 때까지 대기한다. 클릭 직후에는 이전 화면의 패널이 잠시 그대로

   * 남아있는 채로 "보이는" 상태일 수 있어, 단순히 "패널이 보이는지"만으로는

   * 화면 전환이 끝났는지 알 수 없다. 그래서 원하는 옵션이 실제로 나타날

   * 때까지 폴링한다. 시간 내에 나타나지 않으면(예: 그 옵션 자체가 없는 영상)

   * 그 시점의 패널을 그대로 반환해, 상위 로직이 "옵션 없음"으로 정확히

   * 처리할 수 있게 한다. 패널 자체가 완전히 사라진 경우에만 에러를 던진다.

   */

  function waitForMenuOption(texts, timeout = TIMING.MENU_UPDATE_TIMEOUT) {

    return new Promise((resolve, reject) => {

      const startTime = Date.now();



      const check = () => {

        const panel = findOpenSettingsPanel();



        if (panel) {

          const labels = getMenuLabels(panel);

          const found = labels.some(label => texts.some(text => label.includes(text)));



          if (found) {

            resolve(panel);

            return;

          }

        }



        if (Date.now() - startTime > timeout) {

          // 원하는 옵션은 못 찾았지만, 패널이 열려 있다면 그 상태로 반환한다.

          // (옵션이 실제로 없는 것인지는 호출부에서 판단한다.)

          if (panel) {

            logDebug('waitForMenuOption 시간 초과, 찾던 항목:', texts, '/ 현재 패널 항목:', getMenuLabels(panel));

            resolve(panel);

          } else {

            logDebug('waitForMenuOption 시간 초과, 패널이 열려있지 않음. 찾던 항목:', texts);

            reject(new Error('Panel timeout'));

          }

        } else {

          setTimeout(check, TIMING.PANEL_POLL_INTERVAL);

        }

      };



      check();

    });

  }



  /**

   * 열려 있는 설정 패널이 있으면 닫는다.

   * (설정 버튼은 토글 방식이므로, 이미 닫혀 있는데 다시 클릭하면 오히려 열리게 되어

   *  패널 상태가 꼬일 수 있다. 실제로 열려 있는지 확인한 뒤에만 클릭한다.)

   */

  function closeSettingsPanelIfOpen() {

    if (!findOpenSettingsPanel()) {

      return;

    }

    const settingsButton = document.querySelector('.ytp-settings-button');

    if (settingsButton) {

      settingsButton.click();

    }

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



    // 이미 처리 중이면 재진입하지 않는다 (중복 클릭으로 인한 동시 실행 방지)

    if (button && button.classList.contains('loading')) {

      return;

    }



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



    logDebug(`--- 시도 시작 (retryCount=${retryCount}) ---`);



    try {

      // 1. 설정 버튼 클릭 및 패널 대기

      const settingsButton = document.querySelector('.ytp-settings-button');

      if (!settingsButton) {

        throw new Error('설정 버튼을 찾을 수 없습니다');

      }



      settingsButton.click();

      await delay(TIMING.MENU_OPEN_DELAY);

      let panel = await waitForPanel();

      logDebug('1. 설정 메뉴 열림:', getMenuLabels(panel));



      // 2. 자막 메뉴 클릭

      const subtitleClicked = clickMenuItem(panel, ['자막', 'Subtitles', 'CC', '字幕']);

      logDebug('2. 자막 메뉴 클릭 결과:', subtitleClicked);



      if (!subtitleClicked) {

        throw new Error('이 동영상에는 자막이 없습니다');

      }



      await delay(TIMING.SUBMENU_DELAY);

      panel = await waitForPanel();

      let menuItems = panel.querySelectorAll('.ytp-menuitem');

      logDebug('2. 자막 서브메뉴 항목:', getMenuLabels(panel));



      // 3. 자동 번역 존재 여부 확인

      let autoTranslateExists = false;

      for (const item of menuItems) {

        const label = item.querySelector('.ytp-menuitem-label');

        if (label && (label.textContent.includes('자동 번역') || label.textContent.includes('Auto-translate'))) {

          autoTranslateExists = true;

          break;

        }

      }

      logDebug('3. 자동 번역 옵션 이미 존재:', autoTranslateExists);



      // 자동 번역이 없으면 먼저 자막 선택 필요

      if (!autoTranslateExists) {

        const englishClicked = clickMenuItem(panel, [

          '영어(자동 생성됨)', 'English (auto-generated)',

          '영어', 'English',

          '자동 생성', 'auto-generated'

        ]);

        logDebug('3. 영어 자막 트랙 클릭 결과:', englishClicked);



        if (!englishClicked) {

          // 아무 자막이나 선택 (끄기 제외)

          let anyClicked = false;

          let clickedTrackText = null;

          for (const item of menuItems) {

            const label = item.querySelector('.ytp-menuitem-label');

            if (label) {

              const text = label.textContent.trim();

              if (!text.includes('끄기') && !text.includes('Off') && !text.includes('사용 안함') && !text.includes('자동 번역') && !text.includes('Auto-translate')) {

                item.click();

                anyClicked = true;

                clickedTrackText = text;

                break;

              }

            }

          }

          logDebug('3. 대체 자막 트랙 클릭 결과:', anyClicked, clickedTrackText);



          if (!anyClicked) {

            throw new Error('이 동영상에는 자막이 없습니다');

          }

        }



        // 자막 트랙 선택 후 "자동 번역"(또는 이미 번역된 "한국어") 옵션이

        // 실제로 나타날 때까지 대기한다. 고정된 지연 시간만 기다리면 기기나

        // 네트워크 속도에 따라 메뉴가 아직 갱신되기 전의 내용을 읽어버려

        // "자동 번역을 사용할 수 없습니다" 오류가 간헐적으로 발생할 수 있다.

        panel = await waitForMenuOption(['자동 번역', 'Auto-translate', '自動翻訳', '한국어', 'Korean', '韓国語']);

        menuItems = panel.querySelectorAll('.ytp-menuitem');

        logDebug('3. 트랙 선택 후 갱신된 자막 서브메뉴 항목:', getMenuLabels(panel));

      }



      // 4. 자동 번역 메뉴 클릭

      const autoTranslateClicked = clickMenuItem(panel, ['자동 번역', 'Auto-translate', '自動翻訳']);

      logDebug('4. 자동 번역 메뉴 클릭 결과:', autoTranslateClicked);



      if (!autoTranslateClicked) {

        // 이미 한국어 자막이 있는지 확인 (자동 번역이 없으면 한국어 옵션만 있을 수 있음)

        const koreanClicked = clickMenuItem(panel, ['한국어', 'Korean', '韓国語']);

        if (koreanClicked) {

          showToast('✓ 한국어 자막이 활성화되었습니다');

          if (button) {

            button.classList.remove('loading');

            button.classList.add('active');

          }

          return;

        }



        throw new Error('자동 번역을 사용할 수 없습니다');

      }



      // 5. "자동 번역" 클릭 후 실제로 언어 목록(한국어 포함)이 나타날 때까지 대기한다.

      // 이 전환도 3단계와 같은 이유로(메뉴 내용이 비동기로 갱신됨) 고정 지연만으로는

      // 불안정하다.

      panel = await waitForMenuOption(['한국어', 'Korean', '韓国語']);

      logDebug('5. 언어 목록 항목:', getMenuLabels(panel));

      const koreanClicked = clickMenuItem(panel, ['한국어', 'Korean', '韓国語']);



      if (!koreanClicked) {

        throw new Error('한국어를 찾을 수 없습니다');

      }



      showToast('✓ 한국어 자막이 활성화되었습니다');

      logDebug('5. 한국어 선택 완료');



      if (button) {

        button.classList.remove('loading');

        button.classList.add('active');

      }

    } catch (error) {

      logDebug('오류 발생:', error.message);



      // 실패 시 열려 있는 설정 패널을 정리한다 (이미 닫혀 있다면 다시 열지 않는다).

      closeSettingsPanelIfOpen();

      await waitForPanelClose();



      const isRetryable = RETRYABLE_ERRORS.includes(error.message);

      logDebug('재시도 대상 여부:', isRetryable, '/ 현재 retryCount:', retryCount);



      // 첫 번째 시도가 타이밍성 오류로 실패한 경우에만 자동 재시도한다

      // (YouTube 초기화 지연 대응). 자막/번역이 아예 없는 경우처럼 재시도해도

      // 결과가 같은 오류는 바로 사용자에게 알린다.

      if (isRetryable && retryCount === 0) {

        console.log('[한글 자막] 첫 번째 시도 실패, 자동 재시도...');

        await delay(TIMING.RETRY_DELAY);

        return enableKoreanSubtitle(1);

      }



      console.error('[한글 자막]', error.message);

      logDebug('최종 실패 — 토스트 표시:', '⚠ ' + error.message);

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

    // 플레이어 영역 감시 (YouTube 워치 페이지는 변화가 매우 잦으므로

    // 매 mutation마다 즉시 처리하지 않고 짧게 디바운스한다)

    let debounceTimer = null;



    const observer = new MutationObserver(() => {

      if (window.location.pathname !== '/watch') {

        return;

      }



      if (debounceTimer) {

        clearTimeout(debounceTimer);

      }

      debounceTimer = setTimeout(() => {

        debounceTimer = null;

        createButton();

      }, TIMING.MUTATION_DEBOUNCE);

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

        setTimeout(createButton, TIMING.NAV_BUTTON_DELAY);

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

      }, TIMING.PLAYER_CHECK_INTERVAL);



      // 일정 시간 후 중단

      setTimeout(() => clearInterval(checkPlayer), TIMING.PLAYER_CHECK_TIMEOUT);

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
