/**
 * js/calendar.js
 * 사용자 시스템 날짜 동적 연동, 달력 그리드 인터페이스 렌더러 및 상단 통계 스케줄러 통합 모듈
 */
(function() {
    const calendarContainer = document.getElementById('calendar-container');
    const monthYearDisplay = document.getElementById('current-month-year');
    
    const studyModal = document.getElementById('study-time-modal');
    const inputHours = document.getElementById('input-hours');
    const inputMinutes = document.getElementById('input-minutes');
    const errorText = document.getElementById('study-time-error');
    const btnSaveTime = document.getElementById('btn-save-time');

    let selectedDateStr = null;

    // 메인 달력 테이블 동적 마크업 생성 핸들러
    function renderCalendar() {
        if (!calendarContainer || !monthYearDisplay) return;

        // 실제 클라이언트의 현재 시각 데이터를 추적 추출합니다
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); 
        const todayDate = now.getDate();
        
        // [상단 날짜 표시] 정적 텍스트를 파괴하고 실제 현재 년도와 월을 주입 (예: 2026년 7월)
        monthYearDisplay.textContent = `${year}년 ${month + 1}월`;
        calendarContainer.innerHTML = '';

        // 요일 바 상단 헤더 루프 정렬
        const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
        daysOfWeek.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'cal-header-day';
            dayDiv.textContent = day;
            calendarContainer.appendChild(dayDiv);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // 1일 시작점 앞 빈 공백 그리드 칸 채우기
        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            calendarContainer.appendChild(emptyDiv);
        }

        let records = {};
        if (window.StudyRecords && typeof window.StudyRecords.getAllRecords === 'function') {
            records = window.StudyRecords.getAllRecords();
        }

        // 해당 월의 총 일수 순회 빌드업 루프
        for (let i = 1; i <= daysInMonth; i++) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'cal-day';
            
            if (i === todayDate) {
                dateDiv.classList.add('today');
            }

            const dateSpan = document.createElement('span');
            dateSpan.textContent = i;
            
            const gradeSpan = document.createElement('span');
            gradeSpan.className = 'grade-display';
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            if (records[dateStr] && records[dateStr].grade) {
                gradeSpan.textContent = records[dateStr].grade;
            }

            dateDiv.appendChild(dateSpan);
            dateDiv.appendChild(gradeSpan);

            dateDiv.addEventListener('click', () => {
                selectedDateStr = dateStr;
                openStudyModal();
            });

            calendarContainer.appendChild(dateDiv);
        }

        // 최상단 통계 계산 스케줄러 갱신 작동
        updateTopStats(year, month, records);
    }

    // 최상단 테두리 박스 3종 컴포넌트 데이터 실시간 바인딩 함수
    function updateTopStats(year, month, records) {
        const statAvg = document.getElementById('stat-avg');
        const statYesterday = document.getElementById('stat-yesterday');
        const statStreak = document.getElementById('stat-streak');

        if (!statAvg || !statYesterday || !statStreak) return;

        // [1] 월 평균 달성률 합산
        let totalPercent = 0;
        let count = 0;
        const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        Object.keys(records).forEach(dateKey => {
            if (dateKey.startsWith(prefix)) {
                totalPercent += records[dateKey].percent;
                count++;
            }
        });
        statAvg.textContent = count > 0 ? `${Math.round(totalPercent / count)}%` : '-';

        // [2] 어제 기록 조회 매칭
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        
        if (records[yKey]) {
            statYesterday.textContent = `${records[yKey].grade}(${records[yKey].percent}%)`;
        } else {
            statYesterday.textContent = '-';
        }

        // [3] 연속 달성 일수 연산 루프 (A등급 이상 조건부 만족 스캔)
        let streak = 0;
        let checkDate = new Date();
        let safetyCounter = 0;
        
        while (safetyCounter < 100) {
            safetyCounter++;
            const cKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
            const record = records[cKey];
            
            if (record && ['SS', 'S', 'A'].includes(record.grade)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                if (streak === 0 && cKey === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
                break;
            }
        }
        statStreak.textContent = streak >= 2 ? `${streak}일` : '-일';
    }

    function openStudyModal() {
        if (!studyModal) return;
        inputHours.value = '';
        inputMinutes.value = '';
        errorText.classList.add('hidden');
        studyModal.classList.remove('hidden');
    }

    function closeStudyModal() {
        if (studyModal) studyModal.classList.add('hidden');
    }

    // 서버 사이드/인스턴스 렌더 락을 우회하기 위한 구동 시점 조건부 예외 처리 보장구조
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderCalendar);
    } else {
        renderCalendar();
    }

    if (studyModal) {
        studyModal.addEventListener('click', (e) => {
            if (e.target === studyModal) closeStudyModal();
        });
    }

    if (btnSaveTime) {
        btnSaveTime.addEventListener('click', () => {
            const hStr = inputHours.value.trim();
            const mStr = inputMinutes.value.trim();

            if (hStr === '' && mStr === '') {
                errorText.classList.remove('hidden');
                return;
            }

            const hours = hStr === '' ? 0 : Number(hStr);
            const minutes = mStr === '' ? 0 : Number(mStr);

            if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0) {
                errorText.classList.remove('hidden');
                return;
            }

            errorText.classList.add('hidden');

            if (window.StudyRecords && typeof window.StudyRecords.saveRecord === 'function') {
                const result = window.StudyRecords.saveRecord(selectedDateStr, hours, minutes);
                if (result.success) {
                    closeStudyModal();
                    renderCalendar();
                    if (result.isOver) {
                        if (window.showToast) window.showToast('목표 시간을 초과하여 100%로 기록되었습니다!');
                    } else {
                        if (window.showToast) window.showToast(result.message);
                    }
                } else {
                    if (window.showToast) window.showToast(result.message, true);
                }
            }
        });
    }
})();
