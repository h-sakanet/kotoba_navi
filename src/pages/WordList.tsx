import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Edit2, PenOff } from 'lucide-react';
import { db } from '../db';
import { SCOPES } from '../data/scope';
import { type Word, type GroupMember } from '../types';
import clsx from 'clsx';

import { CATEGORY_SETTINGS, type FieldGroup, type FieldSpec } from '../utils/categoryConfig';


export const WordList: React.FC = () => {
    const { scopeId } = useParams<{ scopeId: string }>();
    const navigate = useNavigate();
    const scope = SCOPES.find(s => s.id === scopeId);
    const categoryConfig = scope ? CATEGORY_SETTINGS[scope.category] : undefined;

    interface EditFormState {
        word: string;
        yomigana: string;
        meaning: string;
        exampleSentence: string;
        exampleSentenceYomigana: string;
        groupMembers?: GroupMember[];
        isLearnedCategory: boolean;
        isLearnedMeaning: boolean;
    }

    const [words, setWords] = useState<Word[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [hideMastered, setHideMastered] = useState(false); // Toggle state
    const [editForm, setEditForm] = useState<EditFormState>({
        word: '',
        yomigana: '',
        meaning: '',
        exampleSentence: '',
        exampleSentenceYomigana: '',
        isLearnedCategory: false,
        isLearnedMeaning: false
    });

    // Masking State
    const [hideLeft, setHideLeft] = useState(false);
    const [hideRight, setHideRight] = useState(false);
    // Key: `${wordId}-${side}` (e.g. '123-left'), Value: 'opaque' | 'transparent'
    const [maskStates, setMaskStates] = useState<Record<string, 'opaque' | 'transparent'>>({});

    // Toggle Handler (Exclusive)
    const toggleLeft = () => {
        if (!hideLeft) {
            setHideLeft(true);
            setHideRight(false);
            setMaskStates({}); // Reset manual reveals
        } else {
            setHideLeft(false);
        }
    };

    const toggleRight = () => {
        if (!hideRight) {
            setHideRight(true);
            setHideLeft(false);
            setMaskStates({}); // Reset manual reveals
        } else {
            setHideRight(false);
        }
    };

    // Mask Sheet Click Handler
    const handleSheetClick = (maskKey: string) => {
        const current = maskStates[maskKey] || 'opaque';
        setMaskStates(prev => ({
            ...prev,
            [maskKey]: current === 'opaque' ? 'transparent' : 'opaque'
        }));
    };

    const isAnyMaskActive = hideLeft || hideRight;

    // Detect if current category has masked fields configured
    const hasLeftMask = categoryConfig?.wordList.left?.some(g => g.some(f => (f.type === 'field' && f.masked) || (f.type === 'group_members' && (f.maskFields || f.masked)))) ?? false;
    const hasRightMask = categoryConfig?.wordList.right?.some(g => g.some(f => (f.type === 'field' && f.masked) || (f.type === 'group_members' && (f.maskFields || f.masked)))) ?? false;


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

        // Reset mask state on scope change
        setHideLeft(false);
        setHideRight(false);
        setMaskStates({});
    }, [scope]);

    if (!scope) return <div>Scope not found</div>;

    // Helper to determine if a word is "Mastered"
    const isMastered = (word: Word) => {
        // Categories that only have Category Test (no Meaning Test)
        const hasMeaning = categoryConfig?.tests.some(t => t.id === 'meaning' || t.updatesLearned === 'meaning');
        if (!hasMeaning) {
            return word.isLearnedCategory;
        } else {
            // Standard categories (Proverbs, Idioms, etc.) require BOTH
            return word.isLearnedCategory && word.isLearnedMeaning;
        }
    };

    const handleEdit = (word: Word) => {
        setEditingId(word.id!);
        setEditForm({
            word: word.rawWord,
            yomigana: word.yomigana || '',
            meaning: word.rawMeaning,
            exampleSentence: word.exampleSentence || '',
            exampleSentenceYomigana: word.exampleSentenceYomigana || '',
            groupMembers: word.groupMembers ? JSON.parse(JSON.stringify(word.groupMembers)) : undefined,
            isLearnedCategory: word.isLearnedCategory,
            isLearnedMeaning: word.isLearnedMeaning
        });
    };

    const handleSave = async (id: number) => {
        const updates: Partial<Word> = {
            rawWord: editForm.word,
            yomigana: editForm.yomigana,
            rawMeaning: editForm.meaning,
            exampleSentence: editForm.exampleSentence,
            exampleSentenceYomigana: editForm.exampleSentenceYomigana,
            question: editForm.meaning,
            answer: editForm.word,
            isLearnedCategory: editForm.isLearnedCategory,
            isLearnedMeaning: editForm.isLearnedMeaning
        };

        if (editForm.groupMembers) {
            let finalMembers = editForm.groupMembers;
            // For Homonyms, the yomigana (left col) is shared by all members. Sync it.
            if (categoryConfig?.wordList.layout === 'homonym') {
                finalMembers = finalMembers.map((m: any) => ({
                    ...m,
                    yomigana: editForm.yomigana
                }));
            }

            // For Proverb Groups, each member has its own yomigana. Preserve them.
            updates.groupMembers = finalMembers;
            if (finalMembers.length > 0) {
                updates.rawWord = finalMembers[0].rawWord;
                // Use the first member's yomigana for the main word yomigana
                updates.yomigana = finalMembers[0].yomigana || editForm.yomigana;
                updates.answer = finalMembers[0].rawWord;

                // Sync example sentence fields if present in first member (important for Paired Idioms)
                if (finalMembers[0].exampleSentence !== undefined) updates.exampleSentence = finalMembers[0].exampleSentence;
                if (finalMembers[0].exampleSentenceYomigana !== undefined) updates.exampleSentenceYomigana = finalMembers[0].exampleSentenceYomigana;
            }
        }

        await db.words.update(id, updates);

        // Update local state
        setWords(words.map(w => w.id === id ? { ...w, ...updates } : w));
        setEditingId(null);
    };

    // Filter words based on toggle
    const displayedWords = hideMastered ? words.filter(w => !isMastered(w)) : words;

    // --- Helper for Config-Driven Rendering ---
    const renderConfigField = (
        spec: FieldSpec,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any,
        isEditing: boolean,
        onUpdate?: (field: string, val: string) => void,
        isMaskActive: boolean = false,
        maskContext?: { wordId: string; side: 'left' | 'right' }
    ) => {
        if (spec.type === 'group_members') {
            let members = data.groupMembers || [data];
            if (spec.orderBy === 'customLabel') {
                members = [...members].sort((a: any, b: any) => {
                    const labelA = a.customLabel || '';
                    const labelB = b.customLabel || '';
                    if (labelA < labelB) return -1;
                    if (labelA > labelB) return 1;
                    return 0;
                });
            }
            const indexedMembers = members.map((member: any, idx: number) => ({ member, sourceIndex: idx }));
            const displayMembers = (typeof spec.memberIndex === 'number')
                ? indexedMembers.filter(entry => entry.sourceIndex === spec.memberIndex)
                : indexedMembers;
            return (
                <div className="flex flex-col gap-4">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {displayMembers.map(({ member, sourceIndex }) => {
                        const canMaskMemberRow = !isEditing && !!spec.maskFields?.length && !!maskContext;
                        const memberMaskKey = canMaskMemberRow ? `${maskContext.wordId}-${maskContext.side}-member-${sourceIndex}` : '';
                        const isRevealed = canMaskMemberRow ? maskStates[memberMaskKey] === 'transparent' : false;

                        const renderedFields = spec.fields.map((fieldName, fIdx) => {
                            // Map fieldName to implied role
                            const role = fieldName === 'word' ? 'main' : fieldName === 'example' ? 'sentence' : 'sub';
                            const subMasked = spec.maskFields ? spec.maskFields.includes(fieldName) : false;
                            const subSpec: FieldSpec = { type: 'field', field: fieldName, role, masked: subMasked };

                            const node = (
                                <React.Fragment key={fIdx}>
                                    {renderConfigField(subSpec, member, isEditing, isEditing ? (key, val) => {
                                        // Handle member update
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const currentMembers = (data.groupMembers && data.groupMembers.length > 0)
                                            ? [...data.groupMembers]
                                            // Fallback if editing a word that didn't have members yet
                                            : [{ ...data }];

                                        // Keep updates aligned with the original member index (important for memberIndex rendering).
                                        if (!currentMembers[sourceIndex]) currentMembers[sourceIndex] = { ...member };

                                        // Note: 'key' comes from renderConfigField's internal mapping (e.g. 'rawWord', 'yomigana')
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        (currentMembers[sourceIndex] as any)[key] = val;

                                        // Prioritize updating state correctly
                                        setEditForm(prev => ({ ...prev, groupMembers: currentMembers }));
                                    } : undefined, false, maskContext)}
                                </React.Fragment>
                            );

                            return { node, masked: subMasked, key: fIdx };
                        });

                        // Only masked field runs receive overlays; non-masked fields remain untouched.
                        const segmentedNodes: Array<{ masked: boolean; nodes: Array<{ node: React.ReactNode; key: number }> }> = [];
                        renderedFields.forEach(field => {
                            const last = segmentedNodes[segmentedNodes.length - 1];
                            if (!last || last.masked !== field.masked) {
                                segmentedNodes.push({ masked: field.masked, nodes: [field] });
                                return;
                            }
                            last.nodes.push(field);
                        });

                        return (
                            <div key={sourceIndex} className="flex flex-row items-center gap-3 border-b last:border-0 border-gray-100 pb-2 last:pb-0">
                                {/* Custom Label (Left) */}
                                {spec.showCustomLabel && member.customLabel && (
                                    <div className="text-xs text-blue-600 font-bold px-2 py-0.5 bg-blue-50 rounded shrink-0 w-8 text-center mt-4.5 relative z-20">
                                        {member.customLabel}
                                    </div>
                                )}

                                <div className="flex flex-col flex-1 gap-1">
                                    {segmentedNodes.map((segment, segIdx) => {
                                        if (!canMaskMemberRow || !segment.masked) {
                                            return (
                                                <div key={segIdx}>
                                                    {segment.nodes.map(item => (
                                                        <React.Fragment key={item.key}>{item.node}</React.Fragment>
                                                    ))}
                                                </div>
                                            );
                                        }

                                        return (
                                            <MaskableSection
                                                key={segIdx}
                                                isMasked={isMaskActive}
                                                isHidden={!isRevealed}
                                                onToggle={() => handleSheetClick(memberMaskKey)}
                                            >
                                                {segment.nodes.map(item => (
                                                    <React.Fragment key={item.key}>{item.node}</React.Fragment>
                                                ))}
                                            </MaskableSection>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        const fieldKeyMap: Record<string, string> = {
            'word': 'rawWord',
            'meaning': 'rawMeaning',
            'yomigana': 'yomigana',
            'example': 'exampleSentence',
            'example_yomigana': 'exampleSentenceYomigana'
        };

        const dataKey = fieldKeyMap[spec.field];
        const val = data[dataKey] || '';

        // Style resolution
        const baseStyle = "leading-relaxed mb-1 text-gray-800";
        let styleClass = baseStyle;
        let placeholder = '';

        if (spec.role === 'main') {
            // Use config styles if available, or defaults
            const size = categoryConfig?.wordList.styles.mainTextSize === 'lg' ? 'text-lg' : 'text-base';
            const weight = categoryConfig?.wordList.styles.mainTextWeight === 'bold' ? 'font-bold' : 'font-normal';
            styleClass = clsx(baseStyle, size, weight);

            // Force Bold for 'word' field (e.g. Proverb in right column) even if config weight is normal (for Meaning)
            if (spec.field === 'word') {
                styleClass = clsx(baseStyle, size, 'font-bold');
            }

            placeholder = "メインテキスト";
        } else if (spec.role === 'sub') {
            styleClass = "text-xs text-gray-400 mb-0.5";
            placeholder = "サブテキスト";
        } else if (spec.role === 'sentence') {
            styleClass = "text-sm text-gray-600";
            placeholder = "文章";
        }

        if (isEditing && onUpdate) {
            if (spec.role === 'sentence' || spec.field === 'meaning') {
                // Use the same size class as display for Main role
                let taClass = "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none";
                if (spec.role === 'main') {
                    const size = categoryConfig?.wordList.styles.mainTextSize === 'lg' ? 'text-lg' : 'text-base';
                    taClass = clsx(taClass, size);
                } else {
                    taClass = clsx(taClass, "text-sm");
                }

                return (
                    <textarea
                        value={val}
                        onChange={e => onUpdate(dataKey, e.target.value)}
                        className={taClass}
                        placeholder={placeholder}
                        rows={spec.field === 'meaning' ? 3 : 2}
                    />
                );
            }
            if (spec.role === 'main') {
                return (
                    <textarea
                        value={val}
                        onChange={e => onUpdate(dataKey, e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                        placeholder={placeholder}
                        rows={1}
                    />
                );
            }
            return (
                <input
                    type="text"
                    value={val}
                    onChange={e => onUpdate(dataKey, e.target.value)}
                    placeholder={placeholder}
                    className="w-full p-2 border rounded text-xs text-gray-500 outline-none focus:border-blue-500"
                />
            );
        }

        // View Mode
        if (!val) return null;
        return <div className={styleClass}>{val}</div>;
    };

    const renderConfigGroup = (
        group: FieldGroup,
        word: Word,
        isEditing: boolean,
        side: 'left' | 'right',
        groupIndex: number,
        onUpdate?: (field: string, val: string) => void
    ) => {
        // Collect data for render
        const data = isEditing ? {
            rawWord: editForm.word,
            yomigana: editForm.yomigana,
            rawMeaning: editForm.meaning,
            exampleSentence: editForm.exampleSentence,
            exampleSentenceYomigana: editForm.exampleSentenceYomigana,
            groupMembers: editForm.groupMembers // Include this!
        } : word;

        const handleUpdate = (key: string, val: string) => {
            if (onUpdate) onUpdate(key, val);
        };

        // Masking Logic
        const isGlobalMaskActive = side === 'left' ? hideLeft : hideRight;
        const hasGroupMask = group.some(spec => {
            if (spec.type === 'field') return !!spec.masked;
            return !!spec.masked;
        });
        const hasMemberPartialMask = group.some(spec => spec.type === 'group_members' && !!spec.maskFields?.length);
        const canMaskGroup = !isEditing && hasGroupMask;

        const groupMaskKey = `${word.id}-${side}-group-${groupIndex}`;
        const isRevealed = maskStates[groupMaskKey] === 'transparent';

        const content = (
            <div className="flex flex-col gap-1">
                {group.map((spec, idx) => (
                    <div key={idx}>
                        {renderConfigField(spec, data, isEditing, handleUpdate, isGlobalMaskActive && hasMemberPartialMask, { wordId: word.id!.toString(), side })}
                    </div>
                ))}
            </div>
        );

        if (canMaskGroup) {
            return (
                <MaskableSection
                    className="-m-2 p-2"
                    isMasked={isGlobalMaskActive}
                    isHidden={!isRevealed}
                    onToggle={() => handleSheetClick(groupMaskKey)}
                >
                    {content}
                </MaskableSection>
            );
        }

        return <div className="p-0">{content}</div>; // No padding wrapper if not masked
    };


    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex-none z-50 bg-white/80 backdrop-blur-md border-b border-gray-300 px-4 py-3 flex items-center justify-between min-h-[60px]">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate(`/?modal=${scope.id}`)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors mr-2"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg text-gray-900 leading-tight">{scope.category} リスト</h1>
                        <p className="text-xs text-gray-500">{scope.displayId || scope.id} (P.{scope.startPage}-{scope.endPage})</p>
                    </div>
                </div>

                {/* Toggle Switch */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-gray-600 select-none">
                        習得済みを非表示
                    </span>
                    <div className="relative inline-flex items-center">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={hideMastered}
                            onChange={(e) => setHideMastered(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2B7FFF]"></div>
                    </div>
                </label>
            </header>

            <main className="flex-1 overflow-hidden p-4 md:p-6 w-full max-w-4xl mx-auto flex flex-col">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto relative">
                        <table className="w-full text-left border-collapse">
                            {/* Sticky Table Header */}
                            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider sticky top-0 z-40 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 w-16 text-center">No.</th>
                                    {categoryConfig ? (
                                        <>
                                            <th className="px-4 py-3 w-1/3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span>{categoryConfig.wordList.headerLabels.left}</span>
                                                    {hasLeftMask && (
                                                        <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                                                            <span className="text-[10px] text-gray-500 font-normal">隠す</span>
                                                            <div className="relative inline-flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="sr-only peer"
                                                                    checked={hideLeft}
                                                                    onChange={toggleLeft}
                                                                />
                                                                <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#2B7FFF]"></div>
                                                            </div>
                                                        </label>
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span>{categoryConfig.wordList.headerLabels.right}</span>
                                                    {hasRightMask && (
                                                        <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                                                            <span className="text-[10px] text-gray-500 font-normal">隠す</span>
                                                            <div className="relative inline-flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="sr-only peer"
                                                                    checked={hideRight}
                                                                    onChange={toggleRight}
                                                                />
                                                                <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#2B7FFF]"></div>
                                                            </div>
                                                        </label>
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
                            <tbody className="divide-y divide-gray-100">
                                {displayedWords.map(word => {
                                    const isEditing = editingId === word.id;
                                    const isMeaningTestHidden = !categoryConfig?.tests.some(t => t.id === 'meaning' || t.updatesLearned === 'meaning');

                                    return (
                                        <tr key={word.id} className={clsx("group transition-colors", isEditing ? "bg-blue-50" : "hover:bg-gray-50")}>
                                            <td className="px-4 py-3 text-center align-top text-gray-400 font-mono text-xs pt-4">
                                                {word.numberInPage}
                                            </td>

                                            {/* LEFT COLUMN */}
                                            <td className="px-4 py-3 align-top h-1">
                                                <div className="h-full flex flex-col">
                                                    {categoryConfig?.wordList.left ? (
                                                        categoryConfig.wordList.left.map((group, idx) => (
                                                            <div key={idx} className="mb-2 last:mb-0">
                                                                {renderConfigGroup(group, word, isEditing, 'left', idx, isEditing ? (field, val) => {
                                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                    const updates: any = {};
                                                                    if (field === 'rawWord') updates.word = val;
                                                                    else if (field === 'rawMeaning') updates.meaning = val;
                                                                    else updates[field] = val;
                                                                    setEditForm({ ...editForm, ...updates });
                                                                } : undefined)}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        // Fallback
                                                        <div className="text-gray-400">-</div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* RIGHT COLUMN */}
                                            <td className="px-4 py-3 align-top h-1">
                                                <div className="h-full flex flex-col">
                                                    {categoryConfig?.wordList.right ? (
                                                        categoryConfig.wordList.right.map((group, idx) => (
                                                            <div key={idx} className="mb-2 last:mb-0">
                                                                {renderConfigGroup(group, word, isEditing, 'right', idx, isEditing ? (field, val) => {
                                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                    const updates: any = {};
                                                                    if (field === 'rawWord') updates.word = val;
                                                                    else if (field === 'rawMeaning') updates.meaning = val;
                                                                    else updates[field] = val;
                                                                    setEditForm({ ...editForm, ...updates });
                                                                } : undefined)}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        // Fallback
                                                        <div className="text-gray-400">-</div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-center align-top pt-4">
                                                <div className="flex gap-1 justify-center">
                                                    <button
                                                        onClick={() => {
                                                            if (isEditing) {
                                                                setEditForm({ ...editForm, isLearnedCategory: !editForm.isLearnedCategory });
                                                            }
                                                        }}
                                                        className={clsx(
                                                            "w-3 h-3 rounded-full border border-gray-300 transition-colors block",
                                                            isEditing ? (editForm.isLearnedCategory ? "bg-[#2B7FFF] border-[#2B7FFF] cursor-pointer hover:opacity-80" : "bg-transparent cursor-pointer hover:bg-gray-100") : (word.isLearnedCategory ? "bg-[#2B7FFF] border-[#2B7FFF]" : "bg-transparent")
                                                        )}
                                                        title="習得済み"
                                                        disabled={!isEditing}
                                                        type="button"
                                                    />
                                                    {!isMeaningTestHidden && (
                                                        <button
                                                            onClick={() => {
                                                                if (isEditing) {
                                                                    setEditForm({ ...editForm, isLearnedMeaning: !editForm.isLearnedMeaning });
                                                                }
                                                            }}
                                                            className={clsx(
                                                                "w-3 h-3 rounded-full border border-gray-300 transition-colors block",
                                                                isEditing ? (editForm.isLearnedMeaning ? "bg-[#2B7FFF] border-[#2B7FFF] cursor-pointer hover:opacity-80" : "bg-transparent cursor-pointer hover:bg-gray-100") : (word.isLearnedMeaning ? "bg-[#2B7FFF] border-[#2B7FFF]" : "bg-transparent")
                                                            )}
                                                            title="意味テスト習得"
                                                            disabled={!isEditing}
                                                            type="button"
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
                                                        disabled={isAnyMaskActive}
                                                        className={clsx(
                                                            "p-2 rounded-full transition-colors",
                                                            isAnyMaskActive ? "text-gray-300 cursor-not-allowed bg-gray-50" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                                        )}
                                                    >
                                                        {isAnyMaskActive ? <PenOff size={16} /> : <Edit2 size={16} />}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {displayedWords.length === 0 && (
                            <div className="p-10 text-center text-gray-400">
                                {words.length === 0 ? 'データがありません' : '習得済みの単語を非表示にしています'}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const MaskableSection = ({
    isMasked,
    isHidden,
    onToggle,
    className,
    children
}: {
    isMasked: boolean;
    isHidden: boolean;
    onToggle: () => void;
    className?: string;
    children: React.ReactNode;
}) => (
    <div className={clsx("relative rounded-lg overflow-hidden", className)}>
        <MaskOverlay
            isMasked={isMasked}
            isHidden={isHidden}
            onClick={onToggle}
        />
        {children}
    </div>
);

// MaskOverlay: A simple colored sheet for hiding content
const MaskOverlay = ({ isMasked, isHidden, onClick }: { isMasked: boolean; isHidden: boolean; onClick: () => void }) => {
    if (!isMasked) return null;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={clsx(
                "absolute inset-0 cursor-pointer transition-colors duration-200 z-10 rounded-lg",
                isHidden ? "bg-[#2B7FFF]" : "bg-[#2B7FFF]/20 hover:bg-[#2B7FFF]/30"
            )}
            title={isHidden ? "タップで表示" : "タップで隠す"}
        />
    );
};
