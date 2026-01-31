import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { SCOPES } from '../data/scope';
import { WeekCard } from '../components/WeekCard';
import { ImportButton } from '../components/ImportButton';
import { ModeModal } from '../components/ModeModal';
import { type Scope } from '../types';

export const Home: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [dataVersion, setDataVersion] = useState(0);
    const [selectedScope, setSelectedScope] = useState<Scope | null>(null);
    const [hideCompleted, setHideCompleted] = useState(false);

    // Sync URL param with state on mount/update
    useEffect(() => {
        const modalId = searchParams.get('modal');
        if (modalId) {
            const scope = SCOPES.find(s => s.id === modalId);
            if (scope) {
                setSelectedScope(scope);
            }
        } else {
            setSelectedScope(null);
        }
    }, [searchParams]);

    const handleImportComplete = () => {
        setDataVersion(prev => prev + 1);
    };

    const handleOpenModal = (scope: Scope) => {
        setSearchParams({ modal: scope.id });
    };

    const handleCloseModal = () => {
        setSearchParams({});
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8 pb-20">
            <header className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">言葉ナビ</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setHideCompleted(!hideCompleted)}
                        className="p-2 bg-white text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        title={hideCompleted ? "完了を表示" : "完了を非表示"}
                    >
                        {hideCompleted ? <EyeOff size={24} /> : <Eye size={24} />}
                    </button>
                    <ImportButton onImportComplete={handleImportComplete} />
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {SCOPES.map(scope => (
                        <WeekCard
                            key={`${scope.id}-${dataVersion}`}
                            scope={scope}
                            onClick={handleOpenModal}
                            hideCompleted={hideCompleted}
                        />
                    ))}
                </div>
            </main>

            {selectedScope && (
                <ModeModal
                    scope={selectedScope}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};
