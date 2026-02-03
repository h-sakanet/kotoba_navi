import React, { useEffect, useState } from 'react';
import { type Scope } from '../types';
import { db } from '../db';
import clsx from 'clsx';
import { Star } from 'lucide-react';
import { isSingleTestCategory } from '../utils/categoryMeta';
import { formatDate } from '../utils/dateUtils';

interface WeekCardProps {
    scope: Scope;
    onClick: (scope: Scope) => void;
    testDate?: string;
    isNextTest?: boolean;
}

export const WeekCard: React.FC<WeekCardProps> = ({ scope, onClick, testDate, isNextTest }) => {

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
                const singleTest = isSingleTestCategory(scope.category);
                const totalPossible = words.length * (singleTest ? 1 : 2);

                const calculatedProgress = totalPossible > 0
                    ? Math.round(((learnedCategory + (singleTest ? 0 : learnedMeaning)) / totalPossible) * 100)
                    : 0;

                setProgress(calculatedProgress);
            } else {
                setHasData(false);

                setProgress(0);
            }
        };
        fetchData();
    }, [scope]);

    const formattedDate = formatDate(testDate);

    return (
        <button
            onClick={() => hasData && onClick(scope)}
            disabled={!hasData}
            className={clsx(
                "relative flex flex-col items-start p-4 rounded-2xl shadow-sm text-left transition-all border min-h-[140px]",
                hasData
                    ? "bg-white border-gray-100 hover:shadow-md hover:border-blue-200 active:scale-95 cursor-pointer"
                    : "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed",
                isNextTest && "ring-2 ring-blue-500 border-blue-500 bg-blue-50/20"
            )}
        >
            <div className="flex justify-between w-full mb-1 items-start">
                <span className="text-xs font-semibold text-gray-400 font-mono tracking-wider">
                    {scope.displayId || scope.id}
                </span>
                {formattedDate && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                        {formattedDate}
                    </span>
                )}
            </div>

            <h3 className={clsx("text-xl font-bold mb-1", hasData ? "text-gray-800" : "text-gray-400")}>
                {scope.category}
            </h3>

            <div className="text-xs text-gray-500 mb-2">
                P.{scope.startPage}-{scope.endPage}
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
