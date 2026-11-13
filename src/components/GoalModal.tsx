import React, { useState } from 'react';
import { X, Target } from 'lucide-react';
import { Goal, MacroDomainId, GoalFrequency, GoalTargetType, LearningDomain } from '../types/learning';
import { MACRO_DOMAINS } from '../data/initialData';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  domains: LearningDomain[];
  goalToEdit?: Goal | null;
  onSaveGoal: (goal: Omit<Goal, 'id' | 'createdAt'>, goalId?: string) => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  domains,
  goalToEdit,
  onSaveGoal,
}) => {
  const [title, setTitle] = useState(goalToEdit?.title || '');
  const [category, setCategory] = useState<MacroDomainId | 'all'>(goalToEdit?.category || 'all');
  const [subjectId, setSubjectId] = useState<string>(goalToEdit?.subjectId || '');
  const [frequency, setFrequency] = useState<GoalFrequency>(goalToEdit?.frequency || 'weekly');
  const [targetType, setTargetType] = useState<GoalTargetType>(goalToEdit?.targetType || 'hours');
  const [targetValue, setTargetValue] = useState<number>(goalToEdit?.targetValue || 10);
  const [currentValue, setCurrentValue] = useState<number>(goalToEdit?.currentValue || 0);
  const [unit, setUnit] = useState<string>(goalToEdit?.unit || 'horas');
  const [deadline, setDeadline] = useState<string>(goalToEdit?.deadline || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveGoal(
      {
        title: title.trim(),
        category,
        subjectId: subjectId || undefined,
        frequency,
        targetType,
        targetValue: Number(targetValue) || 1,
        currentValue: Number(currentValue) || 0,
        unit: unit.trim() || 'unidades',
        deadline: deadline || undefined,
        status: 'active',
      },
      goalToEdit?.id
    );

    onClose();
  };

  const handleTargetTypeChange = (type: GoalTargetType) => {
    setTargetType(type);
    if (type === 'hours') setUnit('horas');
    else if (type === 'exercises') setUnit('problemas resueltos');
    else if (type === 'sessions') setUnit('sesiones de alto rendimiento');
    else if (type === 'milestones') setUnit('hitos verificados');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">
              {goalToEdit ? 'Editar Meta Personalizada' : 'Nueva Meta de Aprendizaje'}
            </h3>
            <p className="text-xs text-slate-400">
              Define metas cuantitativas vinculadas al motor de evaluación y a tus dominios.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título de la Meta <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Resolver 30 problemas avanzados con LaTeX, 14 horas semanales de estudio"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Macro-Dominio
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MacroDomainId | 'all')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Todos los dominios (Global)</option>
                <option value="formal_quantitative">Formal y Cuantitativo</option>
                <option value="linguistic_communication">Lingüístico y Comunicación</option>
                <option value="technological_applied">Tecnológico y Aplicado</option>
                <option value="conceptual_normative_social">Conceptual y Social</option>
                <option value="custom">Personalizados</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dominio Específico (Opcional)
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Cualquiera / General</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Frecuencia / Cadencia
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as GoalFrequency)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="weekly">Semanal</option>
                <option value="daily">Diaria</option>
                <option value="monthly">Mensual</option>
                <option value="milestone">Hito único</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo de Métrica
              </label>
              <select
                value={targetType}
                onChange={(e) => handleTargetTypeChange(e.target.value as GoalTargetType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="hours">Horas de estudio</option>
                <option value="exercises">Ejercicios / Problemas</option>
                <option value="sessions">Sesiones de alto rendimiento</option>
                <option value="milestones">Hitos verificados</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Valor Objetivo
              </label>
              <input
                type="number"
                min="0.5"
                step="any"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Progreso Inicial
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={currentValue}
                onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Etiqueta / Unidad
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Fecha Límite (Opcional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              {goalToEdit ? 'Guardar Cambios' : 'Crear Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
