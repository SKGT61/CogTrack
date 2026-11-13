import React, { useState } from 'react';
import { Search, Filter, Trash2, Calendar, Award, BookOpen, Clock, X, ChevronRight, Zap } from 'lucide-react';
import { DailyStudyLog, LearningDomain, MacroDomainId, ActivityType } from '../types/learning';
import { MathRenderer } from './MathRenderer';

interface DailyLogFeedProps {
  logs: DailyStudyLog[];
  domains: LearningDomain[];
  selectedDateFilter: string | null;
  onClearDateFilter: () => void;
  onDeleteLog: (logId: string) => void;
  onOpenLogModal: () => void;
}

export const DailyLogFeed: React.FC<DailyLogFeedProps> = ({
  logs,
  domains,
  selectedDateFilter,
  onClearDateFilter,
  onDeleteLog,
  onOpenLogModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState<string>('all');
  const [selectedMacroDomain, setSelectedMacroDomain] = useState<MacroDomainId | 'all'>('all');

  const domainsMap = new Map<string, LearningDomain>(domains.map((d) => [d.id, d]));

  const getActivityTypeLabel = (type: ActivityType) => {
    switch (type) {
      case 'high_performance_exam':
        return 'Examen Adaptativo (3 Fases)';
      case 'srs_warmup':
        return 'Repaso Espaciado (SRS)';
      case 'exercises':
        return 'Resolución de Problemas';
      case 'theory':
        return 'Estudio Teórico';
      case 'flashcards':
        return 'Flashcards & Vocabulario';
      case 'coding_lab':
        return 'Laboratorio de Código';
      case 'reading':
        return 'Lectura de Papers / Libros';
      case 'speaking':
        return 'Práctica Oral / Conversación';
      case 'review':
        return 'Consolidación Semanal';
      default:
        return 'Sesión de Estudio';
    }
  };

  const getComprehensionLabel = (score: number) => {
    switch (score) {
      case 5:
        return { label: 'Dominio Fluido', color: 'text-emerald-400' };
      case 4:
        return { label: 'Sólido', color: 'text-indigo-400' };
      case 3:
        return { label: 'Bueno', color: 'text-sky-400' };
      case 2:
        return { label: 'Básico', color: 'text-amber-400' };
      default:
        return { label: 'Requiere Repaso', color: 'text-rose-400' };
    }
  };

  // Filter logs
  const filteredLogs = logs
    .filter((log) => {
      if (selectedDateFilter && log.date !== selectedDateFilter) return false;
      if (selectedDomainId !== 'all' && log.subjectId !== selectedDomainId) return false;

      if (selectedMacroDomain !== 'all') {
        const dom = domainsMap.get(log.subjectId);
        if (!dom || dom.macroDomainId !== selectedMacroDomain) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const dom = domainsMap.get(log.subjectId);
        const matchTopic = log.topicsCovered.toLowerCase().includes(q);
        const matchOutput = log.outputSummary.toLowerCase().includes(q);
        const matchTakeaway = log.keyTakeaway?.toLowerCase().includes(q) || false;
        const matchDom = dom ? dom.name.toLowerCase().includes(q) : false;
        return matchTopic || matchOutput || matchTakeaway || matchDom;
      }

      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Top Bar with Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">Registro Diario de Avances</h3>
          <p className="text-xs text-slate-400 mt-1">
            Historial de sesiones deliberadas, niveles de Bloom alcanzados y fórmulas en LaTeX.
          </p>
        </div>

        <button
          onClick={onOpenLogModal}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer self-start sm:self-auto shadow-sm"
        >
          + Registrar Sesión
        </button>
      </div>

      {/* Date Filter Alert */}
      {selectedDateFilter && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>
              Filtrando sesiones del día:{' '}
              <strong className="font-mono tabular-nums text-white">{selectedDateFilter}</strong>
            </span>
          </div>
          <button
            onClick={onClearDateFilter}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Ver todas las fechas</span>
          </button>
        </div>
      )}

      {/* Search and Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por tema, LaTeX o aprendizaje..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Macro Domain filter */}
        <div>
          <select
            value={selectedMacroDomain}
            onChange={(e) => setSelectedMacroDomain(e.target.value as MacroDomainId | 'all')}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Todos los macro-dominios</option>
            <option value="formal_quantitative">Formal y Cuantitativo</option>
            <option value="linguistic_communication">Lingüístico y Comunicación</option>
            <option value="technological_applied">Tecnológico y Aplicado</option>
            <option value="conceptual_normative_social">Conceptual y Social</option>
            <option value="custom">Personalizados</option>
          </select>
        </div>

        {/* Domain filter */}
        <div>
          <select
            value={selectedDomainId}
            onChange={(e) => setSelectedDomainId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Todos los dominios específicos</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
          <p className="text-sm text-slate-400">No se encontraron sesiones con los filtros aplicados.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDomainId('all');
              setSelectedMacroDomain('all');
              onClearDateFilter();
            }}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {filteredLogs.map((log) => {
            const domain = domainsMap.get(log.subjectId);
            const comp = getComprehensionLabel(log.comprehensionScore);

            return (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
              >
                {/* Top line unboxed metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 mb-2 gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono tabular-nums text-slate-300 font-medium">
                      {log.date}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-indigo-400">
                      {domain ? domain.name : 'Dominio de Aprendizaje'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-400">
                      {getActivityTypeLabel(log.activityType)}
                    </span>
                    {log.bloomLevelAchieved && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-900/60 font-mono text-[10px]">
                          Bloom N{log.bloomLevelAchieved}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Time spent */}
                    <div className="flex items-center gap-1 text-slate-300 font-mono tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{log.durationMinutes} min</span>
                      <span className="text-slate-500">({(log.durationMinutes / 60).toFixed(1)}h)</span>
                    </div>

                    <span aria-hidden="true" className="text-slate-700">·</span>

                    {/* Comprehension */}
                    <span className={`text-[11px] font-medium ${comp.color}`}>
                      {comp.label} ({log.comprehensionScore}/5)
                    </span>

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Topics Covered with LaTeX */}
                <h4 className="text-sm font-semibold text-white mt-1">
                  <MathRenderer content={log.topicsCovered} />
                </h4>

                {/* Output Summary */}
                <div className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  <strong className="text-slate-400 font-normal">Resultado tangible:</strong>{' '}
                  <MathRenderer content={log.outputSummary} />
                </div>

                {/* Key takeaway */}
                {log.keyTakeaway && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-indigo-200/90 leading-relaxed">
                    <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide block mb-0.5">
                      Aprendizaje clave / Síntesis
                    </span>
                    <MathRenderer content={log.keyTakeaway} />
                  </div>
                )}

                {/* Notes if present */}
                {log.notes && (
                  <div className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    <MathRenderer content={log.notes} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
