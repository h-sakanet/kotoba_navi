import type { Word } from '../types';
import type { CategorySettings, FieldGroup, FieldSpec } from './categoryConfig';
import { buildMemberUnitKey, buildWordUnitKey, type LearningSide } from '../services/learningLogService';

export const LEARNING_DASHBOARD_WINDOW_DAYS = 14;

export type LearningMetricKey =
    | 'revealCount'
    | 'testWrongCount'
    | 'testCorrectCount'
    | 'testForgotCount';

export type LearningMetricLabel = {
    key: LearningMetricKey;
    label: string;
};

export const LEARNING_METRIC_LABELS: LearningMetricLabel[] = [
    { key: 'revealCount', label: 'シート学習' },
    { key: 'testWrongCount', label: 'テスト不正解' },
    { key: 'testCorrectCount', label: 'テスト正解' },
    { key: 'testForgotCount', label: 'テスト忘却' }
];

export interface LearningUnit {
    id: string;
    title: string;
    leftUnitKey?: string;
    rightUnitKey?: string;
}

const specHasMask = (spec: FieldSpec): boolean => {
    if (spec.type === 'field') return !!spec.masked;
    return !!spec.masked || !!spec.maskFields?.length;
};

const groupsHaveMask = (groups?: FieldGroup[]): boolean => {
    return groups?.some(group => group.some(specHasMask)) ?? false;
};

export const resolveTestSideByUpdateTarget = (
    settings: CategorySettings,
    updatesLearned: 'category' | 'meaning'
): LearningSide | null => {
    const test = settings.tests.find(item => item.updatesLearned === updatesLearned);
    if (!test) return null;
    return test.retryUnlockSide;
};

export const resolveTestSideByTestId = (
    settings: CategorySettings,
    testId: string
): LearningSide | null => {
    const test = settings.tests.find(item => item.id === testId);
    if (!test) return null;
    return test.retryUnlockSide;
};

export const getDashboardSideVisibility = (settings: CategorySettings): { showLeft: boolean; showRight: boolean } => {
    const hasLeftMask = groupsHaveMask(settings.wordList.left);
    const hasRightMask = groupsHaveMask(settings.wordList.right);
    const categorySide = resolveTestSideByUpdateTarget(settings, 'category');
    const meaningSide = resolveTestSideByUpdateTarget(settings, 'meaning');
    const hasLeftTest = categorySide === 'left' || meaningSide === 'left';
    const hasRightTest = categorySide === 'right' || meaningSide === 'right';

    return {
        showLeft: hasLeftMask || hasLeftTest,
        showRight: hasRightMask || hasRightTest
    };
};

const buildTitleFromWord = (word: Word): string => {
    return word.rawWord?.trim() || word.question?.trim() || '（未設定）';
};

const buildPairTitleFromMembers = (word: Word): string => {
    const first = word.groupMembers?.[0]?.rawWord?.trim();
    const second = word.groupMembers?.[1]?.rawWord?.trim();
    if (first && second) return `${first} / ${second}`;
    if (first) return first;
    return buildTitleFromWord(word);
};

export const buildLearningUnits = (
    words: Word[],
    settings: CategorySettings
): LearningUnit[] => {
    const units: LearningUnit[] = [];

    for (const word of words) {
        if (typeof word.id !== 'number') continue;

        const hasMembers = !!word.groupMembers && word.groupMembers.length > 0;
        const titleSource = settings.learningDashboard.titleSource;

        if (titleSource === 'left_right_pair') {
            if (hasMembers && (word.groupMembers?.length ?? 0) >= 2) {
                units.push({
                    id: `pair:${word.id}`,
                    title: buildPairTitleFromMembers(word),
                    leftUnitKey: buildMemberUnitKey(word.id, 0),
                    rightUnitKey: buildMemberUnitKey(word.id, 1)
                });
                continue;
            }

            const unitKey = buildWordUnitKey(word.id);
            units.push({
                id: `word:${word.id}`,
                title: buildTitleFromWord(word),
                leftUnitKey: unitKey,
                rightUnitKey: unitKey
            });
            continue;
        }

        if (hasMembers) {
            word.groupMembers!.forEach((member, index) => {
                const key = buildMemberUnitKey(word.id!, index);
                units.push({
                    id: `member:${word.id}:${index}`,
                    title: member.rawWord?.trim() || buildTitleFromWord(word),
                    leftUnitKey: key,
                    rightUnitKey: key
                });
            });
            continue;
        }

        const key = buildWordUnitKey(word.id);
        units.push({
            id: `word:${word.id}`,
            title: buildTitleFromWord(word),
            leftUnitKey: key,
            rightUnitKey: key
        });
    }

    return units;
};

export const buildDateWindow = (
    endDate: string,
    days: number = LEARNING_DASHBOARD_WINDOW_DAYS
): { startDate: string; endDate: string; dateKeys: string[]; labels: string[]; rangeLabel: string } => {
    const end = new Date(`${endDate}T00:00:00`);
    const labels: string[] = [];
    const dateKeys: string[] = [];

    const toKey = (date: Date): string => {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    for (let offset = days - 1; offset >= 0; offset -= 1) {
        const current = new Date(end);
        current.setDate(end.getDate() - offset);
        labels.push(`${current.getMonth() + 1}/${current.getDate()}`);
        dateKeys.push(toKey(current));
    }

    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));

    const toDisplay = (date: Date): string => `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

    return {
        startDate: toKey(start),
        endDate: toKey(end),
        dateKeys,
        labels,
        rangeLabel: `${toDisplay(start)} 〜 ${toDisplay(end)}`
    };
};
