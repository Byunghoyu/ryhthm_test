/**
 * 🎵 메인 게임 - 설정 파일
 * 게임 텍스트, 에셋, 난이도 등 수정
 */

const BASE_PATH = '/ryhthm_test';

export const gameConfig = {
    version: 'v1.0.0', // 캐시 제어 및 버전 확인용
    GAME_INFO: {
        id: 'rhythm-game',
        name: '쉐이크를 흔들어주세요!',
        titleSuffix: '수염난 카피바라',
        themeColors: {
            main: '#E8F4FC',
            sub: '#F5FAFF',
            textPrimary: '#1A3A5C',
            textSecondary: '#6B8FAD',
            accent: '#3A8DDE',
            accentLight: '#7AB8F5',
            accentDark: '#2A6CB8',
            objectBase: '#A7D3F3',
            objectLight: '#D4EDFF',
            shadowSoft: 'rgba(58, 141, 222, 0.15)',
            shadowMedium: 'rgba(58, 141, 222, 0.25)',
            shadowStrong: 'rgba(26, 58, 92, 0.2)',
            success: '#4CAF50',
            fail: '#FF6B6B',
            overlay: 'rgba(26, 58, 92, 0.7)',
            perfect: '#FFD700',
            great: '#FF6B35',
            good: '#4CAF50',
            miss: '#888888',
        },
    },
    TIMING: {
        perfect: 50,
        great: 100,
        good: 150,
        miss: 200,
    },
    SCORING: {
        perfect: 100,
        great: 75,
        good: 50,
        miss: 0,
        combo_bonus: 10,
    },
    difficulty: 'normal',
    DIFFICULTY_SETTINGS: {
        easy: {
            successThreshold: 50,
            timingMultiplier: 1.5,
            hitZoneScale: 1.2,
            lives: 5,
            medals: { gold: 90, silver: 75, bronze: 60 },
        },
        normal: {
            successThreshold: 60,
            timingMultiplier: 1.0,
            hitZoneScale: 1.0,
            lives: 3,
            medals: { gold: 90, silver: 75, bronze: 60 },
        },
        hard: {
            successThreshold: 75,
            timingMultiplier: 0.75,
            hitZoneScale: 0.8,
            lives: 1,
            medals: { gold: 90, silver: 75, bronze: 60 },
        },
    },
    GAME: {
        countdownSeconds: 3,
        infoScreenDuration: 3000,
    },
    STRINGS: {
        difficultyInfo: {
            title: '준비되셨나요?',
            labels: {
                easy: 'EASY MODE',
                normal: 'NORMAL MODE',
                hard: 'HARD MODE',
            },
            desc: '히트박스: {scale}\n목숨: {lives}개',
            scales: {
                easy: '120% (큼)',
                normal: '100% (보통)',
                hard: '80% (작음)',
            },
        },
        title: '카피바라는\n단백질이 필요해!',
        gameName: '쉐이크를 흔들어주세요!',
        gameDesc: '이어폰을 꼭 껴주세요!🎧',
        rollingMessages: [
            '⚠️ 절대 회사에서 하지마세요 ⚠️',
            '🎧 시작전에 이어폰 켜시고 볼륨을 꼭 확인해주세요 🎧',
            '⚠️ 누군가를 특정하고 있지 않습니다 ⚠️',
        ],
        rollingTime: 25,
        startButton: '시작하기',
        participantCount: '명 참여',
        tutorialTitle: '게임 설정',
        tutorialDesc: '비트가 중앙에 올 때\n타이밍에 맞춰 터치하세요!',
        tutorialButton: 'GO!',
        judgments: {
            perfect: '✨ PERFECT! ✨',
            great: '🔥 GREAT!',
            good: '👍 GOOD',
            miss: '💨 MISS',
        },
        tapHint: '🎵 비트에 맞춰 터치!',
        medals: {
            gold: {
                icon: '🥇',
                title: '완벽하게 섞였어요!',
                desc: '결혼 할 수 있을 것 같아요',
            },
            silver: {
                icon: '🥈',
                title: '나쁘지 않은 맛이에요!',
                desc: '조금만 더하면 퍼펙트!',
            },
            bronze: {
                icon: '🥉',
                title: '최선을 다했나요?',
                desc: '운동에 도움은 되겠어요',
            },
        },
        resultButtons: {
            changeTrack: '곡 및 난이도 변경',
            retry: '지금 난이도로 다시하기',
            share: '친구에게 공유하기',
            createBeat: '나만의 비트 만들기',
        },
        fail: {
            icon: '😢',
            title: '얼굴이 빨개졌어요',
            desc: '다시 한번 도전해보세요!',
        },
        yourRecord: '내 점수',
        avgRecord: '정확도',
        mySpeed: '퍼펙트 수',
    },
    ASSETS: {
        logo: `${BASE_PATH}/assets/logo.png`,
        characterIdle: `${BASE_PATH}/assets/character_idle.png`,
        characterWin: `${BASE_PATH}/assets/character_win.png`,
        characterFail: `${BASE_PATH}/assets/character_fail.png`,
        background: `${BASE_PATH}/assets/background.png`,
        beatNote: `${BASE_PATH}/assets/beat_note.png`,
        soundFail: { src: `${BASE_PATH}/assets/bgm1.wav` },
        soundSuccess: `${BASE_PATH}/assets/cheer.mp3`,
        shaker: [
        ],
        miss: `${BASE_PATH}/assets/shaker_miss.png`,
        ingredients: ['🥦', '🥩', '🥚', '🍌', '🥛', '🥕', '🥑', '🍗'],
    },
    DATABASE: {
        type: 'google_sheet',
        url: '',
    },
    SHARE: {
        resultText: '🎵 [{track}]에서 {score}점 달성! 🎵\n너도 같이 쉐이크 흔들어볼래?',
        titleText: '🧉 카피바라가 단백질을 기다리고 있어!\n같이 쉐이크 만들러 가자! 🎵',
        url: '',
        ogImage: `${BASE_PATH}/assets/character_idle.png`,
    },
};
