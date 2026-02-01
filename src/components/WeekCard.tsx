import React, { useEffect, useState } from 'react';
import { type Scope } from '../types';
import { db } from '../db';
import clsx from 'clsx';
import { Star } from 'lucide-react';

interface WeekCardProps {
    scope: Scope;
    onClick: (scope: Scope) => void;
}

export const WeekCard: React.FC<WeekCardProps> = ({ scope, onClick }) => {

    const [progress, setProgress] = useState(0);
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            // Create a range query: page >= startPage && page <= endPage
            const words = await db.words
                .where('page')
                .between(scope.startPage, scope.endPage, true, true)
                .toArray();

            if (words.length > 0) {
                setHasData(true);


                const learnedCategory = words.filter(w => w.isLearnedCategory).length;
                const learnedMeaning = words.filter(w => w.isLearnedMeaning).length;
                const isSingleTestCategory = scope.category === '類義語' || scope.category === '対義語' || scope.category === '上下で対となる熟語' || scope.category === '同音異義語' || scope.category === '同訓異字' || scope.category === '似た意味のことわざ' || scope.category === '対になることわざ';
                const totalPossible = words.length * (isSingleTestCategory ? 1 : 2);

                const calculatedProgress = totalPossible > 0
                    ? Math.round(((learnedCategory + (isSingleTestCategory ? 0 : learnedMeaning)) / totalPossible) * 100)
                    : 0;

                setProgress(calculatedProgress);
            } else {
                setHasData(false);

                setProgress(0);
            }
        };
        fetchData();
    }, [scope]);

    return (
        <button
            onClick={() => hasData && onClick(scope)}
            disabled={!hasData}
            className={clsx(
                "flex flex-col items-start p-4 rounded-2xl shadow-sm text-left transition-all border min-h-[140px]",
                hasData
                    ? "bg-white border-gray-100 hover:shadow-md hover:border-blue-200 active:scale-95 cursor-pointer"
                    : "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
            )}
        >
            <div className="flex justify-between w-full mb-1">
                <span className="text-xs font-semibold text-gray-400 font-mono tracking-wider">
                    {scope.displayId || scope.id}
                </span>
                {!hasData && (
                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                        未登録
                    </span>
                )}
            </div>

            <h3 className={clsx("text-xl font-bold mb-1", hasData ? "text-gray-800" : "text-gray-400")}>
                {scope.category}
            </h3>

            <div className="text-xs text-gray-500 mb-2">
                P.{scope.startPage} - {scope.endPage}
            </div>

            <div className="mt-auto w-full flex items-center gap-2">
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={clsx(
                            "h-full rounded-full transition-all duration-500",
                            progress === 100 ? "bg-yellow-400" : "bg-blue-500"
                        )}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex items-center gap-1 min-w-[3rem] justify-end">
                    {progress === 100 && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                    <span className="text-sm font-bold text-gray-600">{progress}%</span>
                </div>
            </div>
        </button>
    );
};
