import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SCOPES, findScopeById } from '../data/scope';
import { WeekCard } from '../components/WeekCard';
import { ImportButton } from '../components/ImportButton';
import { ModeModal } from '../components/ModeModal';
import { ScheduleSettingsModal } from '../components/ScheduleSettingsModal';
import { type Scope } from '../types';
import { scheduleService } from '../services/ScheduleService';
import { Calendar } from 'lucide-react';

export const Home: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [dataVersion, setDataVersion] = useState(0);
    const [scheduleMap, setScheduleMap] = useState<Map<string, string>>(new Map());
    const [nextTestDate, setNextTestDate] = useState<string | null>(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    const modalId = searchParams.get('modal');
    const selectedScope = modalId ? findScopeById(modalId) || null : null;

    useEffect(() => {
        const loadSchedules = async () => {
            const allSchedules = await scheduleService.getAll();

            const map = new Map<string, string>();
            allSchedules.forEach(s => map.set(s.scopeId, s.date));
            setScheduleMap(map);

            const today = new Date().toISOString().split('T')[0];
            setNextTestDate(scheduleService.getNextTestDate(today, allSchedules));
        };
        loadSchedules();
    }, [showScheduleModal]); // Reload when modal closes (implicit dependency via boolean toggle isn't perfect but works if we set false)

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
                        onClick={() => setShowScheduleModal(true)}
                        className="p-2 bg-white text-gray-600 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                        title="スケジュール設定"
                    >
                        <Calendar size={20} />
                    </button>
                    <ImportButton onImportComplete={handleImportComplete} />
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {SCOPES.map(scope => {
                        const date = scheduleMap.get(scope.id);
                        const isNext = date && date === nextTestDate;
                        return (
                            <WeekCard
                                key={`${scope.id}-${dataVersion}`}
                                scope={scope}
                                onClick={handleOpenModal}
                                testDate={date}
                                isNextTest={!!isNext}
                            />
                        );
                    })}
                </div>
            </main>

            {selectedScope && (
                <ModeModal
                    scope={selectedScope}
                    onClose={handleCloseModal}
                />
            )}

            {showScheduleModal && (
                <ScheduleSettingsModal
                    onClose={() => setShowScheduleModal(false)}
                />
            )}
        </div>
    );
};
