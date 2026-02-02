import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Edit2 } from 'lucide-react';
import { db } from '../db';
import { SCOPES } from '../data/scope';
import { type Word } from '../types';
import clsx from 'clsx';


export const WordList: React.FC = () => {
    const { scopeId } = useParams<{ scopeId: string }>();
    const navigate = useNavigate();
    const scope = SCOPES.find(s => s.id === scopeId);

    const isHomonym = scope ? (scope.category === '同音異義語' || scope.category === '同訓異字' || scope.category === '似た意味のことわざ' || scope.category === '対になることわざ') : false;

    const [words, setWords] = useState<Word[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{
        word: string;
        yomigana: string;
        meaning: string;
        exampleSentence: string;
        exampleSentenceYomigana: string;
        groupMembers?: { rawWord: string; yomigana: string; exampleSentence?: string; exampleSentenceYomigana?: string }[];
    }>({ word: '', yomigana: '', meaning: '', exampleSentence: '', exampleSentenceYomigana: '' });

    useEffect(() => {
        if (!scope) return;
        const fetchWords = async () => {
            const data = await db.words
                .where('page')
                .between(scope.startPage, scope.endPage, true, true)
                .sortBy('id');

            data.sort((a, b) => {
                if (a.page !== b.page) return a.page - b.page;
                return a.numberInPage - b.numberInPage;
            });

            setWords(data);
        };
        fetchWords();
    }, [scope]);

    if (!scope) return <div>Scope not found</div>;

    const handleEdit = (word: Word) => {
        setEditingId(word.id!);
        setEditForm({
            word: word.rawWord,
            yomigana: word.yomigana || '',
            meaning: word.rawMeaning,
            exampleSentence: word.exampleSentence || '',
            exampleSentenceYomigana: word.exampleSentenceYomigana || '',
            groupMembers: word.groupMembers ? JSON.parse(JSON.stringify(word.groupMembers)) : undefined
        });
    };

    const handleSave = async (id: number) => {
        const updates: any = {
            rawWord: editForm.word,
            yomigana: editForm.yomigana,
            rawMeaning: editForm.meaning,
            exampleSentence: editForm.exampleSentence,
            exampleSentenceYomigana: editForm.exampleSentenceYomigana,
            question: editForm.meaning,
            answer: editForm.word
        };

        if (editForm.groupMembers) {
            updates.groupMembers = editForm.groupMembers;
            if (editForm.groupMembers.length > 0) {
                updates.rawWord = editForm.groupMembers[0].rawWord;
                // updates.yomigana = editForm.groupMembers[0].yomigana; // This was overwriting the edited yomigana with stale member data
                updates.yomigana = editForm.yomigana; // Explicitly use the form yomigana

                // Sync the yomigana to all group members if it's a grouped category (Homonym/Proverb)
                // This ensures consistency if members are accessed individually later
                updates.groupMembers = editForm.groupMembers.map((m: any) => ({
                    ...m,
                    yomigana: editForm.yomigana
                }));

                updates.answer = editForm.groupMembers[0].rawWord;
            }
        }

        await db.words.update(id, updates);

        // Update local state
        setWords(words.map(w => w.id === id ? { ...w, ...updates } : w));
        setEditingId(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-300 px-4 py-3 flex items-center justify-center relative min-h-[60px]">
                <button
                    onClick={() => navigate(`/?modal=${scope.id}`)}
                    className="absolute left-4 p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="text-center">
                    <h1 className="font-bold text-lg text-gray-900">{scope.category} リスト</h1>
                    <p className="text-xs text-gray-500">{scope.displayId || scope.id} (P.{scope.startPage}-{scope.endPage})</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                            <tr>
                                <th className="px-4 py-3 w-16 text-center">No.</th>
                                {scope.category === '類義語' || scope.category === '対義語' ? (
                                    <>
                                        <th className="px-4 py-3 w-1/3">{scope.category === '類義語' ? '類義語左' : '対義語左'}</th>
                                        <th className="px-4 py-3">{scope.category === '類義語' ? '類義語右' : '対義語右'}</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-4 py-3 w-1/3">
                                            {(scope.category === '似た意味のことわざ' || scope.category === '対になることわざ') ? '意味' : (isHomonym ? 'よみがな' : (scope.category === '上下で対となる熟語' ? '熟語' : '言葉'))}
                                        </th>
                                        <th className="px-4 py-3">
                                            {(scope.category === '似た意味のことわざ' || scope.category === '対になることわざ') ? 'ことわざ' : (isHomonym ? scope.category : (scope.category === '上下で対となる熟語' ? '例文' : '意味'))}
                                        </th>
                                    </>
                                )}
                                <th className="px-4 py-3 w-16 text-center">習得</th>
                                <th className="px-4 py-3 w-16 text-center">編集</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {words.map(word => {
                                const isEditing = editingId === word.id;
                                const isSynonym = (scope.category === '類義語' || scope.category === '対義語') && word.groupMembers && word.groupMembers.length >= 2;
                                const synonymTop = isSynonym ? word.groupMembers!.find(m => m.customLabel === '上') || word.groupMembers![0] : undefined;
                                const synonymBottom = isSynonym ? word.groupMembers!.find(m => m.customLabel === '下') || word.groupMembers![1] : undefined;

                                const renderCell = (
                                    data: { rawWord: string; yomigana?: string; exampleSentence?: string; exampleSentenceYomigana?: string },
                                    onUpdate?: (field: string, val: string) => void
                                ) => {
                                    // Standard Order: Sub (Small) -> Main (Large)
                                    // - Sub = yomigana
                                    // - Main = rawWord
                                    const mainText = data.rawWord;
                                    const subText = data.yomigana || '';
                                    const mainKey = 'rawWord';
                                    const subKey = 'yomigana';

                                    return (
                                        <div className="flex flex-col gap-1">
                                            {isEditing && onUpdate ? (
                                                <input
                                                    type="text"
                                                    value={subText}
                                                    onChange={e => onUpdate(subKey, e.target.value)}
                                                    placeholder="よみがな"
                                                    className="w-full p-2 border rounded text-xs text-gray-500 outline-none focus:border-blue-500"
                                                />
                                            ) : (
                                                subText && <div className="text-xs text-gray-400 mb-0.5">{subText}</div>
                                            )}

                                            {/* MAIN (Word) - Large */}
                                            {isEditing && onUpdate ? (
                                                <textarea
                                                    value={mainText}
                                                    onChange={e => onUpdate(mainKey, e.target.value)}
                                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                                                    rows={1}
                                                />
                                            ) : (
                                                <div className="font-bold text-gray-800 text-lg leading-relaxed mb-2">{mainText}</div>
                                            )}

                                            {/* SENTENCE - Only for Synonyms and Idioms */}
                                            {/* Logic: 
                                                - If Synonyms: Always show (user wants it)
                                                - If Idioms (慣用句): Always show (user wants it)
                                                - Other (Proverbs/Four-char): Only show if data exists (Display) or NOT in Edit mode (to hide empty inputs)
                                                Actually simpler: Only show inputs if category allows it.
                                            */}
                                            {/* FIX: Hide Meaning (ExampleSentence) for Proverbs Left Column entirely, as per user request */}
                                            {scope.category !== '上下で対となる熟語' && scope.category !== 'ことわざ' && (
                                                // 1. If we have data, we usually want to show it (Display Mode)
                                                (!isEditing && (data.exampleSentence || data.exampleSentenceYomigana)) ||
                                                // 2. If Editing, only show for categories that "support" sentences
                                                (isEditing && onUpdate && (scope.category === '類義語' || scope.category === '対義語' || scope.category === '慣用句' || scope.category === '四字熟語' || scope.category === '三字熟語'))
                                            ) && (
                                                    <div className={clsx("mt-2 pt-2", !isEditing && "border-t border-gray-100")}>
                                                        {/* Sentence Yomigana: Display if exists, but only Edit if Synonym (Idioms don't need it) */}
                                                        {isEditing && onUpdate ? (
                                                            (scope.category === '類義語' || scope.category === '対義語') && (
                                                                <input
                                                                    type="text"
                                                                    value={data.exampleSentenceYomigana || ''}
                                                                    onChange={e => onUpdate('exampleSentenceYomigana', e.target.value)}
                                                                    placeholder="出題文よみがな"
                                                                    className="w-full p-2 border rounded text-xs text-gray-500 outline-none focus:border-blue-500 mb-1"
                                                                />
                                                            )
                                                        ) : (
                                                            data.exampleSentenceYomigana && <div className="text-xs text-gray-400 mb-0.5">{data.exampleSentenceYomigana}</div>
                                                        )}

                                                        {/* Sentence Body */}
                                                        {isEditing && onUpdate ? (
                                                            <textarea
                                                                value={data.exampleSentence || ''}
                                                                onChange={e => onUpdate('exampleSentence', e.target.value)}
                                                                placeholder="出題文"
                                                                className="w-full p-2 border rounded text-sm text-gray-700 outline-none focus:border-blue-500"
                                                                rows={2}
                                                            />
                                                        ) : (
                                                            data.exampleSentence && <div className="text-sm text-gray-500">{data.exampleSentence}</div>
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    );
                                };

                                return (
                                    <tr key={word.id} className={clsx("group transition-colors", isEditing ? "bg-blue-50" : "hover:bg-gray-50")}>
                                        <td className="px-4 py-3 text-center align-top text-gray-400 font-mono text-xs pt-4">
                                            {word.numberInPage}
                                        </td>



                                        {/* LEFT COLUMN: Synonym Top OR Standard Word OR Homonym Yomi */}
                                        <td className="px-4 py-3 align-top">
                                            {isHomonym ? (
                                                // Homonym Left: Show Yomigana (Main)
                                                // No sentence here.
                                                isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.yomigana}
                                                        onChange={e => {
                                                            setEditForm({ ...editForm, yomigana: e.target.value });
                                                        }}
                                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                                                    />
                                                ) : (
                                                    <div className="font-bold text-gray-800 text-lg leading-relaxed mb-2">{word.yomigana}</div>
                                                )
                                            ) : isSynonym ? (
                                                renderCell(
                                                    isEditing ? editForm.groupMembers![0] : synonymTop!,
                                                    isEditing ? (field, val) => {
                                                        const newMembers = [...editForm.groupMembers!];
                                                        (newMembers[0] as any)[field] = val;
                                                        setEditForm({ ...editForm, groupMembers: newMembers });
                                                    } : undefined
                                                )
                                            ) : (
                                                renderCell(
                                                    isEditing ? {
                                                        rawWord: editForm.word,
                                                        yomigana: editForm.yomigana,
                                                        exampleSentence: editForm.exampleSentence,
                                                        exampleSentenceYomigana: editForm.exampleSentenceYomigana
                                                    } : word,
                                                    isEditing ? (field, val) => {
                                                        const updates: any = {};
                                                        if (field === 'rawWord') updates.word = val;
                                                        else updates[field] = val;
                                                        setEditForm({ ...editForm, ...updates });
                                                    } : undefined
                                                )
                                            )}
                                        </td>

                                        {/* RIGHT COLUMN: Synonym Bottom OR Standard Meaning OR Homonym List */}
                                        <td className="px-4 py-3 align-top">
                                            {isHomonym ? (
                                                // Homonym Right: List of Kanji + Sentence
                                                <div className="flex flex-col gap-4">
                                                    {(isEditing ? (editForm.groupMembers || [{
                                                        rawWord: editForm.word,
                                                        yomigana: editForm.yomigana,
                                                        exampleSentence: editForm.exampleSentence,
                                                        exampleSentenceYomigana: editForm.exampleSentenceYomigana
                                                    }]) : (word.groupMembers || [word])).map((member: any, idx: number) => (
                                                        <div key={idx} className="border-b last:border-0 border-gray-100 pb-3 last:pb-0">
                                                            {/* Kanji */}
                                                            {isEditing ? (
                                                                <input
                                                                    value={member.rawWord}
                                                                    onChange={e => {
                                                                        const currentMembers = editForm.groupMembers || [{
                                                                            rawWord: editForm.word,
                                                                            yomigana: editForm.yomigana,
                                                                            exampleSentence: editForm.exampleSentence,
                                                                            exampleSentenceYomigana: editForm.exampleSentenceYomigana
                                                                        }];
                                                                        const newMembers = [...currentMembers];
                                                                        newMembers[idx] = { ...newMembers[idx], rawWord: e.target.value };
                                                                        setEditForm({ ...editForm, groupMembers: newMembers });
                                                                    }}
                                                                    className="w-full p-1 border rounded font-bold text-gray-800 mb-1"
                                                                    placeholder={(scope.category === '似た意味のことわざ' || scope.category === '対になることわざ') ? 'ことわざ' : '漢字'}
                                                                />
                                                            ) : (
                                                                <div className="font-bold text-gray-800 text-lg mb-1">{member.rawWord}</div>
                                                            )}

                                                            {/* Sentence Yomi */}
                                                            {/* Sentence Yomi - Hide for Proverbs */}
                                                            {isEditing && scope.category !== '似た意味のことわざ' && scope.category !== '対になることわざ' ? (
                                                                <input
                                                                    value={member.exampleSentenceYomigana || ''}
                                                                    onChange={e => {
                                                                        const currentMembers = editForm.groupMembers || [{
                                                                            rawWord: editForm.word,
                                                                            yomigana: editForm.yomigana,
                                                                            exampleSentence: editForm.exampleSentence,
                                                                            exampleSentenceYomigana: editForm.exampleSentenceYomigana
                                                                        }];
                                                                        const newMembers = [...currentMembers];
                                                                        newMembers[idx] = { ...newMembers[idx], exampleSentenceYomigana: e.target.value };
                                                                        setEditForm({ ...editForm, groupMembers: newMembers });
                                                                    }}
                                                                    className="w-full p-1 border rounded text-xs text-gray-500 mb-1"
                                                                    placeholder="出題文よみがな"
                                                                />
                                                            ) : (
                                                                !isEditing && member.exampleSentenceYomigana && <div className="text-xs text-gray-400 mb-0.5">{member.exampleSentenceYomigana}</div>
                                                            )}

                                                            {/* Sentence */}
                                                            {isEditing ? (
                                                                <textarea
                                                                    value={member.exampleSentence || ''}
                                                                    onChange={e => {
                                                                        const currentMembers = editForm.groupMembers || [{
                                                                            rawWord: editForm.word,
                                                                            yomigana: editForm.yomigana,
                                                                            exampleSentence: editForm.exampleSentence,
                                                                            exampleSentenceYomigana: editForm.exampleSentenceYomigana
                                                                        }];
                                                                        const newMembers = [...currentMembers];
                                                                        newMembers[idx] = { ...newMembers[idx], exampleSentence: e.target.value };
                                                                        setEditForm({ ...editForm, groupMembers: newMembers });
                                                                    }}
                                                                    className="w-full p-1 border rounded text-sm text-gray-700"
                                                                    placeholder={(scope.category === '似た意味のことわざ' || scope.category === '対になることわざ') ? 'ふりがな' : '出題文'}
                                                                    rows={2}
                                                                />
                                                            ) : (
                                                                member.exampleSentence && <div className="text-sm text-gray-600">{member.exampleSentence}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : isSynonym ? (
                                                renderCell(
                                                    isEditing ? editForm.groupMembers![1] : synonymBottom!,
                                                    isEditing ? (field, val) => {
                                                        const newMembers = [...editForm.groupMembers!];
                                                        (newMembers[1] as any)[field] = val;
                                                        setEditForm({ ...editForm, groupMembers: newMembers });
                                                    } : undefined
                                                )
                                            ) : (
                                                // Standard Meaning Column OR Paired Idiom Sentence Column
                                                scope.category === '上下で対となる熟語' ? (
                                                    <div className="flex flex-col gap-1">
                                                        {isEditing ? (
                                                            <>
                                                                <input
                                                                    type="text"
                                                                    value={editForm.exampleSentenceYomigana || ''}
                                                                    onChange={e => setEditForm({ ...editForm, exampleSentenceYomigana: e.target.value })}
                                                                    placeholder="出題文よみがな"
                                                                    className="w-full p-2 border rounded text-xs text-gray-500 outline-none focus:border-blue-500 mb-1"
                                                                />
                                                                <textarea
                                                                    value={editForm.exampleSentence || ''}
                                                                    onChange={e => setEditForm({ ...editForm, exampleSentence: e.target.value, meaning: e.target.value })}
                                                                    placeholder="出題文"
                                                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                                    rows={3}
                                                                />
                                                            </>
                                                        ) : (
                                                            <>
                                                                {word.exampleSentenceYomigana && (
                                                                    <div className="text-xs text-gray-400 mb-0.5">{word.exampleSentenceYomigana}</div>
                                                                )}
                                                                <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                                                    {word.exampleSentence}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // Standard Meaning
                                                    isEditing ? (
                                                        <textarea
                                                            value={editForm.meaning}
                                                            onChange={e => setEditForm({ ...editForm, meaning: e.target.value })}
                                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                            rows={3}
                                                        />
                                                    ) : (
                                                        <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{word.rawMeaning}</div>
                                                    )
                                                )
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-center align-top pt-4">
                                            <div className="flex gap-1 justify-center">
                                                <div
                                                    className={clsx("w-3 h-3 rounded-full border border-indigo-200", word.isLearnedCategory ? "bg-indigo-500" : "bg-transparent")}
                                                    title={(scope.category === '類義語' || scope.category === '対義語') ? "習得済み" : "ことわざテスト習得"}
                                                />
                                                {scope.category !== '類義語' && scope.category !== '対義語' && scope.category !== '上下で対となる熟語' && scope.category !== '同音異義語' && scope.category !== '同訓異字' && scope.category !== '似た意味のことわざ' && scope.category !== '対になることわざ' && (
                                                    <div
                                                        className={clsx("w-3 h-3 rounded-full border border-indigo-200", word.isLearnedMeaning ? "bg-indigo-500" : "bg-transparent")}
                                                        title="意味テスト習得"
                                                    />
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-center align-top pt-3">
                                            {isEditing ? (
                                                <button
                                                    onClick={() => handleSave(word.id!)}
                                                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-shadow shadow-sm"
                                                >
                                                    <Save size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleEdit(word)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {words.length === 0 && (
                        <div className="p-10 text-center text-gray-400">
                            データがありません
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
