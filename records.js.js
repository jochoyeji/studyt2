/**
 * js/records.js
 * 공부 가용 시간 조회, 분 단위 성취도 및 알파벳 등급 정밀 산출 연산 비즈니스 모듈
 */
(function() {
    const STORAGE_KEY = 'study_records';
    const TIMETABLE_KEY = 'timetable';
    const SETTINGS_KEY = 'settings';

    // 성취 기준별 기본 매칭 셋업 테이블
    const defaultSettings = [
        { score: 95, grade: 'SS' },
        { score: 85, grade: 'S' },
        { score: 70, grade: 'A' },
        { score: 60, grade: 'B' },
        { score: 50, grade: 'C' },
        { score: 40, grade: 'D' }
    ];

    const StudyRecords = {
        // 요일 인덱스에 매칭되는 시간표 총 가용 목표 타임(분) 연산 추출
        getAvailableTime(dateStr) {
            const date = new Date(dateStr);
            const dayOfWeek = date.getDay(); // 0(일) ~ 6(토)
            
            const timetable = window.AppStorage.get(TIMETABLE_KEY) || {};
            const daySlots = timetable[dayOfWeek] || [];
            
            let totalMinutes = 0;
            daySlots.forEach(slot => {
                if (slot.start && slot.end) {
                    const [sH, sM] = slot.start.split(':').map(Number);
                    const [eH, eM] = slot.end.split(':').map(Number);
                    totalMinutes += (eH * 60 + eM) - (sH * 60 + sM);
                }
            });

            // 임시 테스트용 예외 보완: 시간표 데이터가 비어 있다면 기본 가용 목표 시간을 300분(5시간)으로 임시 상정 처리
            return totalMinutes > 0 ? totalMinutes : 300; 
        },

        // 성취율 및 랭크 알파벳 매칭 반환
        calculateAchievement(studyMinutes, availableMinutes) {
            if (availableMinutes <= 0) return { percent: 0, grade: '' };
            
            let percent = Math.round((studyMinutes / availableMinutes) * 100);
            if (percent > 100) percent = 100; // 한계 상한선 100% 홀딩 규칙

            const settings = window.AppStorage.get(SETTINGS_KEY) || defaultSettings;
            let grade = 'D';
            
            const sortedSettings = [...settings].sort((a, b) => b.score - a.score);
            for (let criterion of sortedSettings) {
                if (percent >= criterion.score) {
                    grade = criterion.grade;
                    break;
                }
            }
            return { percent, grade };
        },

        // 데이터 정합성 검증 및 LocalStorage 원자적 영속 저장 처리
        saveRecord(dateStr, hours, minutes) {
            const studyMinutes = (hours * 60) + minutes;
            const availableMinutes = this.getAvailableTime(dateStr);

            if (availableMinutes <= 0) {
                return { success: false, message: '공부 가능 시간이 설정되지 않은 요일입니다.' };
            }
            if (studyMinutes < 0) {
                return { success: false, message: '실제 공부 시간은 0분 이상이어야 합니다.' };
            }

            const { percent, grade } = this.calculateAchievement(studyMinutes, availableMinutes);
            const records = window.AppStorage.get(STORAGE_KEY) || {};
            
            records[dateStr] = {
                studyMinutes,
                availableMinutes,
                percent,
                grade
            };

            const saved = window.AppStorage.save(STORAGE_KEY, records);
            return { 
                success: saved, 
                message: saved ? '저장되었습니다' : '저장 실패',
                isOver: (studyMinutes > availableMinutes)
            };
        },

        getAllRecords() {
            return window.AppStorage.get(STORAGE_KEY) || {};
        }
    };
    window.StudyRecords = StudyRecords;
})();