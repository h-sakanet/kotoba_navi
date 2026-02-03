import React from 'react';
import { type Word, type TestType } from '../../types';
import clsx from 'clsx';
import { TestHint } from './TestHint';
import { isHomonymCategory, isIdiomCategory, isProverbGroupCategory } from '../../utils/categoryMeta';

interface QuestionDisplayProps {
    type: TestType;
    currentWord: Word;
    text: string;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ type, currentWord, text }) => {
    return (
        <div className="text-center w-full">
            {isHomonymCategory(currentWord.category) ? (
                // Homonym Question: Yomi (Header) + List of Sentences (Vertical)
                <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
                    {/* Header: Yomi */}
                    <h2 className="font-bold text-gray-800 text-2xl md:text-3xl mb-6">{currentWord.yomigana}</h2>

                    {/* Count Hint for Proverbs */}
                    {isProverbGroupCategory(currentWord.category) && (
                        <div className="mb-6 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm md:text-base">
                            答えは {(currentWord.groupMembers?.length || 1)} つあります
                        </div>
                    )}

                    {/* List of Sentences (For Homonyms ONLY - Hidden for Proverbs) */}
                    {!isProverbGroupCategory(currentWord.category) && (
                        <div className="w-full flex flex-col gap-6">
                            {(currentWord.groupMembers || [currentWord]).map((member, idx) => (
                                <div key={idx} className="flex flex-col items-start w-full border-b pb-4 last:border-0 last:pb-0 border-gray-100">
                                    {/* Sentence Yomigana */}
                                    {member.exampleSentenceYomigana && (
                                        <div className="text-gray-400 text-sm font-bold mb-1 pl-1">
                                            {member.exampleSentenceYomigana}
                                        </div>
                                    )}
                                    {/* Sentence */}
                                    <div className="font-medium text-gray-800 text-lg md:text-xl text-left pl-1 leading-relaxed w-full">
                                        {member.exampleSentence || '（出題文なし）'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : type !== 'meaning' && currentWord.groupMembers ? (
                // Synonym Test: Side-by-Side Question (Sentence) Display
                <div className="flex w-full gap-4">
                    {currentWord.groupMembers.map((member, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-center border-r last:border-0 border-gray-200 px-2">

                            {/* Sentence Display for Question */}
                            <div className="text-center w-full">
                                {member.exampleSentenceYomigana && (
                                    <div className="text-gray-400 text-sm font-bold mb-1">
                                        {member.exampleSentenceYomigana}
                                    </div>
                                )}
                                {member.exampleSentence ? (
                                    <h3 className="font-bold text-gray-800 leading-snug text-lg md:text-xl whitespace-pre-wrap">
                                        {member.exampleSentence}
                                    </h3>
                                ) : (
                                    // Fallback if no sentence (shouldn't happen for valid Synonyms)
                                    <div className="text-gray-300 text-sm">（出題文なし）</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <>
                        {/* If Question is Word (Meaning Test -- single), show Yomigana */}
                        {/* Special case for Idioms/Synonyms: Show Example/Meaning Sentence instead of Word if available */}
                        {/* BUT for Idioms (慣用句), we want specific layout: Word (Main) + Sentence (Sub). So exclude here. */}
                        {type === 'meaning' && currentWord.exampleSentence && !isIdiomCategory(currentWord.category) ? (
                            <h2
                                className={clsx(
                                    "font-bold text-gray-800 leading-snug",
                                    currentWord.exampleSentence.length > 20 ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"
                                )}
                            >
                                {currentWord.exampleSentence}
                            </h2>
                        ) : (
                            <>
                                {type === 'meaning' && currentWord.yomigana && (
                                    <div className="text-gray-400 text-sm font-bold mb-1">{currentWord.yomigana}</div>
                                )}

                                {type !== 'meaning' && currentWord.exampleSentenceYomigana && (
                                    <div className="text-gray-400 text-sm font-bold mb-1">{currentWord.exampleSentenceYomigana}</div>
                                )}
                                <h2
                                    className={clsx(
                                        "font-bold text-gray-800 leading-snug",
                                        text.length > 20 ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"
                                    )}
                                >
                                    {text}
                                </h2>

                                {/* Idioms: Show Example Sentence below question matches ONLY in Category Test (Meaning Question) */}
                                {/* User requested to REMOVE it from Meaning Test (Word Question) */}
                                {isIdiomCategory(currentWord.category) && currentWord.exampleSentence && type !== 'meaning' && (
                                    <div className="mt-4 text-base text-gray-500 font-normal leading-relaxed text-center w-full">
                                        {currentWord.exampleSentence}
                                    </div>
                                )}

                                {/* Category Test Special Case for Idioms: Show Example Sentence below Meaning ?? */}
                                {/* Actually for Synonyms, "text" is the Question Word (Word A). No extra sentence needed for question. */}
                                {/* Re-using Idiom logic: if type!=meaning (Category Test) and exampleSentence exists, show it? */}
                                {/* For Synonyms, we DON'T want to show example sentence in Category Test Question (Word A -> Word B). */}
                                {/* We only want to show it for Idioms which use 'Meaning' as Question. */}
                                {/* Condition: if category is '慣用句' (Idiom). But component doesn't know category directly. */}
                                {/* However, Synonyms use 'Word' as question, Idioms use 'Meaning' as question. */}
                                {/* Current logic: text = currentWord.question. */}
                                {/* For Idioms, question = meaning field. For Synonyms, question = meaning field (sentence) ?? */}
                                {/* Wait. In SynonymImporter, I set question = meaning (sentenceA). */}
                                {/* BUT for Category Test (Synonym), user wants Word A -> Word B. */}
                                {/* My SynonymImporter set: question: parsed.meaning (sentence). This might be WRONG for Synonym Test. */}
                                {/* Let's fix SynonymImporter to set question = Word A for Category Test. */}
                            </>
                        )}

                        <TestHint type={type} currentWord={currentWord} />
                    </>

                    <TestHint type={type} currentWord={currentWord} />
                </>
            )}
        </div>
    );
};
