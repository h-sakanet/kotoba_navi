import type { SeedLearningDailyStat, SeedSchedule, SeedWord } from '../helpers/dbSeed';

export interface LearningDashboardVisualCase {
    name: string;
    scopeId: string;
    words: SeedWord[];
    schedules: SeedSchedule[];
    learningDailyStats: SeedLearningDailyStat[];
}

const PROVERB_WORD: SeedWord = {
    page: 12,
    numberInPage: 1,
    category: 'ことわざ',
    question: '行動するとよい機会に出会うこともある',
    answer: '犬も歩けば棒に当たる',
    rawWord: '犬も歩けば棒に当たる',
    yomigana: 'いぬもあるけばぼうにあたる',
    rawMeaning: '行動するとよい機会に出会うこともある',
    isLearnedCategory: true,
    isLearnedMeaning: false
};

const HOMONYM_WORD: SeedWord = {
    page: 144,
    numberInPage: 1,
    category: '同音異義語',
    question: '',
    answer: '',
    rawWord: '医院',
    yomigana: 'いいん',
    rawMeaning: '',
    groupMembers: [
        {
            rawWord: '医院',
            yomigana: 'いいん',
            exampleSentence: '先生は＿＿に勤めている。',
            exampleSentenceYomigana: 'せんせいは＿＿につとめている。'
        },
        {
            rawWord: '委員',
            yomigana: 'いいん',
            exampleSentence: '学級＿＿として活動する。',
            exampleSentenceYomigana: 'がっきゅう＿＿としてかつどうする。'
        }
    ],
    isLearnedCategory: false,
    isLearnedMeaning: false
};

export const LEARNING_DASHBOARD_VISUAL_CASES: LearningDashboardVisualCase[] = [
    {
        name: 'dual-panel',
        scopeId: '42A-02',
        words: [PROVERB_WORD],
        schedules: [{ scopeId: '42A-02', date: '2026-02-17' }],
        learningDailyStats: [
            { scopeId: '42A-02', date: '2026-02-14', unitKey: 'word:1', side: 'left', revealCount: 3, testCorrectCount: 1, testWrongCount: 2, testForgotCount: 1 },
            { scopeId: '42A-02', date: '2026-02-15', unitKey: 'word:1', side: 'left', revealCount: 2, testCorrectCount: 2, testWrongCount: 1, testForgotCount: 0 },
            { scopeId: '42A-02', date: '2026-02-16', unitKey: 'word:1', side: 'right', revealCount: 2, testCorrectCount: 1, testWrongCount: 1, testForgotCount: 0 },
            { scopeId: '42A-02', date: '2026-02-17', unitKey: 'word:1', side: 'right', revealCount: 1, testCorrectCount: 2, testWrongCount: 0, testForgotCount: 0 }
        ]
    },
    {
        name: 'single-panel',
        scopeId: '42A-17',
        words: [HOMONYM_WORD],
        schedules: [{ scopeId: '42A-17', date: '2026-02-17' }],
        learningDailyStats: [
            { scopeId: '42A-17', date: '2026-02-15', unitKey: 'member:1:0', side: 'right', revealCount: 2, testCorrectCount: 1, testWrongCount: 1, testForgotCount: 0 },
            { scopeId: '42A-17', date: '2026-02-16', unitKey: 'member:1:1', side: 'right', revealCount: 1, testCorrectCount: 1, testWrongCount: 2, testForgotCount: 1 },
            { scopeId: '42A-17', date: '2026-02-17', unitKey: 'member:1:0', side: 'right', revealCount: 1, testCorrectCount: 2, testWrongCount: 0, testForgotCount: 0 }
        ]
    },
    {
        name: 'empty',
        scopeId: '42A-02',
        words: [],
        schedules: [{ scopeId: '42A-02', date: '2026-02-17' }],
        learningDailyStats: []
    }
];
