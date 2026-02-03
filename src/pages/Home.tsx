import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SCOPES } from '../data/scope';
import { WeekCard } from '../components/WeekCard';
import { ImportButton } from '../components/ImportButton';
import { ModeModal } from '../components/ModeModal';
import { type Scope } from '../types';

export const Home: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [dataVersion, setDataVersion] = useState(0);
    const modalId = searchParams.get('modal');
    const selectedScope = modalId ? SCOPES.find(s => s.id === modalId) || null : null;

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
