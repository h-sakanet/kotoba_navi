import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { parseAndImportCSV } from '../utils/csvImporter';

export const ImportButton: React.FC<{ onImportComplete: () => void }> = ({ onImportComplete }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const confirmed = window.confirm(
            "CSVをインポートしますか？\n\n【注意】\n該当ページの既存データと学習記録（フラグ）はすべて上書き・リセットされます。"
        );

        if (confirmed) {
            try {
                await parseAndImportCSV(file);
                alert('インポートが完了しました。');
                onImportComplete();
            } catch (error) {
                console.error(error);
                alert('インポートに失敗しました。');
            }
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div>
            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                title="CSVインポート"
            >
                <Upload size={24} />
            </button>
        </div>
    );
};
