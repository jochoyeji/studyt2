/**
 * js/storage.js
 * 브라우저 LocalStorage 데이터 입출력을 안전하게 예외처리 관리하는 데이터 독립 모듈
 */
(function() {
    const AppStorage = {
        save(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('Storage 갱신 실패:', e);
                return false;
            }
        },
        get(key) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.error('Storage 탐색 실패:', e);
                return null;
            }
        }
    };
    window.AppStorage = AppStorage;
})();