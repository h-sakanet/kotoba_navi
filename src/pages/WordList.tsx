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

    const [words, setWords] = useState<Word[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ word: string; yomigana: string; meaning: string }>({ word: '', yomigana: '', meaning: '' });

    useEffect(() => {
        if (!scope) return;
        const fetchWords = async () => {
            const data = await db.words
                .where('page')
                .between(scope.startPage, scope.endPage, true, true)
                .sortBy('id'); // We really want to sort by page + number, but id is proxy for insertion order usually

            // Ideally sort by page, then number
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
        setEditForm({ word: word.rawWord, yomigana: word.yomigana || '', meaning: word.rawMeaning });
    };

    const handleSave = async (id: number) => {
        // Update DB
        // We need to update raw fields AND question/answer fields depending on category logic
        // For now we assume consistent mapping: rawWord -> answer/word, rawMeaning -> question/meaning
        // But wait, "question" and "answer" depends on test type.
        // In `csvImporter`, we did:
        // question: col3 (Meaning)
        // answer: col2 (Word)

        // We update all related fields.
        const updates = {
            rawWord: editForm.word,
            yomigana: editForm.yomigana, // Save yomigana
            rawMeaning: editForm.meaning,
            // Update derived fields (assuming standard logic)
            question: editForm.meaning,
            answer: editForm.word
        };

        await db.words.update(id, updates);

        // Update local state
        setWords(words.map(w => w.id === id ? { ...w, ...updates } : w));
        setEditingId(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="font-bold text-lg text-gray-900">{scope.category} リスト</h1>
                    <p className="text-xs text-gray-500">{scope.displayId || scope.id} (P.{scope.startPage}-{scope.endPage})</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-semibold tracking-wider">
                            <tr>
                                <th className="px-4 py-3 w-16 text-center">No.</th>
                                <th className="px-4 py-3 w-1/3">言葉</th>
                                <th className="px-4 py-3">意味</th>
                                <th className="px-4 py-3 w-16 text-center">習得</th>
                                <th className="px-4 py-3 w-16 text-center">編集</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {words.map(word => {
                                const isEditing = editingId === word.id;
                                return (
                                    <tr key={word.id} className={clsx("group transition-colors", isEditing ? "bg-blue-50" : "hover:bg-gray-50")}>
                                        <td className="px-4 py-3 text-center align-top text-gray-400 font-mono text-xs pt-4">
                                            {word.numberInPage}
                                        </td>

                                        <td className="px-4 py-3 align-top">
                                            {isEditing ? (
                                                <div className="flex flex-col gap-2">
                                                    <input
                                                        type="text"
                                                        value={editForm.yomigana}
                                                        onChange={e => setEditForm({ ...editForm, yomigana: e.target.value })}
                                                        placeholder="よみがな"
                                                        className="w-full p-1 border rounded text-xs text-gray-500 outline-none focus:border-blue-500"
                                                    />
                                                    <textarea
                                                        value={editForm.word}
                                                        onChange={e => setEditForm({ ...editForm, word: e.target.value })}
                                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                        rows={2}
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    {word.yomigana && (
                                                        <div className="text-xs text-gray-400 mb-0.5">{word.yomigana}</div>
                                                    )}
                                                    <div className="font-bold text-gray-800 text-lg leading-relaxed">{word.rawWord}</div>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 align-top">
                                            {isEditing ? (
                                                <textarea
                                                    value={editForm.meaning}
                                                    onChange={e => setEditForm({ ...editForm, meaning: e.target.value })}
                                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    rows={3}
                                                />
                                            ) : (
                                                <div className="text-gray-600 text-sm leading-relaxed">{word.rawMeaning}</div>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-center align-top pt-4">
                                            <div className="flex gap-1 justify-center">
                                                <div
                                                    className={clsx("w-3 h-3 rounded-full border border-indigo-200", word.isLearnedCategory ? "bg-indigo-500" : "bg-transparent")}
                                                    title="ことわざテスト習得"
                                                />
                                                <div
                                                    className={clsx("w-3 h-3 rounded-full border border-indigo-200", word.isLearnedMeaning ? "bg-indigo-500" : "bg-transparent")}
                                                    title="意味テスト習得"
                                                />
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
