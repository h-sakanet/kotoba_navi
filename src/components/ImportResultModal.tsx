import React from 'react';
import { X } from 'lucide-react';

interface ImportResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    results: string[];
}

export const ImportResultModal: React.FC<ImportResultModalProps> = ({ isOpen, onClose, results }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">インポート結果</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {results.map((result, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                                {result}
                            </pre>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};
