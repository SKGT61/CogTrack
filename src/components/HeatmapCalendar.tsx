import React, { useState } from 'react';
import { Calendar, Info } from 'lucide-react';
import { HeatmapCell } from '../utils/analytics';

interface HeatmapCalendarProps {
  weeks: HeatmapCell[][];
  onSelectDate?: (dateStr: string) => void;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  weeks,
  onSelectDate,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    cell: HeatmapCell;
    x: number;
    y: number;
  } | null>(null);

  // Total active days in this matrix
  const totalDays = weeks.flatMap((w) => w);
  const activeDays = totalDays.filter((c) => c.totalMinutes > 0).length;
  const totalHoursMatrix = (totalDays.reduce((sum, c) => sum + c.totalMinutes, 0) / 60).toFixed(1);

  // Map intensity level to Tailwind classes
  const getCellClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-indigo-950 border-indigo-900/80 hover:border-indigo-600';
      case 2:
        return 'bg-indigo-800/80 border-indigo-700 hover:border-indigo-500';
      case 3:
        return 'bg-indigo-600 border-indigo-500 hover:border-indigo-400';
      case 4:
        return 'bg-indigo-400 border-indigo-300 hover:border-white';
      default:
        return 'bg-slate-900 border-slate-800/90 hover:border-slate-700';
    }
  };

  const dayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 relative">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">
              Matriz de Consistencia Diaria (Últimas 16 Semanas)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualización de densidad de estudio y constancia en el tiempo.
          </p>
        </div>

        {/* Aggregate summary unboxed metadata */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
          <span><strong className="text-white">{activeDays}</strong> días de estudio</span>
          <span aria-hidden="true">·</span>
          <span><strong className="text-white">{totalHoursMatrix}h</strong> acumuladas</span>
        </div>
      </div>

      {/* Grid container with overflow-x-auto for narrow screens */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex pl-6 mb-1 text-[11px] text-slate-500 font-mono">
            {weeks.map((week, idx) => (
              <div key={idx} className="w-3.5 mr-1 text-center shrink-0">
                {week[0]?.monthLabel || ''}
              </div>
            ))}
          </div>

          <div className="flex">
            {/* Days of week axis (show alternate) */}
            <div className="flex flex-col justify-between pr-2 text-[10px] text-slate-500 font-mono h-[108px] shrink-0">
              <span className="leading-3">Dom</span>
              <span className="leading-3">Mar</span>
              <span className="leading-3">Jue</span>
              <span className="leading-3">Sáb</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1 shrink-0">
                  {week.map((cell) => (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => onSelectDate && onSelectDate(cell.date)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredCell({
                          cell,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`w-3.5 h-3.5 rounded-sm border transition-colors cursor-pointer ${getCellClass(
                        cell.level
                      )}`}
                      aria-label={`${cell.date}: ${cell.totalMinutes} minutos`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800/80 mt-2">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Info className="w-3 h-3 text-slate-500" />
          <span>Haz clic en un día para filtrar su historial</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span>Menos</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-800" title="0 min" />
          <div className="w-2.5 h-2.5 rounded-sm bg-indigo-950 border border-indigo-900" title="1 - 30 min" />
          <div className="w-2.5 h-2.5 rounded-sm bg-indigo-800 border border-indigo-700" title="31 - 60 min" />
          <div className="w-2.5 h-2.5 rounded-sm bg-indigo-600 border border-indigo-500" title="61 - 120 min" />
          <div className="w-2.5 h-2.5 rounded-sm bg-indigo-400 border border-indigo-300" title="> 120 min" />
          <span>Más</span>
        </div>
      </div>

      {/* Interactive Tooltip fixed/floating */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 bg-slate-950 text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-700 shadow-xl max-w-xs"
          style={{ left: hoveredCell.x, top: hoveredCell.y }}
        >
          <div className="font-semibold text-white font-mono tabular-nums">
            {hoveredCell.cell.date}
          </div>
          <div className="text-slate-300 mt-0.5">
            {hoveredCell.cell.totalMinutes > 0 ? (
              <>
                <span className="font-semibold text-indigo-400 font-mono tabular-nums">
                  {hoveredCell.cell.totalMinutes} minutos
                </span>{' '}
                ({(hoveredCell.cell.totalMinutes / 60).toFixed(1)}h en {hoveredCell.cell.sessionCount} sesión{hoveredCell.cell.sessionCount > 1 ? 'es' : ''})
              </>
            ) : (
              <span className="text-slate-500">Sin sesiones registradas</span>
            )}
          </div>
          {hoveredCell.cell.domains && hoveredCell.cell.domains.length > 0 && (
            <div className="mt-1 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
              {hoveredCell.cell.domains.map((s, i) => (
                <div key={i} className="truncate">
                  {s.name} <span className="font-mono tabular-nums">({s.minutes}m)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
