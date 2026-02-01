import React from 'react';
import { type Word } from '../../types';

interface WordListItemProps {
    word: Word;
}

export const WordListItem: React.FC<WordListItemProps> = ({ word }) => {
    return (
        <div>
            {word.groupMembers ? (
                <div className="flex flex-col gap-3">
                    {word.groupMembers.map((member, idx) => (
                        <div key={idx} className="flex gap-1">
                            {member.customLabel && (
                                <span className="text-sm font-bold text-blue-600 mt-1 shrink-0">{member.customLabel}：</span>
                            )}
                            <div>
                                {member.yomigana && (
                                    <div className="text-xs text-gray-400 mb-0.5">{member.yomigana}</div>
                                )}
                                <div className="font-bold text-gray-800 text-lg leading-relaxed">{member.rawWord}</div>
                                {member.exampleSentence && (
                                    <div className="text-sm text-gray-500 mt-1">{member.exampleSentence}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div>
                    {word.yomigana && (
                        <div className="text-xs text-gray-400 mb-0.5">{word.yomigana}</div>
                    )}
                    <div className="font-bold text-gray-800 text-lg leading-relaxed">{word.rawWord}</div>
                    {word.exampleSentence && (
                        <div className="text-sm text-gray-500 mt-1">{word.exampleSentence}</div>
                    )}
                </div>
            )}
        </div>
    );
};
