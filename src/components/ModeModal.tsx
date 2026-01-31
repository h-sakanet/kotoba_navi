import React, { useEffect, useState } from 'react';
import { type Scope } from '../types';
import { db } from '../db';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

interface ModeModalProps {
    scope: Scope;
    onClose: () => void;
}

export const ModeModal: React.FC<ModeModalProps> = ({ scope, onClose }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total: 0,
        learnedCategory: 0,
        learnedMeaning: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const words = await db.words
                .where('page')
                .between(scope.startPage, scope.endPage, true, true)
                .toArray();

            setStats({
                total: words.length,
                learnedCategory: words.filter(w => w.isLearnedCategory).length,
                learnedMeaning: words.filter(w => w.isLearnedMeaning).length
            });
        };
        fetchStats();
    }, [scope]);

    const isCategoryCompleted = stats.total > 0 && stats.learnedCategory === stats.total;
    const isMeaningCompleted = stats.total > 0 && stats.learnedMeaning === stats.total;

    const categoryPercent = stats.total > 0 ? Math.round((stats.learnedCategory / stats.total) * 100) : 0;
    const meaningPercent = stats.total > 0 ? Math.round((stats.learnedMeaning / stats.total) * 100) : 0;

    // Overall completion (logic: is both complete?)
    // Or maybe simple sum?
    // Let's use simple avg for overall? 
    // Actually we don't display Overall Progress distinctively except maybe the top banner.
    // The previous top banner aggregated everything.
    // Let's make "習得状況" reflect the average of both?


    // Test card logic
    // Kotowaza Test button navigates to: /test/:id?type=category
    // Meaning Test button navigates to: /test/:id?type=meaning
    // Final Test (Category) button navigates to: /test/:id?type=category&mode=final (Need to update Test.tsx to handle mode=final with type)
    // Actually user said: "ことわざテストのカードの中の最終テストはことわざテスト、意味テストの中の最終テストは意味テストのみ出題"
    // So we need distinct final test params. 
    // Let's use `final=true` param instead of just `type=final`.

    const handleNavigation = (type: 'category' | 'meaning', isFinal: boolean = false) => {
        // We will change the URL structure slightly or just use query params
        // Old: type=final (mixed?) -> New: type=category|meaning AND final=true
        // But previously 'final' was a type. 
        // Let's keep `type` as 'category' | 'meaning'. 
        // Add `final=true` to query string.
        let url = `/test/${scope.id}?type=${type}`;
        if (isFinal) {
            url += '&final=true';
        }
        navigate(url);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <div>
                        <div className="text-xs font-mono text-gray-400 font-bold">{scope.displayId || scope.id}</div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {scope.category} <span className="text-base font-normal text-gray-500 ml-2">P.{scope.startPage}-{scope.endPage}</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">



                    {/* View List Button */}
                    <button
                        onClick={() => navigate(`/view/${scope.id}`)}
                        className="w-full text-center p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all text-lg font-bold text-gray-700"
                    >
                        見て覚える
                    </button>

                    <div className="space-y-4">
                        {/* Category Test Card */}
                        <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-800">{scope.category}テスト</span>
                                <span className="text-sm font-bold text-gray-500">
                                    {isCategoryCompleted ? '完了' : `${stats.learnedCategory}/${stats.total} (${categoryPercent}%)`}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleNavigation('category')}
                                    className="flex-1 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isCategoryCompleted}
                                >
                                    テスト
                                </button>
                                <button
                                    onClick={() => handleNavigation('category', true)}
                                    disabled={!isCategoryCompleted}
                                    className={clsx(
                                        "flex-1 py-3 font-bold rounded-xl transition-colors border-2",
                                        isCategoryCompleted
                                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                            : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                    )}
                                >
                                    最終テスト
                                </button>
                            </div>
                        </div>

                        {/* Meaning Test Card */}
                        <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-800">意味テスト</span>
                                <span className="text-sm font-bold text-gray-500">
                                    {isMeaningCompleted ? '完了' : `${stats.learnedMeaning}/${stats.total} (${meaningPercent}%)`}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleNavigation('meaning')}
                                    className="flex-1 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isMeaningCompleted}
                                >
                                    テスト
                                </button>
                                <button
                                    onClick={() => handleNavigation('meaning', true)}
                                    disabled={!isMeaningCompleted}
                                    className={clsx(
                                        "flex-1 py-3 font-bold rounded-xl transition-colors border-2",
                                        isMeaningCompleted
                                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                            : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                    )}
                                >
                                    最終テスト
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
