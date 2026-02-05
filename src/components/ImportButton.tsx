import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { parseAndImportCSV } from '../utils/csvImporter';
import { ImportResultModal } from './ImportResultModal';

export const ImportButton: React.FC<{ onImportComplete: () => void }> = ({ onImportComplete }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const [importResults, setImportResults] = useState<string[]>([]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const confirmed = window.confirm(
            `選択された${files.length}件のCSVファイルをインポートしますか？\n\n【注意】\n該当ページの既存データと学習記録（フラグ）はすべて上書き・リセットされます。`
        );

        if (confirmed) {
            try {
                const results: string[] = [];
                for (let i = 0; i < files.length; i++) {
                    const result = await parseAndImportCSV(files[i]);
                    results.push(
                        `${result.category}:${result.count}レコード取り込み\n${result.mapping}`
                    );
                }
                setImportResults(results);
                setResultModalOpen(true);
                onImportComplete();
            } catch (error) {
                console.error(error);
                alert('インポートに失敗しました。処理を中断します。');
            }
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <div>
                <input
                    type="file"
                    accept=".csv"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white text-gray-600 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                    title="CSVインポート"
                >
                    <Upload size={20} />
                </button>
            </div>
            <ImportResultModal
                isOpen={resultModalOpen}
                onClose={() => setResultModalOpen(false)}
                results={importResults}
            />
        </>
    );
};
