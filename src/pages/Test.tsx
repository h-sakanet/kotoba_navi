import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { X, ThumbsUp, RotateCcw, ChevronLeft } from 'lucide-react';
import { db } from '../db';
import { findScopeById } from '../data/scope';
import { type Word, type TestType } from '../types';
import clsx from 'clsx';
import { sheetLockService } from '../services/sheetLockService';
import {
    buildMemberUnitKey,
    buildWordUnitKey,
    learningLogService,
    type LearningLogIncrement
} from '../services/learningLogService';

import {
    CATEGORY_SETTINGS,
    type FieldGroup,
    type FieldSpec,
    type FieldType,
    type GroupMembersMode
} from '../utils/categoryConfig';
import { resolveTestSideByTestId } from '../utils/learningDashboard';
import { getDataFieldKey, type DataFieldKey } from '../utils/fieldMapping';
import { splitByPlaceholder } from '../utils/placeholder';

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const renderPlaceholderParts = (
    parts: string[],
    renderInserted: () => React.ReactNode
) => (
    <>
        {parts.map((part, i) => (
            <React.Fragment key={i}>
                {part}
                {i < parts.length - 1 && renderInserted()}
            </React.Fragment>
        ))}
    </>
);

// --- Helper for Config-Driven Rendering ---

type TestRenderableMember = {
    rawWord?: string;
    rawMeaning?: string;
    yomigana?: string;
    exampleSentence?: string;
    exampleSentenceYomigana?: string;
    customLabel?: string;
};

type GroupMembersSpec = Extract<FieldSpec, { type: 'group_members' }>;

const getMemberFieldValue = (member: TestRenderableMember, field: DataFieldKey): string => {
    const value = member[field];
    return typeof value === 'string' ? value : '';
};

const getGroupMemberFieldClassName = (fieldName: FieldType, mode: GroupMembersMode): string => {
    if (fieldName === 'word') {
        return "font-bold text-2xl md:text-3xl text-blue-600";
    }
    if (fieldName === 'example_yomigana') {
        return "text-gray-400 text-sm font-bold mb-1 self-start pl-2";
    }
    if (fieldName === 'yomigana' && mode === 'proverb_group') {
        return "text-gray-400 text-sm font-bold mb-1 text-center";
    }
    if (fieldName === 'example') {
        return "font-bold text-2xl md:text-3xl leading-snug text-gray-800 w-full text-left px-2";
    }

    return "text-gray-800";
};

type GroupMemberModeRenderContext = {
    spec: GroupMembersSpec;
    member: TestRenderableMember;
    fieldName: FieldType;
    val: string;
    className: string;
};

type GroupMemberModeRenderer = (
    context: GroupMemberModeRenderContext
) => React.ReactNode | null | undefined;

const sentenceFillRenderer: GroupMemberModeRenderer = ({ member, fieldName, val, className }) => {
    if (fieldName !== 'example') return undefined;

    const wordToFill = member.rawWord || '';
    const parts = splitByPlaceholder(val);
    if (!parts) return undefined;

    return (
        <div className={className}>
            {renderPlaceholderParts(parts, () => (
                <span className="text-blue-600 underline decoration-2 underline-offset-4">{wordToFill}</span>
            ))}
        </div>
    );
};

const homonymFillRenderer: GroupMemberModeRenderer = ({ spec, member, fieldName, val, className }) => {
    if (fieldName === 'word') return null;
    if (fieldName !== 'example') return undefined;

    const parts = splitByPlaceholder(val);
    if (!parts) return undefined;

    const wordToFill = member.rawWord || '';
    const isQuestion = !spec.fields.includes('word');

    return (
        <div className={className}>
            {renderPlaceholderParts(parts, () => (
                isQuestion
                    ? <span className="font-bold text-gray-800">＿＿</span>
                    : <span className="text-blue-600 font-bold underline decoration-2 underline-offset-4">{wordToFill}</span>
            ))}
        </div>
    );
};

const GROUP_MEMBER_MODE_RENDERERS: Partial<Record<GroupMembersMode, GroupMemberModeRenderer>> = {
    sentence_fill: sentenceFillRenderer,
    homonym_fill: homonymFillRenderer
};

const ConfiguredTestGroupMembers: React.FC<{ spec: GroupMembersSpec; word: Word }> = ({ spec, word }) => {
    let members: TestRenderableMember[] = word.groupMembers && word.groupMembers.length > 0 ? word.groupMembers : [word];

    // Sort members if orderBy is specified
    if (spec.orderBy === 'customLabel') {
        members = [...members].sort((a, b) => {
            const labelA = a.customLabel || '';
            const labelB = b.customLabel || '';
            if (labelA < labelB) return -1;
            if (labelA > labelB) return 1;
            return 0;
        });
    }

    // For synonyms, we usually want to show two items.
    // Spec fields: ['example_yomigana', 'example'] (Question) or ['example_yomigana', 'example', 'word'] (Answer)

    return (
        <div className="flex flex-col gap-4 w-full">
            {members.map((member, idx) => (
                <div key={idx} className="flex justify-center w-full">
                    <div className="relative flex flex-col items-center">

                        {/* Custom Label Display */}
                        {spec.showCustomLabel && member.customLabel && (
                            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 mt-3">
                                <div className="text-sm font-bold text-blue-600 shrink-0 w-8 text-center bg-white rounded px-1 py-0.5 border border-blue-100">
                                    {member.customLabel}
                                </div>
                            </div>
                        )}

                        {/* Fields Container */}
                        <div className="flex flex-col items-center">
                            {/* Iterate through the requested fields for each member */}
                            {spec.fields.map((fieldName, fIdx) => {
                                const val = getMemberFieldValue(member, getDataFieldKey(fieldName));
                                if (!val) return null;

                                const className = getGroupMemberFieldClassName(fieldName, spec.mode);
                                const modeRenderer = GROUP_MEMBER_MODE_RENDERERS[spec.mode];
                                const renderedByMode = modeRenderer?.({ spec, member, fieldName, val, className });
                                if (renderedByMode !== undefined) {
                                    return <React.Fragment key={fIdx}>{renderedByMode}</React.Fragment>;
                                }

                                return <div key={fIdx} className={className}>{val}</div>
                            })}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ConfiguredTestField: React.FC<{ spec: FieldSpec; word: Word }> = ({ spec, word }) => {
    if (spec.type === 'group_members') {
        return <ConfiguredTestGroupMembers spec={spec} word={word} />;
    }

    const val = getMemberFieldValue(word, getDataFieldKey(spec.field));

    // Style mapping
    const role = spec.role || 'main';
    let className = "text-gray-800";

    if (role === 'main') {
        className = "font-bold text-2xl md:text-3xl leading-snug text-gray-800";
    } else if (role === 'sub') {
        className = "text-gray-400 text-sm font-bold mb-1";
    } else if (role === 'sentence') {
        className = "text-lg text-gray-400 font-normal leading-relaxed";
    } else if (role === 'answer') {
        // Answer role often involves blue color or emphasis
        className = "font-bold text-blue-600 text-2xl md:text-3xl leading-snug";
    }

    const placeholderParts = val && typeof val === 'string' ? splitByPlaceholder(val) : null;
    if (spec.transform === 'sentence_fill' && placeholderParts) {
        const wordToFill = word.rawWord || '???';
        return (
            <div className={className}>
                {renderPlaceholderParts(placeholderParts, () => (
                    <span className="text-blue-600 underline decoration-2 underline-offset-4 font-bold">
                        {wordToFill}
                    </span>
                ))}
            </div>
        );
    }

    if (!val) return null;
    return <div className={className}>{val}</div>;
};

const ConfiguredTestGroup: React.FC<{ groups: FieldGroup[]; word: Word }> = ({ groups, word }) => {
    return (
        <div className="flex flex-col gap-6 items-center w-full text-center">
            {groups.map((group, i) => (
                <div key={i} className="flex flex-col items-center w-full">
                    {group.map((spec, j) => (
                        <ConfiguredTestField key={j} spec={spec} word={word} />
                    ))}
                </div>
            ))}
        </div>
    );
};

export const Test: React.FC = () => {
    const { scopeId } = useParams<{ scopeId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Parse params
    const type = (searchParams.get('type') as TestType) || 'category';
    const isFinalMode = searchParams.get('final') === 'true';

    const scope = scopeId ? findScopeById(scopeId) : undefined;

    // Config Driven Setup
    const categoryConfig = scope ? CATEGORY_SETTINGS[scope.category] : undefined;
    // Find active test config
    const testConfig = categoryConfig?.tests.find(t => t.id === type);


    const [questions, setQuestions] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        if (!scope) return;
        const fetchData = async () => {
            let words = await db.words
                .where('page')
                .between(scope.startPage, scope.endPage, true, true)
                .toArray();

            // Filter logic
            if (!isFinalMode) {
                if (type === 'meaning') {
                    words = words.filter(w => !w.isLearnedMeaning);
                } else {
                    // Category test (default)
                    words = words.filter(w => !w.isLearnedCategory);
                }
            }

            // Shuffle
            const shuffled = shuffleArray(words);
            setQuestions(shuffled);
            setLoading(false);
        };
        fetchData();
    }, [scope, type, isFinalMode]);

    const currentWord = questions[currentIndex];

    const getTestUnitKeys = (word: Word): string[] => {
        if (typeof word.id !== 'number') return [];
        if (word.groupMembers && word.groupMembers.length > 0) {
            return word.groupMembers.map((_, idx) => buildMemberUnitKey(word.id!, idx));
        }
        return [buildWordUnitKey(word.id)];
    };

    const handleResult = async (result: 'correct' | 'retry') => {
        if (!categoryConfig || !testConfig) return;
        if (!currentWord.id) return;

        // Determine which flag to update based on test config
        // 'category' -> isLearnedCategory
        // 'meaning' -> isLearnedMeaning
        const updateTarget = (testConfig?.updatesLearned === 'meaning') ? 'isLearnedMeaning' : 'isLearnedCategory';

        const updates: Partial<Word> & { lastStudied: Date } = { lastStudied: new Date() };

        if (!isFinalMode) {
            if (result === 'correct') {
                updates[updateTarget] = true;
            } else if (result === 'retry') {
                updates[updateTarget] = false;
            }
        } else {
            // Final Mode: Special rule
            if (result === 'retry') {
                updates[updateTarget] = false;
            }
        }

        await db.words.update(currentWord.id, updates);

        if (result === 'retry') {
            const retryUnlockSide = testConfig.retryUnlockSide;
            await sheetLockService.unlockByWordAndSide(currentWord.id, retryUnlockSide);
        }

        const testSide = resolveTestSideByTestId(categoryConfig, testConfig.id);
        const unitKeys = getTestUnitKeys(currentWord);
        if (scope && testSide && unitKeys.length > 0) {
            const eventType = result === 'correct' ? 'test_correct' : 'test_wrong';
            const logs: LearningLogIncrement[] = unitKeys.map(unitKey => ({
                scopeId: scope.id,
                unitKey,
                side: testSide,
                eventType
            }));

            if (isFinalMode && result === 'retry') {
                unitKeys.forEach(unitKey => {
                    logs.push({
                        scopeId: scope.id,
                        unitKey,
                        side: testSide,
                        eventType: 'test_forgot'
                    });
                });
            }

            await learningLogService.incrementMany(logs);
        }

        // Move to next
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        } else {
            setCompleted(true);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsFlipped(true); // Always show answer when going back
        }
    };

    if (!scope) return <div>Scope not found</div>;
    // Strict Config: If config is missing, show error instead of fallback behavior
    if (!categoryConfig || !testConfig) return <div>Configuration not found for this category/test.</div>;
    if (loading) return <div>Loading...</div>;

    if (completed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-6 text-center">
                <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ThumbsUp size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">お疲れ様でした！</h2>
                    <p className="text-gray-500 mb-8">
                        {isFinalMode ? '最終テスト完了です。' : '未習得の問題をすべて学習しました。'}
                    </p>
                    <button
                        onClick={() => navigate(`/?modal=${scopeId}`)}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-blue-700 transition-colors"
                    >
                        テスト終了
                    </button>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">課題はありません</h2>
                <p className="text-gray-500 mb-8">すべての単語を習得済みです！</p>
                <button
                    onClick={() => navigate(`/?modal=${scopeId}`)}
                    className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                    ホームに戻る
                </button>
            </div>
        );
    }

    // Determine display strings based on type


    // Header Title logic
    let title = isFinalMode ? '最終テスト' : `${scope.category}テスト`;
    if (type === 'meaning') {
        title = isFinalMode ? '最終テスト(意味)' : '意味テスト';
    } else if (isFinalMode) {
        title = `最終テスト(${scope.category})`;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-center bg-white/50 backdrop-blur-sm border-b border-gray-300 relative min-h-[64px]">
                <button
                    onClick={() => navigate(`/?modal=${scopeId}`)}
                    className="absolute left-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold"
                >
                    <X size={24} />
                    <span>中断</span>
                </button>
                <div className="font-bold text-lg text-gray-700">
                    {title}
                </div>
            </header>

            {/* Main Card Area */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full">



                <div className="w-full max-w-4xl flex justify-center relative">
                    <div className="w-full max-w-2xl relative">
                        {/* Back Button (Outside Card) */}
                        <div
                            className={clsx(
                                "absolute right-full bottom-7 mr-4 transition-opacity",
                                currentIndex > 0 ? "opacity-100" : "opacity-0 pointer-events-none"
                            )}
                        >
                            <button
                                onClick={handleBack}
                                className="p-3 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors shadow-sm"
                                aria-label="前の問題に戻る"
                            >
                                <ChevronLeft size={28} />
                            </button>
                        </div>

                        {/* Counter (Outside Card) */}
                        <div className="absolute -top-8 w-full text-center text-gray-500 font-bold pointer-events-none">
                            {currentIndex + 1} / {questions.length}
                        </div>

                        <div className="w-full bg-white rounded-3xl shadow-xl overflow-hidden min-h-[400px] flex flex-col relative">
                            {/* Config Driven Question View */}
                            {!isFlipped && (
                                <div className="flex-1 p-8 flex flex-col items-center justify-center gap-8">
                                    <ConfiguredTestGroup groups={testConfig.question} word={currentWord} />

                                    {/* Proverb Group Hint */}
                                    {testConfig.showGroupCountHint && (currentWord.groupMembers?.length ?? 0) > 0 && (
                                        <div className="text-gray-400 font-bold text-sm bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                                            {(() => {
                                                const members = currentWord.groupMembers || [];
                                                // Check for labels
                                                const hasLabels = members.some(m => m.customLabel);
                                                if (hasLabels) {
                                                    const counts: Record<string, number> = {};
                                                    members.forEach(m => {
                                                        const label = m.customLabel || 'その他';
                                                        counts[label] = (counts[label] || 0) + 1;
                                                    });
                                                    return `正解: ${Object.entries(counts).map(([lbl, num]) => `${lbl}${num}件`).join('・')}`;
                                                } else {
                                                    return `正解: ${members.length}件`;
                                                }
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}


                            {isFlipped && (
                                // --- Config Driven Answer View ---
                                <div className="flex-1 flex items-center justify-center p-8 bg-blue-100/40 border-t border-blue-100">
                                    <ConfiguredTestGroup groups={testConfig.answer} word={currentWord} />
                                </div>
                            )}

                            {/* Bottom Action Bar */}
                            <div className="p-6 border-t border-gray-100 bg-white">
                                {!isFlipped ? (
                                    <button
                                        onClick={() => setIsFlipped(true)}
                                        className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                                    >
                                        正解を表示
                                    </button>
                                ) : (
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleResult('retry')}
                                            className="flex-1 py-5 bg-white text-red-500 border-2 border-red-100 rounded-2xl font-bold text-xl hover:bg-red-50 hover:border-red-300 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                                        >
                                            <RotateCcw size={24} />
                                            やり直し
                                        </button>
                                        <button
                                            onClick={() => handleResult('correct')}
                                            className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                                        >
                                            <CheckIcon />
                                            覚えた！
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Check icon wrapper
const CheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
