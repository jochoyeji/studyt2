/**
 * js/app.js
 * 앱 화면 전환(SPA) 인터페이스 및 공통 토스트 메시지 팝업 시스템 모듈
 */
(function() {
    const screens = document.querySelectorAll('.screen');
    const menuModal = document.getElementById('menu-modal');
    const btnMenu = document.getElementById('btn-menu');
    const btnCloseMenu = document.getElementById('btn-close-menu');
    const menuButtons = document.querySelectorAll('.menu-btn');
    const backButtons = document.querySelectorAll('.btn-back');
    const appContainer = document.getElementById('app');

    // 화면(Screen) 전환 함수
    function switchScreen(screenId) {
        screens.forEach(screen => {
            if (screen.id === screenId) {
                screen.classList.add('active');
            } else {
                screen.classList.remove('active');
            }
        });
    }

    // 햄버거 메뉴 모달 제어
    if (btnMenu) {
        btnMenu.addEventListener('click', () => menuModal.classList.remove('hidden'));
    }
    if (btnCloseMenu) {
        btnCloseMenu.addEventListener('click', () => menuModal.classList.add('hidden'));
    }

    // 메뉴 버튼 클릭 시 라우팅 및 화면 가이드 전환
    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target) {
                menuModal.classList.add('hidden');
                switchScreen(target);
            }
        });
    });

    // 상세페이지 내 뒤로가기 버튼 액션 바인딩
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchScreen('screen-main');
        });
    });

    // [공통 하단 토스트 팝업 컴포넌트] 정의
    window.showToast = function(message, isError = false) {
        if (!appContainer) return;
        
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'error' : ''}`;
        toast.textContent = message;
        appContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000); // 3초간 노출 후 자동 제거 파기
    };
})();
