import React from 'react';
import { type Word, type TestType } from '../../types';
import clsx from 'clsx';

interface AnswerDisplayProps {
    type: TestType;
    currentWord: Word;
    text: string;
}

export const AnswerDisplay: React.FC<AnswerDisplayProps> = ({ type, currentWord, text }) => {
    return (
        <div className="text-center w-full">
            {(currentWord.category === '同音異義語' || currentWord.category === '同訓異字' || currentWord.category === '似た意味のことわざ' || currentWord.category === '対になることわざ') ? (
                // Homonym Answer: Yomi (Header) + List of Sentences with Filled Blanks
                <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
                    {/* Header: Yomi */}
                    {/* In Answer mode, we can show Header too if we want, or just the filled list. 
                        User: "Correct answer display... top blank replaced..."
                        User didn't explicitly remove header, but context implies showing the filled sentences IS the answer.
                        But keeping Yomi header is consistent.
                    */}
                    <h2 className="font-bold text-gray-800 text-4xl mb-8">{currentWord.yomigana}</h2>

                    {/* List of Sentences */}
                    <div className="w-full flex flex-col gap-6">
                        {(currentWord.groupMembers || [currentWord]).map((member, idx) => (
                            <div key={idx} className="flex flex-col items-start w-full border-b pb-4 last:border-0 last:pb-0 border-blue-100">
                                {(currentWord.category === '似た意味のことわざ' || currentWord.category === '対になることわざ') ? (
                                    // Proverb Answer: Proverb (Main) + Furigana (Sub)
                                    <>
                                        {/* Furigana (Above) */}
                                        {member.exampleSentence && (
                                            <div className="text-blue-400 text-sm font-bold pl-1 mb-0.5">
                                                {member.exampleSentence}
                                            </div>
                                        )}
                                        {/* Proverb (Main) */}
                                        <div className="font-bold text-blue-600 text-lg md:text-xl text-left pl-1 leading-relaxed w-full">
                                            {member.rawWord}
                                        </div>
                                    </>
                                ) : (
                                    // Homonym Answer: Sentence with filled blank
                                    <>
                                        {/* Sentence Yomigana */}
                                        {member.exampleSentenceYomigana && (
                                            <div className="text-blue-400 text-sm font-bold mb-1 pl-1">
                                                {member.exampleSentenceYomigana}
                                            </div>
                                        )}
                                        {/* Sentence with Answer Filled */}
                                        <div className="font-medium text-gray-800 text-lg md:text-xl text-left pl-1 leading-relaxed w-full">
                                            {member.exampleSentence ? (
                                                member.exampleSentence.split('＿＿').map((part, i, arr) => (
                                                    <React.Fragment key={i}>
                                                        {part}
                                                        {i < arr.length - 1 && (
                                                            <span className="text-blue-600 font-bold mx-1">
                                                                {member.rawWord}
                                                            </span>
                                                        )}
                                                    </React.Fragment>
                                                ))
                                            ) : (
                                                <span className="text-blue-600 font-bold">{member.rawWord}</span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : type !== 'meaning' && currentWord.groupMembers ? (
                // Synonym Test: Side-by-Side Answer (Word) Display
                <div className="flex w-full gap-4">
                    {currentWord.groupMembers.map((member, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-center border-r last:border-0 border-blue-200 px-2">
                            {member.yomigana && (
                                <div className="text-blue-400 text-base font-bold mb-1">{member.yomigana}</div>
                            )}
                            <h2 className="font-bold text-blue-600 leading-snug text-2xl md:text-3xl">
                                {member.rawWord}
                            </h2>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Meaning Test: Show only the Meaning (text). Word is already in Question. */}
                    {/* Fall through to standard display */}
                    <>
                        {/* If Answer is Word (Category Test), show Yomigana */}
                        {type !== 'meaning' && currentWord.yomigana && (
                            <div className="text-blue-400 text-lg font-bold mb-2">{currentWord.yomigana}</div>
                        )}
                        <h2 className={clsx("font-bold text-blue-600 leading-snug", text.length > 20 ? "text-2xl" : "text-4xl")}>
                            {text}
                        </h2>

                        {/* Category Test: Example Sentence is now in Question, so do not show here */}
                    </>

                </>
            )}
        </div>
    );
};
