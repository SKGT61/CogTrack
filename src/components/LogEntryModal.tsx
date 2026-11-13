import React, { useState } from 'react';
import { X, Clock, Calendar, CheckCircle2, Award, Zap } from 'lucide-react';
import { DailyStudyLog, LearningDomain, ActivityType, BloomLevel } from '../types/learning';
import { formatDateISO } from '../utils/analytics';
import { getBloomName } from '../utils/pedagogicalEngine';

interface LogEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  domains: LearningDomain[];
  initialDomainId?: string;
  initialDurationMinutes?: number;
  onSaveLog: (log: Omit<DailyStudyLog, 'id' | 'createdAt'>) => void;
}

export const LogEntryModal: React.FC<LogEntryModalProps> = ({
  isOpen,
  onClose,
  domains,
  initialDomainId,
  initialDurationMinutes,
  onSaveLog,
}) => {
  const todayStr = formatDateISO(new Date());

  const [subjectId, setSubjectId] = useState<string>(initialDomainId || domains[0]?.id || '');
  const [date, setDate] = useState<string>(todayStr);
  const [durationMinutes, setDurationMinutes] = useState<number>(initialDurationMinutes || 60);
  const [activityType, setActivityType] = useState<ActivityType>('exercises');
  const [bloomLevelAchieved, setBloomLevelAchieved] = useState<BloomLevel>(3);
  const [topicsCovered, setTopicsCovered] = useState<string>('');
  const [outputSummary, setOutputSummary] = useState<string>('');
  const [comprehensionScore, setComprehensionScore] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [keyTakeaway, setKeyTakeaway] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const quickDurations = [25, 45, 60, 90, 120];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicsCovered.trim() || !subjectId) return;

    onSaveLog({
      subjectId,
      date,
      durationMinutes: Number(durationMinutes) || 30,
      activityType,
      bloomLevelAchieved,
      topicsCovered: topicsCovered.trim(),
      outputSummary: outputSummary.trim() || 'Sesión de aprendizaje y avance conceptual completada.',
      comprehensionScore,
      keyTakeaway: keyTakeaway.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const getScoreDescription = (score: number) => {
    switch (score) {
      case 5:
        return 'Dominio excelente y autónomo (sin dudas)';
      case 4:
        return 'Sólido entendimiento conceptual (resuelto con soltura)';
      case 3:
        return 'Buen avance pero requirió consultar notas';
      case 2:
        return 'Comprensión inicial o vacilante (repasar pronto)';
      default:
        return 'Alta dificultad / Requiere repaso intensivo';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl my-8 p-6 shadow-2xl relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Registrar Avance Diario</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Documenta el tiempo invertido, nivel de Bloom y conclusiones de tu sesión.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Domain & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dominio de Aprendizaje
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.subArea})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fecha de la Sesión
              </label>
              <input
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Duration & Quick Picks */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Duración de Estudio (minutos)
              </label>
              <span className="text-xs text-indigo-400 font-mono tabular-nums">
                {(durationMinutes / 60).toFixed(1)} horas
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="720"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(5, parseInt(e.target.value) || 0))}
                required
                className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {quickDurations.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`px-2.5 py-1.5 text-xs font-mono rounded border transition-colors cursor-pointer ${
                      durationMinutes === mins
                        ? 'bg-indigo-500 text-slate-950 border-indigo-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tipo de Actividad
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'high_performance_exam', label: 'Examen Adaptativo' },
                { id: 'srs_warmup', label: 'Repaso SRS' },
                { id: 'exercises', label: 'Problemas' },
                { id: 'theory', label: 'Teoría' },
                { id: 'flashcards', label: 'Flashcards' },
                { id: 'coding_lab', label: 'Laboratorio' },
                { id: 'reading', label: 'Lectura' },
                { id: 'speaking', label: 'Oral / Audio' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActivityType(t.id as ActivityType)}
                  className={`px-3 py-2 text-xs rounded-lg border text-center transition-colors cursor-pointer ${
                    activityType === t.id
                      ? 'bg-indigo-950 border-indigo-500 text-indigo-300 font-medium'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bloom Taxonomy Level Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Nivel de la Taxonomía de Bloom Ejercitado
              </label>
              <span className="text-xs text-indigo-400 font-mono">
                {getBloomName(bloomLevelAchieved)}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {([1, 2, 3, 4, 5, 6] as BloomLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setBloomLevelAchieved(lvl)}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer text-center ${
                    bloomLevelAchieved === lvl
                      ? 'bg-indigo-500 text-slate-950 border-indigo-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  N{lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Topics Covered */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Temas / Subtemas abordados (admite LaTeX con $..$) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Teorema de Gauss en $\mathbb{R}^3$, Reducción SVD, Raft Consensus"
              value={topicsCovered}
              onChange={(e) => setTopicsCovered(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Tangible Output / Result */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Resultado Tangible / Métricas de la Sesión
            </label>
            <input
              type="text"
              placeholder="Ej. 8 problemas resueltos paso a paso, 50 kanjis repasados, pipeline async implementado"
              value={outputSummary}
              onChange={(e) => setOutputSummary(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Comprehension Rating */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Nivel de Comprensión y Soltura
              </label>
              <span className="text-xs text-indigo-300 font-medium">
                {getScoreDescription(comprehensionScore)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {([1, 2, 3, 4, 5] as const).map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setComprehensionScore(star)}
                  className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                    comprehensionScore === star
                      ? 'bg-indigo-500 text-slate-950 border-indigo-400'
                      : comprehensionScore > star
                      ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80'
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {star} / 5
                </button>
              ))}
            </div>
          </div>

          {/* Key Takeaway / Síntesis */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Aprendizaje Clave / Conclusión
            </label>
            <textarea
              rows={2}
              placeholder="¿Qué principio, regla mnemotécnica o patrón descubriste en esta sesión?"
              value={keyTakeaway}
              onChange={(e) => setKeyTakeaway(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
            />
          </div>

          {/* Actions */}
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
              Guardar Avance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
