import React from 'react';
import { Flame, Clock, Target, Award, ArrowUpRight } from 'lucide-react';
import { StreakInfo } from '../utils/analytics';
import { UserPreferences } from '../types/learning';

interface MetricCardsProps {
  streakInfo: StreakInfo;
  totalHours: number;
  totalSessions: number;
  weeklyHours: number;
  preferences: UserPreferences;
  avgComprehension: number;
  onOpenGoalsTab: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  streakInfo,
  totalHours,
  totalSessions,
  weeklyHours,
  preferences,
  avgComprehension,
  onOpenGoalsTab,
}) => {
  const weeklyTarget = preferences.weeklyGoalHours || 12;
  const weeklyPercent = Math.min(100, Math.round((weeklyHours / weeklyTarget) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Racha de Consistencia */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="font-medium text-slate-300">Racha de Consistencia</span>
          <Flame className={`w-4 h-4 ${streakInfo.currentStreak > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono tabular-nums tracking-tight">
              {streakInfo.currentStreak}
            </span>
            <span className="text-sm font-medium text-slate-400">días activos</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span>Récord personal: <strong className="font-mono tabular-nums text-slate-300">{streakInfo.bestStreak} días</strong></span>
            <span aria-hidden="true">·</span>
            <span>{streakInfo.totalActiveDays} días en total</span>
          </div>
        </div>
      </div>

      {/* 2. Tiempo Total de Estudio */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="font-medium text-slate-300">Tiempo Total Registrado</span>
          <Clock className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono tabular-nums tracking-tight">
              {totalHours.toFixed(1)}
            </span>
            <span className="text-sm font-medium text-slate-400">horas</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span>{totalSessions} sesiones</span>
            <span aria-hidden="true">·</span>
            <span>Promedio: <strong className="font-mono tabular-nums text-slate-300">{(totalHours / (totalSessions || 1) * 60).toFixed(0)} min/sesión</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Avance Semanal vs Meta */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="font-medium text-slate-300">Meta Semanal</span>
          <button 
            onClick={onOpenGoalsTab}
            title="Ver detalles de metas"
            className="text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono tabular-nums tracking-tight">
              {weeklyHours.toFixed(1)}
            </span>
            <span className="text-sm font-medium text-slate-400">/ {weeklyTarget}h objetivo</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${weeklyPercent}%` }}
              />
            </div>
            <div className="mt-1.5 text-xs text-slate-400 flex items-center justify-between">
              <span className="font-mono tabular-nums">{weeklyPercent}% completado</span>
              <span className="font-mono tabular-nums">faltan {Math.max(0, weeklyTarget - weeklyHours).toFixed(1)}h</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Índice de Comprensión y Dominio */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="font-medium text-slate-300">Nivel de Comprensión</span>
          <Award className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono tabular-nums tracking-tight">
              {avgComprehension.toFixed(1)}
            </span>
            <span className="text-sm font-medium text-slate-400">/ 5.0</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">
              {avgComprehension >= 4.0 ? 'Alta retención' : avgComprehension >= 3.0 ? 'Nivel óptimo' : 'Requiere consolidación'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Autoevaluación continua</span>
          </div>
        </div>
      </div>
    </div>
  );
};
