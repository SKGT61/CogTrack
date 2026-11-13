import React from 'react';
import { PieChart, BookOpen, Sigma, Cpu, Layers, Sparkles } from 'lucide-react';
import { MacroDomainMetric } from '../utils/analytics';
import { MacroDomainId } from '../types/learning';

interface CategoryDistributionProps {
  metrics: MacroDomainMetric[];
  onSelectCategory?: (catId: MacroDomainId) => void;
}

export const CategoryDistribution: React.FC<CategoryDistributionProps> = ({
  metrics,
  onSelectCategory,
}) => {
  const getCategoryIcon = (id: MacroDomainId) => {
    switch (id) {
      case 'formal_quantitative':
        return <Sigma className="w-4 h-4 text-violet-400" />;
      case 'linguistic_communication':
        return <BookOpen className="w-4 h-4 text-sky-400" />;
      case 'technological_applied':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'conceptual_normative_social':
        return <Layers className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-rose-400" />;
    }
  };

  const getBarColor = (id: MacroDomainId) => {
    switch (id) {
      case 'formal_quantitative':
        return 'bg-violet-400';
      case 'linguistic_communication':
        return 'bg-sky-400';
      case 'technological_applied':
        return 'bg-emerald-400';
      case 'conceptual_normative_social':
        return 'bg-amber-400';
      default:
        return 'bg-rose-400';
    }
  };

  const totalHours = metrics.reduce((sum, m) => sum + m.totalHours, 0);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Distribución por Dominios de Aprendizaje</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Equilibrio formativo entre ciencias exactas, idiomas, computación y áreas conceptuales.
          </p>
        </div>
        <div className="text-right font-mono tabular-nums text-xs text-slate-400">
          <strong className="text-white text-sm">{totalHours.toFixed(1)}h</strong> totales
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="my-3">
        <div className="h-3 w-full bg-slate-800 rounded-full flex overflow-hidden">
          {metrics.map((m) => (
            <div
              key={m.categoryId}
              className={`${getBarColor(m.categoryId)} transition-all duration-300 h-full`}
              style={{ width: `${m.percentage}%` }}
              title={`${m.name}: ${m.percentage}% (${m.totalHours}h)`}
            />
          ))}
        </div>
      </div>

      {/* Domain breakdown items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
        {metrics.map((m) => (
          <button
            key={m.categoryId}
            type="button"
            onClick={() => onSelectCategory && onSelectCategory(m.categoryId)}
            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800 shrink-0">
                {getCategoryIcon(m.categoryId)}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-200 block truncate group-hover:text-indigo-300 transition-colors">
                  {m.name}
                </span>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums block">
                  {m.sessionCount} sesiones
                </span>
              </div>
            </div>

            <div className="text-right shrink-0 pl-2">
              <span className="text-sm font-bold text-white font-mono tabular-nums block">
                {m.percentage}%
              </span>
              <span className="text-[11px] text-slate-400 font-mono tabular-nums block">
                {m.totalHours}h
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
