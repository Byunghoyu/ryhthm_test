/**
 * 🎵 비트 크리에이터 - 설정 파일
 * 나만의 비트를 만들어보세요!
 */

const BASE_PATH = process.env.NODE_ENV === 'production' ? '/ryhthm_test' : '';
const VERSION = 'v1.0.0';

export const beatCreatorConfig = {
    // ============================================
    // 📝 기본 정보
    // ============================================
    INFO: {
        browserTitle: '🎵 당신의 비트를 만들어보세요!',
        title: '🎵 당신의 비트를 만들어보세요!',
        subtitle: '내가 플레이한 곡에 나만의 비트를 입혀보세요!',
        tipText: '\n✨음악을 선택하고 재생 버튼을 누른 후, 비트에 맞춰 화면을 터치하세요!\n✨완성된 비트맵은 검토 후 게임에 반영될 수 있어요\n✨비트는 한 번에 가야하니 화이팅하세요!',
    },

    // ============================================
    // 🎵 트랙 목록
    // ============================================
    TRACKS: [
        {
            id: 'track1',
            name: 'Smooth',
            difficulty: 1,
            src: `${BASE_PATH}/assets/bgm1.wav?v=${VERSION}`
        },
        {
            id: 'track2',
            name: 'Festival',
            difficulty: 2,
            src: `${BASE_PATH}/assets/bgm2.wav?v=${VERSION}`
        }
    ],

    // ============================================
    // 🔘 버튼 텍스트
    // ============================================
    BUTTONS: {
        backToGame: '← 게임으로 돌아가기',
        playRecord: '▶️ 재생 & 녹음',
        stop: '⏹️ 정지',
        reset: '🔄 재설정',
        copyBeatmap: '비트맵 복사하기',
    },

    // ============================================
    // 📋 스텝 제목
    // ============================================
    STEPS: {
        step1: '음악 선택',
        step2: '비트 레코딩',
        step3: '비트맵 복사 & 제출',
    },

    // ============================================
    // 📤 제출 설정 (Google Sheets 연동)
    // ============================================
    SUBMIT: {
        apiUrl: 'https://script.google.com/macros/s/AKfycbymMivccVEJqP9y7YihZDisa6-Vo9mvTRINQNo2ZU47jhFp91kaAVgLo2Yp7cmbuMxV1Q/exec',
        nameLabel: '이름 (닉네임)',
        namePlaceholder: '예: 리듬마스터',
        commentLabel: '코멘트 (선택)',
        commentPlaceholder: '비트맵에 대한 설명이나 하고 싶은 말!',
        submitButton: '📤 나의 비트 제출하기',
    },

    // ============================================
    // 📝 상태 메시지
    // ============================================
    MESSAGES: {
        selectMusic: '먼저 음악을 선택하세요',
        readyToRecord: '재생 버튼을 눌러 시작하세요!',
        recording: '비트에 맞춰 터치하세요!',
        recordingDone: '녹음 완료!',
        copied: '✅ 비트맵이 클립보드에 복사되었습니다!',
        copyFailed: '❌ 복사에 실패했습니다. 직접 복사해주세요.',
        noBeatmap: '비트맵이 비어있습니다. 먼저 비트를 녹음해주세요!',
        submitting: '⏳ 제출 중...',
        submitSuccess: '✅ 비트맵이 성공적으로 제출되었습니다!',
        submitFailed: '❌ 제출에 실패했습니다. 다시 시도해주세요.',
        noApiUrl: '⚠️ API URL이 설정되지 않았습니다.',
    },

    // ============================================
    // 📊 통계 라벨
    // ============================================
    STATS: {
        beatCount: '비트 수',
        lastBeat: '마지막 비트 (ms)',
    },
};
