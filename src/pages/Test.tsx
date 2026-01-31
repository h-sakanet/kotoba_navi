import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { X, Eye, ThumbsUp, RotateCcw } from 'lucide-react';
import { db } from '../db';
import { SCOPES } from '../data/scope';
import { type Word, type TestType } from '../types';
import clsx from 'clsx';

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

        if (!isFinalMode) {
            if (result === 'correct') {
                await db.words.update(currentWord.id, { [updateTarget]: true, lastStudied: new Date() });
            } else if (result === 'retry') {
                await db.words.update(currentWord.id, { [updateTarget]: false, lastStudied: new Date() });
            }
        } else {
            // Final Mode: Special rule
            // "Retry" forces flag to OFF (unlearned).
            // Which flag? The one corresponding to the current test type.
            if (result === 'retry') {
                await db.words.update(currentWord.id, { [updateTarget]: false, lastStudied: new Date() });
            }
        }

        // Move to next
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        } else {
            setCompleted(true);
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
            <header className="px-6 py-4 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                <button
                    onClick={() => navigate(`/?modal=${scopeId}`)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold"
                >
                    <X size={24} />
                    <span>中断</span>
                </button>
                <div className="font-bold text-lg text-gray-700">
                    {title}
                </div>
                <div className="font-mono font-bold text-gray-500">
                    {currentIndex + 1} / {questions.length}
                </div>
            </header>

            {/* Main Card Area */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full">
                <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden min-h-[400px] flex flex-col relative transition-all duration-300">

                    {/* Question (Always visible) */}
                    <div className={clsx("flex-1 flex items-center justify-center p-8 transition-all duration-300", isFlipped ? "opacity-40 scale-95 origin-top" : "opacity-100")}>
                        <div className="text-center">
                            <h2 className={clsx("font-bold text-gray-800 leading-snug", qText.length > 20 ? "text-2xl" : "text-4xl")}>
                                {qText}
                            </h2>
                        </div>
                    </div>

                    {/* Answer (Visible only when flipped) */}
                    {isFlipped && (
                        <div className="flex-1 flex items-center justify-center p-8 bg-blue-50 border-t border-blue-100 animate-in slide-in-from-bottom-5 fade-in duration-300">
                            <div className="text-center">
                                <h2 className={clsx("font-bold text-blue-900 leading-snug", aText.length > 20 ? "text-2xl" : "text-4xl")}>
                                    {aText}
                                </h2>
                            </div>
                        </div>
                    )}

                    {/* Bottom Action Bar */}
                    <div className="p-6 border-t bg-gray-50">
                        {!isFlipped ? (
                            <button
                                onClick={() => setIsFlipped(true)}
                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                            >
                                <Eye size={28} />
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
