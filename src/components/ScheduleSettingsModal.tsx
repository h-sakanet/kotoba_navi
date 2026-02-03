import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { scheduleService } from '../services/ScheduleService';
import { type Schedule } from '../types';
import clsx from 'clsx';
import { formatDate } from '../utils/dateUtils';
import { SCOPES } from '../data/scope';

interface ScheduleSettingsModalProps {
    onClose: () => void;
}

export const ScheduleSettingsModal: React.FC<ScheduleSettingsModalProps> = ({ onClose }) => {
    const [assignments, setAssignments] = useState<Map<string, string>>(new Map()); // scopeId -> date
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
    const [groupedScopes, setGroupedScopes] = useState<typeof SCOPES[]>([]);

    useEffect(() => {
        // Load initial data
        const load = async () => {
            const currentSchedules = await scheduleService.getAll();
            const initialMap = new Map<string, string>();
            const initialDates = new Set<string>();

            currentSchedules.forEach(s => {
                initialMap.set(s.scopeId, s.date);
                initialDates.add(s.date);
            });

            setAssignments(initialMap);
            setSelectedDates(initialDates);
            setGroupedScopes(scheduleService.getGroupedScopes());
        };
        load();
    }, []);

    const handleDateToggle = (dateStr: string) => {
        const newDates = new Set(selectedDates);
        if (newDates.has(dateStr)) {
            newDates.delete(dateStr);
        } else {
            newDates.add(dateStr);
        }
        setSelectedDates(newDates);
        recalculateAssignments(newDates);
    };

    const recalculateAssignments = (dates: Set<string>) => {
        // Sort dates: earliest first
        const sortedDates = Array.from(dates).sort();
        const newAssignments = new Map<string, string>();

        // Assign dates to groups sequentially
        groupedScopes.forEach((group, index) => {
            if (index < sortedDates.length) {
                const date = sortedDates[index];
                // Assign this date to ALL scopes in the group (e.g. 42A-22 and 42A-22-2)
                group.forEach(scope => {
                    newAssignments.set(scope.id, date);
                });
            }
        });
        setAssignments(newAssignments);
    };

    const handleSave = async () => {
        const schedulesToSave: Schedule[] = [];
        const scopeIdsToDelete: string[] = [];

        // Flatten all scopes from groups to check every single scope
        const allScopes = groupedScopes.flat();

        allScopes.forEach(scope => {
            if (assignments.has(scope.id)) {
                // It has a date, so save/update it
                schedulesToSave.push({
                    scopeId: scope.id,
                    date: assignments.get(scope.id)!
                });
            } else {
                // It does NOT have a date in the current assignments
                // We should ensure it's removed from the DB
                scopeIdsToDelete.push(scope.id);
            }
        });

        await scheduleService.saveBatch(schedulesToSave);
        if (scopeIdsToDelete.length > 0) {
            await scheduleService.deleteBatch(scopeIdsToDelete);
        }

        onClose();
    };

    // Calendar Helper
    const renderCalendar = () => {
        const months = 12; // Show next 12 months
        const today = new Date();
        const calendars = [];

        for (let i = 0; i < months; i++) {
            const current = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const year = current.getFullYear();
            const month = current.getMonth();

            // Days in month
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday

            const days = [];
            // Padding for first week
            for (let j = 0; j < firstDay; j++) {
                days.push(<div key={`pad-${i}-${j}`} className="h-8 w-8" />);
            }

            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const isSelected = selectedDates.has(dateStr);

                days.push(
                    <button
                        key={dateStr}
                        onClick={() => handleDateToggle(dateStr)}
                        className={clsx(
                            "h-8 w-8 flex items-center justify-center rounded-full text-sm transition-colors",
                            isSelected
                                ? "bg-blue-600 text-white font-bold"
                                : "hover:bg-blue-100 text-gray-700"
                        )}
                    >
                        {d}
                    </button>
                );
            }

            calendars.push(
                <div key={`${year}-${month}`} className="mb-6 break-inside-avoid">
                    <h4 className="font-bold text-gray-600 mb-2 pl-2">
                        {year}年 {month + 1}月
                    </h4>
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                            <div key={day} className="text-xs text-gray-400 font-bold mb-1">{day}</div>
                        ))}
                        {days}
                    </div>
                </div>
            );
        }
        return calendars;
    };



    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white z-10">
                    <h2 className="text-lg font-bold text-gray-800">テスト日程設定</h2>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
                            キャンセル
                        </button>
                        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-bold shadow-md transition-all active:scale-95">
                            <Save size={18} />
                            保存
                        </button>
                    </div>
                </div>

                {/* Content - 2 Columns */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Column: ID List */}
                    <div className="w-1/3 min-w-[300px] border-r border-gray-100 overflow-y-auto bg-gray-50 flex flex-col">
                        <div className="p-2 sticky top-0 bg-gray-50/95 backdrop-blur z-10 border-b border-gray-200">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 py-1">割り当て一覧</div>
                        </div>
                        <div className="p-2 space-y-2">
                            {groupedScopes.map((group) => {
                                const representative = group[0];
                                const assignedDate = assignments.get(representative.id);
                                const isAssigned = !!assignedDate;

                                return (
                                    <div key={representative.id} className={clsx(
                                        "px-3 py-2 rounded-xl border transition-all flex items-center justify-between gap-1",
                                        isAssigned
                                            ? "bg-white border-gray-200 shadow-sm"
                                            : "bg-gray-100/50 border-gray-100 opacity-60"
                                    )}>
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="font-mono text-sm font-bold text-gray-500 whitespace-nowrap">
                                                {representative.displayId || representative.id}
                                            </span>
                                            <div className="text-sm font-medium text-gray-700 truncate">
                                                {representative.category}
                                            </div>
                                        </div>
                                        {isAssigned && (
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 whitespace-nowrap ml-1">
                                                {formatDate(assignedDate)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Calendar */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                            {renderCalendar()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
