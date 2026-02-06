import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Edit2, PenOff } from 'lucide-react';
import { db } from '../db';
import { findScopeById } from '../data/scope';
import { type Word, type GroupMember } from '../types';
import clsx from 'clsx';

import { CATEGORY_SETTINGS, type FieldGroup, type FieldSpec } from '../utils/categoryConfig';
import { MaskableSection } from '../components/wordlist/MaskableSection';
import { WordListTableHeader } from '../components/wordlist/WordListTableHeader';
import { WordListTableRow } from '../components/wordlist/WordListTableRow';
import { useMaskingState, type PanelSide } from '../hooks/useMaskingState';
import {
    getDataFieldKey,
    getDefaultRoleForField,
    getEditFormKeyFromDataField,
    type DataFieldKey
} from '../utils/fieldMapping';

const specHasMask = (spec: FieldSpec): boolean => {
    if (spec.type === 'field') return !!spec.masked;
    return !!spec.masked || !!spec.maskFields?.length;
};

const groupsHaveMask = (groups?: FieldGroup[]): boolean => {
    return groups?.some(group => group.some(specHasMask)) ?? false;
};

const specHasWholeMask = (spec: FieldSpec): boolean => !!spec.masked;


export const WordList: React.FC = () => {
    const { scopeId } = useParams<{ scopeId: string }>();
    const navigate = useNavigate();
    const scope = scopeId ? findScopeById(scopeId) : undefined;
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

    interface RenderData {
        rawWord?: string;
        rawMeaning?: string;
        yomigana?: string;
        exampleSentence?: string;
        exampleSentenceYomigana?: string;
        groupMembers?: GroupMember[];
        customLabel?: string;
    }

    type BasicFieldSpec = Extract<FieldSpec, { type: 'field' }>;
    type GroupMemberSpec = Extract<FieldSpec, { type: 'group_members' }>;
    type EditableGroupMember = GroupMember & { rawMeaning?: string };
    type IndexedMember = { member: EditableGroupMember; sourceIndex: number };
    type RenderedMemberField = { node: React.ReactNode; masked: boolean; key: number };
    type MemberMaskSegment = { masked: boolean; nodes: Array<{ node: React.ReactNode; key: number }> };
    type MaskContext = { wordId: string; side: PanelSide; groupIndex: number };
    type GroupMaskState = {
        isGlobalMaskActive: boolean;
        hasMemberPartialMask: boolean;
        canMaskGroup: boolean;
        groupMaskKey: string;
        isRevealed: boolean;
    };

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

    const {
        hideLeft,
        hideRight,
        maskStates,
        isAnyMaskActive,
        toggleLeft,
        toggleRight,
        handleSheetClick,
        resetMasking
    } = useMaskingState();

    // Detect if current category has masked fields configured
    const hasLeftMask = groupsHaveMask(categoryConfig?.wordList.left);
    const hasRightMask = groupsHaveMask(categoryConfig?.wordList.right);


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
            resetMasking();
        };
        fetchWords();
    }, [scope, resetMasking]);

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
                finalMembers = finalMembers.map((m) => ({
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
    const hasMeaningTest = categoryConfig?.tests.some(t => t.id === 'meaning' || t.updatesLearned === 'meaning') ?? false;

    const applyConfigEditUpdate = (field: DataFieldKey, val: string) => {
        setEditForm(prev => ({
            ...prev,
            [getEditFormKeyFromDataField(field)]: val
        }));
    };

    const toggleEditLearnedFlag = (field: 'isLearnedCategory' | 'isLearnedMeaning') => {
        setEditForm(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const getRenderData = (isEditing: boolean, word: Word): RenderData => {
        if (!isEditing) return word;
        return {
            rawWord: editForm.word,
            yomigana: editForm.yomigana,
            rawMeaning: editForm.meaning,
            exampleSentence: editForm.exampleSentence,
            exampleSentenceYomigana: editForm.exampleSentenceYomigana,
            groupMembers: editForm.groupMembers
        };
    };

    const getIndexedMembers = (data: RenderData, spec: GroupMemberSpec): IndexedMember[] => {
        let indexedMembers: IndexedMember[] = (data.groupMembers && data.groupMembers.length > 0
            ? data.groupMembers
            : [data as EditableGroupMember]
        ).map((member, originalIndex) => ({ member, sourceIndex: originalIndex }));

        if (spec.orderBy === 'customLabel') {
            indexedMembers = [...indexedMembers].sort((a, b) => {
                const labelA = a.member.customLabel || '';
                const labelB = b.member.customLabel || '';
                if (labelA < labelB) return -1;
                if (labelA > labelB) return 1;
                return 0;
            });
        }

        if (typeof spec.memberIndex === 'number') {
            return indexedMembers.filter(entry => entry.sourceIndex === spec.memberIndex);
        }
        return indexedMembers;
    };

    const updateGroupMemberField = (
        data: RenderData,
        member: EditableGroupMember,
        sourceIndex: number,
        key: DataFieldKey,
        val: string
    ) => {
        const currentMembers: EditableGroupMember[] = (data.groupMembers && data.groupMembers.length > 0)
            ? [...data.groupMembers]
            : [{ ...(data as EditableGroupMember) }];

        if (!currentMembers[sourceIndex]) currentMembers[sourceIndex] = { ...member };
        currentMembers[sourceIndex][key] = val;
        setEditForm(prev => ({ ...prev, groupMembers: currentMembers }));
    };

    const buildMemberMaskSegments = (renderedFields: RenderedMemberField[]): MemberMaskSegment[] => {
        const segmentedNodes: MemberMaskSegment[] = [];
        renderedFields.forEach(field => {
            const last = segmentedNodes[segmentedNodes.length - 1];
            if (!last || last.masked !== field.masked) {
                segmentedNodes.push({ masked: field.masked, nodes: [field] });
                return;
            }
            last.nodes.push(field);
        });
        return segmentedNodes;
    };

    const getMainTextSizeClass = () => categoryConfig?.wordList.styles.mainTextSize === 'lg' ? 'text-lg' : 'text-base';

    const getFieldPresentation = (spec: BasicFieldSpec): { styleClass: string; placeholder: string } => {
        const baseStyle = "leading-relaxed mb-1 text-gray-800";
        if (spec.role === 'main') {
            const size = getMainTextSizeClass();
            const weight = categoryConfig?.wordList.styles.mainTextWeight === 'bold' ? 'font-bold' : 'font-normal';
            const styleClass = spec.field === 'word'
                ? clsx(baseStyle, size, 'font-bold')
                : clsx(baseStyle, size, weight);
            return { styleClass, placeholder: "メインテキスト" };
        }
        if (spec.role === 'sub') {
            return { styleClass: "text-xs text-gray-400 mb-0.5", placeholder: "サブテキスト" };
        }
        if (spec.role === 'sentence') {
            return { styleClass: "text-sm text-gray-600", placeholder: "文章" };
        }
        return { styleClass: baseStyle, placeholder: '' };
    };

    const renderEditableField = (
        spec: BasicFieldSpec,
        val: string,
        dataKey: DataFieldKey,
        placeholder: string,
        onUpdate: (field: DataFieldKey, val: string) => void
    ) => {
        if (spec.role === 'sentence' || spec.field === 'meaning') {
            let taClass = "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none";
            if (spec.role === 'main') {
                taClass = clsx(taClass, getMainTextSizeClass());
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
    };

    const renderBasicField = (
        spec: BasicFieldSpec,
        data: RenderData,
        isEditing: boolean,
        onUpdate?: (field: DataFieldKey, val: string) => void,
    ) => {
        const dataKey = getDataFieldKey(spec.field);
        const val = data[dataKey] || '';
        const { styleClass, placeholder } = getFieldPresentation(spec);

        if (isEditing && onUpdate) {
            return renderEditableField(spec, val, dataKey, placeholder, onUpdate);
        }

        // View Mode
        if (!val) return null;
        return <div className={styleClass}>{val}</div>;
    };

    const renderGroupMembersField = (
        spec: GroupMemberSpec,
        data: RenderData,
        isEditing: boolean,
        isMaskActive: boolean = false,
        maskContext?: MaskContext
    ) => {
        const displayMembers = getIndexedMembers(data, spec);
        return (
            <div className="flex flex-col gap-4">
                {displayMembers.map(({ member, sourceIndex }) => {
                    const canMaskMemberRow = !isEditing && !!spec.maskFields?.length && !!maskContext;
                    const memberMaskKey = canMaskMemberRow ? `${maskContext.wordId}-${maskContext.side}-group-${maskContext.groupIndex}-member-${sourceIndex}` : '';
                    const isRevealed = canMaskMemberRow ? maskStates[memberMaskKey] === 'transparent' : false;

                    const renderedFields = spec.fields.map((fieldName, fIdx) => {
                        const role = getDefaultRoleForField(fieldName);
                        const subMasked = spec.maskFields ? spec.maskFields.includes(fieldName) : false;
                        const subSpec: BasicFieldSpec = { type: 'field', field: fieldName, role, masked: subMasked };

                        const node = (
                            <React.Fragment key={fIdx}>
                                {renderBasicField(subSpec, member, isEditing, isEditing ? (key, val) => {
                                    updateGroupMemberField(data, member, sourceIndex, key, val);
                                } : undefined)}
                            </React.Fragment>
                        );

                        return { node, masked: subMasked, key: fIdx };
                    });

                    const segmentedNodes = buildMemberMaskSegments(renderedFields);

                    return (
                        <div key={sourceIndex} className="flex flex-row items-center gap-3 border-b last:border-0 border-gray-100 pb-2 last:pb-0">
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
                                            spacing="contentInset"
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
    };

    // --- Helper for Config-Driven Rendering ---
    const renderConfigField = (
        spec: FieldSpec,
        data: RenderData,
        isEditing: boolean,
        onUpdate?: (field: DataFieldKey, val: string) => void,
        isMaskActive: boolean = false,
        maskContext?: MaskContext
    ) => {
        if (spec.type === 'group_members') {
            return renderGroupMembersField(spec, data, isEditing, isMaskActive, maskContext);
        }
        return renderBasicField(spec, data, isEditing, onUpdate);
    };

    const renderConfigGroup = (
        group: FieldGroup,
        word: Word,
        isEditing: boolean,
        side: PanelSide,
        groupIndex: number,
        onUpdate?: (field: DataFieldKey, val: string) => void
    ) => {
        const data = getRenderData(isEditing, word);
        const wordId = `${word.id}`;

        const handleUpdate = (key: DataFieldKey, val: string) => {
            if (onUpdate) onUpdate(key, val);
        };

        const getGroupMaskState = (): GroupMaskState => {
            const isGlobalMaskActive = side === 'left' ? hideLeft : hideRight;
            const hasGroupMask = group.some(specHasWholeMask);
            const hasMemberPartialMask = group.some(spec => spec.type === 'group_members' && !!spec.maskFields?.length);
            const canMaskGroup = !isEditing && hasGroupMask;
            const groupMaskKey = `${wordId}-${side}-group-${groupIndex}`;
            const isRevealed = maskStates[groupMaskKey] === 'transparent';
            return {
                isGlobalMaskActive,
                hasMemberPartialMask,
                canMaskGroup,
                groupMaskKey,
                isRevealed
            };
        };

        const maskState = getGroupMaskState();

        const renderGroupContent = () => (
            <div className="flex flex-col gap-1">
                {group.map((spec, idx) => (
                    <div key={idx}>
                        {renderConfigField(
                            spec,
                            data,
                            isEditing,
                            handleUpdate,
                            maskState.isGlobalMaskActive && maskState.hasMemberPartialMask,
                            { wordId, side, groupIndex }
                        )}
                    </div>
                ))}
            </div>
        );

        const content = renderGroupContent();

        if (maskState.canMaskGroup) {
            return (
                <MaskableSection
                    isMasked={maskState.isGlobalMaskActive}
                    isHidden={!maskState.isRevealed}
                    spacing="inset"
                    onToggle={() => handleSheetClick(maskState.groupMaskKey)}
                >
                    {content}
                </MaskableSection>
            );
        }

        return <div className="p-0">{content}</div>; // No padding wrapper if not masked
    };

    const renderPanelCell = (
        word: Word,
        isEditing: boolean,
        side: PanelSide,
        groups?: FieldGroup[]
    ) => (
        <td className="px-4 py-3 align-top h-1">
            <div className="h-full flex flex-col">
                {groups ? (
                    groups.map((group, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                            {renderConfigGroup(group, word, isEditing, side, idx, isEditing ? applyConfigEditUpdate : undefined)}
                        </div>
                    ))
                ) : (
                    <div className="text-gray-400">-</div>
                )}
            </div>
        </td>
    );

    const renderLearnCell = (word: Word, isEditing: boolean) => (
        <td className="px-4 py-3 text-center align-top pt-4">
            <div className="flex gap-1 justify-center">
                <button
                    onClick={() => {
                        if (isEditing) {
                            toggleEditLearnedFlag('isLearnedCategory');
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
                {hasMeaningTest && (
                    <button
                        onClick={() => {
                            if (isEditing) {
                                toggleEditLearnedFlag('isLearnedMeaning');
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
    );

    const renderEditCell = (word: Word, isEditing: boolean) => (
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
    );


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
                            <WordListTableHeader
                                categoryConfig={categoryConfig}
                                hasLeftMask={hasLeftMask}
                                hasRightMask={hasRightMask}
                                hideLeft={hideLeft}
                                hideRight={hideRight}
                                onToggleLeft={toggleLeft}
                                onToggleRight={toggleRight}
                            />
                            <tbody className="divide-y divide-gray-100">
                                {displayedWords.map(word => {
                                    const isEditing = editingId === word.id;

                                    return (
                                        <WordListTableRow
                                            key={word.id}
                                            word={word}
                                            isEditing={isEditing}
                                            leftGroups={categoryConfig?.wordList.left}
                                            rightGroups={categoryConfig?.wordList.right}
                                            renderPanelCell={renderPanelCell}
                                            renderLearnCell={renderLearnCell}
                                            renderEditCell={renderEditCell}
                                        />
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
