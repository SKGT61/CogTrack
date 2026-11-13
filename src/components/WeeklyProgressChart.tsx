import React from 'react';
import { BarChart3 } from 'lucide-react';
import { DayActivity } from '../utils/analytics';

interface WeeklyProgressChartProps {
  days: DayActivity[];
  dailyTargetMinutes: number;
  onSelectDate?: (dateStr: string) => void;
}

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({
  days,
  dailyTargetMinutes,
  onSelectDate,
}) => {
  const dailyTargetHours = Number((dailyTargetMinutes / 60).toFixed(1));
  const maxHours = Math.max(...days.map((d) => d.totalHours), dailyTargetHours, 2.5);

  const totalWeekMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);
  const totalWeekHours = (totalWeekMinutes / 60).toFixed(1);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Progreso Semanal Actual</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Horas diarias frente al objetivo de{' '}
            <strong className="text-slate-200 font-mono tabular-nums">{dailyTargetHours}h/día</strong>.
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white font-mono tabular-nums">
            {totalWeekHours}h
          </div>
          <div className="text-[11px] text-slate-500">acumuladas esta semana</div>
        </div>
      </div>

      {/* Chart container */}
      <div className="pt-6 pb-2">
        <div className="h-40 flex items-end justify-between gap-2 sm:gap-4 relative border-b border-slate-800">
          {/* Target Reference Line */}
          <div
            className="absolute left-0 right-0 border-b border-dashed border-indigo-400/40 pointer-events-none z-10 flex items-center justify-end"
            style={{ bottom: `${(dailyTargetHours / maxHours) * 100}%` }}
          >
            <span className="text-[10px] font-mono tabular-nums text-indigo-300 bg-slate-950/80 px-1 rounded -translate-y-2">
              Meta: {dailyTargetHours}h
            </span>
          </div>

          {/* Day Bars */}
          {days.map((day) => {
            const heightPercent = maxHours > 0 ? Math.min(100, (day.totalHours / maxHours) * 100) : 0;
            const reachedTarget = day.totalMinutes >= dailyTargetMinutes;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onClick={() => onSelectDate && onSelectDate(day.date)}
              >
                {/* Floating tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 pointer-events-none text-center">
                  <span className="text-[10px] font-mono tabular-nums text-white bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap shadow-md">
                    {day.totalHours}h ({day.totalMinutes}m)
                  </span>
                </div>

                {/* The Bar */}
                <div className="w-full max-w-[36px] bg-slate-800/80 rounded-t-sm flex items-end overflow-hidden h-full">
                  <div
                    className={`w-full transition-all duration-300 rounded-t-sm ${
                      day.isToday
                        ? reachedTarget
                          ? 'bg-indigo-400'
                          : 'bg-indigo-500/80'
                        : reachedTarget
                        ? 'bg-emerald-500/90'
                        : day.totalMinutes > 0
                        ? 'bg-indigo-600/70'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${Math.max(4, heightPercent)}%` }}
                  />
                </div>

                {/* Day label */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-xs font-mono block ${
                      day.isToday
                        ? 'text-indigo-400 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {day.dayLabel}
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-500 block">
                    {day.date.split('-')[2]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/90" />
            <span>Meta superada</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-600/70" />
            <span>En progreso</span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Semana en curso</span>
      </div>
    </div>
  );
};
