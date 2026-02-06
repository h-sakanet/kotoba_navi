import React from 'react';
import { HideToggle } from './HideToggle';
import type { CategorySettings } from '../../utils/categoryConfig';

interface WordListTableHeaderProps {
    categoryConfig?: CategorySettings;
    hasLeftMask: boolean;
    hasRightMask: boolean;
    hideLeft: boolean;
    hideRight: boolean;
    onToggleLeft: () => void;
    onToggleRight: () => void;
}

export const WordListTableHeader: React.FC<WordListTableHeaderProps> = ({
    categoryConfig,
    hasLeftMask,
    hasRightMask,
    hideLeft,
    hideRight,
    onToggleLeft,
    onToggleRight
}) => (
    <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider sticky top-0 z-40 shadow-sm">
        <tr>
            <th className="px-4 py-3 w-16 text-center">No.</th>
            {categoryConfig ? (
                <>
                    <th className="px-4 py-3 w-1/3">
                        <div className="flex items-center justify-between gap-2">
                            <span>{categoryConfig.wordList.headerLabels.left}</span>
                            {hasLeftMask && (
                                <HideToggle checked={hideLeft} onChange={onToggleLeft} />
                            )}
                        </div>
                    </th>
                    <th className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                            <span>{categoryConfig.wordList.headerLabels.right}</span>
                            {hasRightMask && (
                                <HideToggle checked={hideRight} onChange={onToggleRight} />
                            )}
                        </div>
                    </th>
                </>
            ) : (
                <>
                    <th className="px-4 py-3 w-1/3">左カラム</th>
                    <th className="px-4 py-3">右カラム</th>
                </>
            )}
            <th className="px-4 py-3 w-16 text-center">習得</th>
            <th className="px-4 py-3 w-16 text-center">編集</th>
        </tr>
    </thead>
);
