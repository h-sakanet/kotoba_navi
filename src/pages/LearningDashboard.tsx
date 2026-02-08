import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db';
import { findScopeById } from '../data/scope';
import { type Word } from '../types';
import { learningLogService, type LearningDailyStat } from '../services/learningLogService';
import { CATEGORY_SETTINGS } from '../utils/categoryConfig';
import {
    LEARNING_METRIC_LABELS,
    LEARNING_DASHBOARD_WINDOW_DAYS,
    buildDateWindow,
    buildLearningUnits,
    getDashboardSideVisibility,
    type LearningUnit,
    type LearningMetricKey
} from '../utils/learningDashboard';

type DailyMetrics = Record<LearningMetricKey, number>;

const EMPTY_METRICS: DailyMetrics = {
    revealCount: 0,
    testWrongCount: 0,
    testCorrectCount: 0,
    testForgotCount: 0
};

const cloneEmptyMetrics = (): DailyMetrics => ({ ...EMPTY_METRICS });

const getTone = (value: number, max: number, metric: LearningMetricKey): string => {
    if (value <= 0 || max <= 0) return 'bg-gray-100 text-gray-400';
    const ratio = value / max;

    if (metric === 'testForgotCount') {
        if (ratio < 0.25) return 'bg-red-100 text-red-700';
        if (ratio < 0.55) return 'bg-red-300 text-red-800';
        if (ratio < 0.8) return 'bg-red-500 text-white';
        return 'bg-red-700 text-white';
    }

    if (ratio < 0.2) return 'bg-[#DBEAFE] text-[#1E3A8A]';
    if (ratio < 0.45) return 'bg-[#93C5FD] text-[#1E3A8A]';
    if (ratio < 0.75) return 'bg-[#3B82F6] text-white';
    return 'bg-[#1D4ED8] text-white';
};

const buildMetricsIndex = (rows: LearningDailyStat[]): Map<string, DailyMetrics> => {
    const index = new Map<string, DailyMetrics>();
    rows.forEach(row => {
        index.set(
            `${row.side}|${row.unitKey}|${row.date}`,
            {
                revealCount: row.revealCount,
                testWrongCount: row.testWrongCount,
                testCorrectCount: row.testCorrectCount,
                testForgotCount: row.testForgotCount
            }
        );
    });
    return index;
};

const buildSeriesByUnit = (
    metricsIndex: Map<string, DailyMetrics>,
    side: 'left' | 'right',
    unitKey: string | undefined,
    dateKeys: string[]
): DailyMetrics[] => {
    if (!unitKey) {
        return dateKeys.map(() => cloneEmptyMetrics());
    }

    return dateKeys.map(dateKey => metricsIndex.get(`${side}|${unitKey}|${dateKey}`) || cloneEmptyMetrics());
};

const sumSeries = (seriesList: DailyMetrics[][], dateKeys: string[]): DailyMetrics[] => {
    return dateKeys.map((_, index) => {
        const acc = cloneEmptyMetrics();
        seriesList.forEach(series => {
            acc.revealCount += series[index].revealCount;
            acc.testWrongCount += series[index].testWrongCount;
            acc.testCorrectCount += series[index].testCorrectCount;
            acc.testForgotCount += series[index].testForgotCount;
        });
        return acc;
    });
};

const HeatmapGrid: React.FC<{
    panelLabel: string;
    dates: string[];
    series: DailyMetrics[];
}> = ({ panelLabel, dates, series }) => {
    const maxByMetric = useMemo(() => ({
        revealCount: Math.max(...series.map(item => item.revealCount), 0),
        testWrongCount: Math.max(...series.map(item => item.testWrongCount), 0),
        testCorrectCount: Math.max(...series.map(item => item.testCorrectCount), 0),
        testForgotCount: Math.max(...series.map(item => item.testForgotCount), 0)
    }), [series]);

    return (
        <div className="w-fit">
            <p className="text-xs font-semibold text-gray-600 mb-1">{panelLabel}</p>
            <table className="border-separate border-spacing-[2px]">
                <thead>
                    <tr>
                        <th className="w-20" />
                        {dates.map(date => (
                            <th key={date} className="w-7 text-[11px] text-gray-500 font-semibold text-center">
                                {date}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {LEARNING_METRIC_LABELS.map(metric => (
                        <tr key={metric.key}>
                            <td className="text-sm text-gray-600 pr-2 whitespace-nowrap">
                                {metric.label}
                            </td>
                            {series.map((item, idx) => {
                                const value = item[metric.key];
                                return (
                                    <td key={`${metric.key}-${idx}`} className="w-7 h-7">
                                        <div
                                            className={clsx(
                                                'w-7 h-7 rounded-[4px] text-[12px] font-semibold flex items-center justify-center',
                                                getTone(value, maxByMetric[metric.key], metric.key)
                                            )}
                                        >
                                            {value}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

interface DashboardState {
    loading: boolean;
    testDate: string;
    rangeLabel: string;
    dates: string[];
    dateKeys: string[];
    words: Word[];
    units: LearningUnit[];
    rows: LearningDailyStat[];
}

const getTodayDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDateYmdSlash = (date: string): string => {
    const [year, month, day] = date.split('-');
    if (!year || !month || !day) return date;
    return `${year}/${Number(month)}/${Number(day)}`;
};

export const LearningDashboard: React.FC = () => {
    const { scopeId } = useParams<{ scopeId: string }>();
    const navigate = useNavigate();
    const scope = scopeId ? findScopeById(scopeId) : undefined;
    const settings = scope ? CATEGORY_SETTINGS[scope.category] : undefined;

    const [state, setState] = useState<DashboardState>({
        loading: true,
        testDate: getTodayDate(),
        rangeLabel: '',
        dates: [],
        dateKeys: [],
        words: [],
        units: [],
        rows: []
    });

    useEffect(() => {
        if (!scope || !settings) return;

        const load = async () => {
            const words = await db.words
                .where('page')
                .between(scope.startPage, scope.endPage, true, true)
                .toArray();

            words.sort((a, b) => {
                if (a.page !== b.page) return a.page - b.page;
                return a.numberInPage - b.numberInPage;
            });

            const schedule = await db.schedules.where('scopeId').equals(scope.id).first();
            const testDate = schedule?.date || getTodayDate();
            const window = buildDateWindow(testDate, LEARNING_DASHBOARD_WINDOW_DAYS);
            const rows = await learningLogService.getRange(scope.id, window.startDate, window.endDate);
            const units = buildLearningUnits(words, settings);

            setState({
                loading: false,
                testDate,
                rangeLabel: window.rangeLabel,
                dates: window.labels,
                dateKeys: window.dateKeys,
                words,
                units,
                rows
            });
        };

        void load();
    }, [scope, settings]);

    if (!scope || !settings) {
        return <div className="p-6">Scope not found</div>;
    }

    if (state.loading) {
        return <div className="p-6">Loading...</div>;
    }

    const { showLeft, showRight } = getDashboardSideVisibility(settings);
    const labels = settings.wordList.headerLabels;
    const metricsIndex = buildMetricsIndex(state.rows);

    const totalLeftSeries = showLeft
        ? sumSeries(
            state.units.map(unit => buildSeriesByUnit(metricsIndex, 'left', unit.leftUnitKey, state.dateKeys)),
            state.dateKeys
        )
        : [];
    const totalRightSeries = showRight
        ? sumSeries(
            state.units.map(unit => buildSeriesByUnit(metricsIndex, 'right', unit.rightUnitKey, state.dateKeys)),
            state.dateKeys
        )
        : [];

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            <header className="flex-none z-50 bg-white/80 backdrop-blur-md border-b border-gray-300 px-4 py-3 flex items-center justify-between min-h-[60px]">
                <div className="flex items-center">
                    <button
                        type="button"
                        onClick={() => navigate(`/?modal=${scope.id}`)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors mr-2"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg text-gray-900 leading-tight">学習ダッシュボード</h1>
                        <p className="text-xs text-gray-500">{scope.displayId || scope.id} / {scope.category}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 text-xs text-gray-600">
                    <span>テスト日: {formatDateYmdSlash(state.testDate)}</span>
                    <span>集計範囲: {state.rangeLabel}</span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-7xl mx-auto flex flex-col gap-5">
                <section className="rounded-2xl border border-gray-200 bg-white p-5">
                    <h2 className="font-bold text-lg text-gray-900 leading-tight mb-4">学習グラフ（全体）</h2>
                    {showLeft && showRight ? (
                        <div className="grid grid-cols-2 gap-8">
                            <HeatmapGrid panelLabel={labels.left} dates={state.dates} series={totalLeftSeries} />
                            <HeatmapGrid panelLabel={labels.right} dates={state.dates} series={totalRightSeries} />
                        </div>
                    ) : showLeft ? (
                        <div className="flex justify-center">
                            <HeatmapGrid panelLabel={labels.left} dates={state.dates} series={totalLeftSeries} />
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <HeatmapGrid panelLabel={labels.right} dates={state.dates} series={totalRightSeries} />
                        </div>
                    )}
                </section>

                <section className="space-y-3">
                    {state.units.length === 0 && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-gray-400 text-center">データがありません</div>
                    )}
                    {state.units.map(unit => {
                        const leftSeries = showLeft
                            ? buildSeriesByUnit(metricsIndex, 'left', unit.leftUnitKey, state.dateKeys)
                            : [];
                        const rightSeries = showRight
                            ? buildSeriesByUnit(metricsIndex, 'right', unit.rightUnitKey, state.dateKeys)
                            : [];

                        return (
                            <section key={unit.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                                <h3 className="font-bold text-lg text-gray-900 leading-tight mb-2">{unit.title}</h3>
                                {showLeft && showRight ? (
                                    <div className="grid grid-cols-2 gap-8">
                                        <HeatmapGrid panelLabel={labels.left} dates={state.dates} series={leftSeries} />
                                        <HeatmapGrid panelLabel={labels.right} dates={state.dates} series={rightSeries} />
                                    </div>
                                ) : showLeft ? (
                                    <div className="flex justify-center">
                                        <HeatmapGrid panelLabel={labels.left} dates={state.dates} series={leftSeries} />
                                    </div>
                                ) : (
                                    <div className="flex justify-center">
                                        <HeatmapGrid panelLabel={labels.right} dates={state.dates} series={rightSeries} />
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </section>
            </main>
        </div>
    );
};
