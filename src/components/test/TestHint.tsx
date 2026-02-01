import React from 'react';
import { type Word, type TestType } from '../../types';

interface TestHintProps {
    type: TestType;
    currentWord: Word;
}

export const TestHint: React.FC<TestHintProps> = ({ type, currentWord }) => {
    if (type === 'meaning') return null;
    if (!currentWord.groupMembers) return null;

    return (
        <div className="mt-4 text-blue-500 font-bold bg-blue-50 px-4 py-2 rounded-full inline-block">
            {(() => {
                // Check if we have custom labels (e.g. Upper/Lower)
                const hasLabels = currentWord.groupMembers.some(m => m.customLabel);
                if (hasLabels) {
                    const upperCount = currentWord.groupMembers.filter(m => m.customLabel === '上').length;
                    const lowerCount = currentWord.groupMembers.filter(m => m.customLabel === '下').length;
                    return `上：${upperCount}個 / 下：${lowerCount}個`;
                }
                return `似た意味のことわざ：${currentWord.groupMembers.length}個`;
            })()}
        </div>
    );
};
