import React from 'react';
import clsx from 'clsx';
import type { Word } from '../../types';
import type { FieldGroup } from '../../utils/categoryConfig';
import type { PanelSide } from '../../hooks/useMaskingState';

interface WordListTableRowProps {
    word: Word;
    isEditing: boolean;
    leftGroups?: FieldGroup[];
    rightGroups?: FieldGroup[];
    renderPanelCell: (
        word: Word,
        isEditing: boolean,
        side: PanelSide,
        groups?: FieldGroup[]
    ) => React.ReactNode;
    renderLearnCell: (word: Word, isEditing: boolean) => React.ReactNode;
    renderEditCell: (word: Word, isEditing: boolean) => React.ReactNode;
}

export const WordListTableRow: React.FC<WordListTableRowProps> = ({
    word,
    isEditing,
    leftGroups,
    rightGroups,
    renderPanelCell,
    renderLearnCell,
    renderEditCell
}) => (
    <tr className={clsx("group transition-colors", isEditing ? "bg-blue-50" : "hover:bg-gray-50")}>
        <td className="px-4 py-3 text-center align-top text-gray-400 font-mono text-xs pt-4">
            {word.numberInPage}
        </td>

        {renderPanelCell(word, isEditing, 'left', leftGroups)}
        {renderPanelCell(word, isEditing, 'right', rightGroups)}
        {renderLearnCell(word, isEditing)}
        {renderEditCell(word, isEditing)}
    </tr>
);
