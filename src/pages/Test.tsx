import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { X, ThumbsUp, RotateCcw, ChevronLeft } from 'lucide-react';
import { db } from '../db';
import { SCOPES } from '../data/scope';
import { type Word, type TestType } from '../types';
import clsx from 'clsx';
import { QuestionDisplay } from '../components/test/QuestionDisplay';
import { AnswerDisplay } from '../components/test/AnswerDisplay';

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const Test: React.FC = () => {
    const { scopeId } = useParams<{ scopeId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Parse params
    const type = (searchParams.get('type') as TestType) || 'category';
    const isFinalMode = searchParams.get('final') === 'true';

    const scope = SCOPES.find(s => s.id === scopeId);
    const isHomonym = scope ? (scope.category === '同音異義語' || scope.category === '同訓異字' || scope.category === '似た意味のことわざ' || scope.category === '対になることわざ') : false;
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

    const handleResult = async (result: 'correct' | 'retry') => {
        if (!currentWord.id) return;

        // Determine which flag to update based on test type
        // 'category' -> isLearnedCategory
        // 'meaning' -> isLearnedMeaning
        const updateTarget = type === 'meaning' ? 'isLearnedMeaning' : 'isLearnedCategory';

        // Cast to any to avoid Dexie type inference issues with dynamic keys and arrays
        const updates: any = { lastStudied: new Date() };

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
    let qText = currentWord.question;
    let aText = currentWord.answer;

    if (type === 'meaning') {
        qText = currentWord.answer; // Word
        aText = currentWord.question; // Meaning
    }

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



                <div className="flex items-end justify-center gap-3 w-full max-w-4xl relative">
                    {/* Back Button */}
                    <div className={clsx("mb-8 transition-opacity duration-300 flex-shrink-0", currentIndex > 0 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                        <button
                            onClick={handleBack}
                            className="p-3 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors shadow-sm"
                            aria-label="前の問題に戻る"
                        >
                            <ChevronLeft size={28} />
                        </button>
                    </div>

                    <div className="w-full max-w-2xl relative">
                        {/* Counter (Outside Card) */}
                        <div className="absolute -top-8 w-full text-center text-gray-500 font-bold pointer-events-none">
                            {currentIndex + 1} / {questions.length}
                        </div>

                        <div className="w-full bg-white rounded-3xl shadow-xl overflow-hidden min-h-[400px] flex flex-col relative transition-all duration-300">
                            {/* Question (Visible usually, hidden if Homonym + Flipped) */}
                            {!(isHomonym && isFlipped) && (
                                <div className={clsx("flex-1 flex items-center justify-center p-8 transition-all duration-300", isFlipped ? "opacity-40 scale-95 origin-top" : "opacity-100")}>
                                    <QuestionDisplay type={type} currentWord={currentWord} text={qText} />
                                </div>
                            )}

                            {/* Answer (Visible only when flipped) */}
                            {/* Answer (Visible only when flipped) */}
                            {isFlipped && (
                                <div className="flex-1 flex items-center justify-center p-8 bg-blue-50 border-t border-blue-100 animate-in slide-in-from-bottom-5 fade-in duration-300">
                                    <AnswerDisplay type={type} currentWord={currentWord} text={aText} />
                                </div>
                            )}

                            {/* Bottom Action Bar */}
                            <div className="p-6 border-t border-gray-100 bg-gray-50">
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
