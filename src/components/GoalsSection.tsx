import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, Clock, Calendar, Check, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Goal, MacroDomainId, LearningDomain } from '../types/learning';
import { MACRO_DOMAINS } from '../data/initialData';

interface GoalsSectionProps {
  goals: Goal[];
  domains: LearningDomain[];
  onAddGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateGoalProgress: (goalId: string, delta: number) => void;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  goals,
  domains,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onUpdateGoalProgress,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<MacroDomainId | 'all'>('all');
  const [activeMenuGoalId, setActiveMenuGoalId] = useState<string | null>(null);

  const domainsMap = new Map<string, LearningDomain>(domains.map((d) => [d.id, d]));

  const filteredGoals = goals.filter((g) => {
    if (activeCategoryFilter === 'all') return true;
    return g.category === activeCategoryFilter;
  });

  const getCategoryLabel = (cat: MacroDomainId | 'all') => {
    if (cat === 'all') return 'Global';
    const found = MACRO_DOMAINS.find((m) => m.id === cat);
    return found ? found.shortLabel : 'Personalizado';
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily':
        return 'Diario';
      case 'weekly':
        return 'Semanal';
      case 'monthly':
        return 'Mensual';
      case 'milestone':
        return 'Hito clave';
      default:
        return 'Meta';
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Metas Personalizadas de Aprendizaje</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Objetivos cuantitativos y compromisos semanales vinculados directamente al motor de evaluación adaptativa.
          </p>
        </div>

        <button
          onClick={onAddGoal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Meta</span>
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800/80 mb-5 overflow-x-auto">
        <button
          onClick={() => setActiveCategoryFilter('all')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeCategoryFilter === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Todas ({goals.length})
        </button>
        <button
          onClick={() => setActiveCategoryFilter('formal_quantitative')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeCategoryFilter === 'formal_quantitative'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ciencias Exactas
        </button>
        <button
          onClick={() => setActiveCategoryFilter('linguistic_communication')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeCategoryFilter === 'linguistic_communication'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Idiomas y Letras
        </button>
        <button
          onClick={() => setActiveCategoryFilter('technological_applied')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeCategoryFilter === 'technological_applied'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Computación y Code
        </button>
        <button
          onClick={() => setActiveCategoryFilter('conceptual_normative_social')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeCategoryFilter === 'conceptual_normative_social'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Conceptual y Social
        </button>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg">
          <p className="text-sm text-slate-400">No hay metas activas en este dominio.</p>
          <button
            onClick={onAddGoal}
            className="mt-3 px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear la primera meta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentValue / (goal.targetValue || 1)) * 100));
            const isCompleted = percent >= 100;
            const domain = goal.subjectId ? domainsMap.get(goal.subjectId) : null;

            return (
              <div
                key={goal.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between relative group hover:border-slate-700 transition-colors"
              >
                {/* Top unboxed metadata line */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-medium">
                      {getFrequencyLabel(goal.frequency)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{getCategoryLabel(goal.category)}</span>
                    {domain && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate max-w-[150px] text-slate-400">{domain.name}</span>
                      </>
                    )}
                  </div>

                  {/* Actions menu toggle */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenuGoalId(activeMenuGoalId === goal.id ? null : goal.id)
                      }
                      className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer rounded"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {activeMenuGoalId === goal.id && (
                      <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-20 w-32">
                        <button
                          onClick={() => {
                            setActiveMenuGoalId(null);
                            onEditGoal(goal);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-left"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuGoalId(null);
                            onDeleteGoal(goal.id);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Goal Title */}
                <h4 className="text-sm font-semibold text-white leading-snug">
                  {goal.title}
                </h4>

                {/* Progress bar and values */}
                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono tabular-nums text-white font-bold text-base">
                        {goal.currentValue}
                      </span>
                      <span className="text-slate-400">
                        / {goal.targetValue} {goal.unit}
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-xs font-semibold text-indigo-400">
                      {percent}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Bottom row: deadline and micro progress actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                    {goal.deadline ? (
                      <>
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Vence: <strong className="font-mono tabular-nums text-slate-400">{goal.deadline}</strong></span>
                      </>
                    ) : (
                      <span>Objetivo continuo</span>
                    )}
                  </div>

                  {/* Micro adjustment buttons */}
                  <div className="flex items-center gap-1.5">
                    {!isCompleted ? (
                      <>
                        <button
                          onClick={() => onUpdateGoalProgress(goal.id, 1)}
                          className="px-2 py-1 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-200 transition-colors cursor-pointer"
                          title="Añadir 1 unidad de progreso"
                        >
                          +1 {goal.targetType === 'hours' ? 'h' : ''}
                        </button>
                        {goal.targetType === 'hours' && (
                          <button
                            onClick={() => onUpdateGoalProgress(goal.id, 0.5)}
                            className="px-2 py-1 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-200 transition-colors cursor-pointer"
                            title="Añadir media hora"
                          >
                            +0.5h
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                        <Check className="w-3.5 h-3.5" />
                        Meta Alcanzada
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
