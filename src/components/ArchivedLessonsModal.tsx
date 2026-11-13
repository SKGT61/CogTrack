import React, { useState, useMemo } from 'react';
import {
  X,
  Archive,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Award,
  BookOpen,
  Search,
  Eye,
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import { ArchivedLesson, LearningDomain } from '../types/learning';
import { getBloomName } from '../utils/pedagogicalEngine';
import { MathRenderer } from './MathRenderer';

interface ArchivedLessonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedLessons: ArchivedLesson[];
  domains: LearningDomain[];
  onDeleteLesson: (lessonId: string) => void;
  onUnarchiveLesson: (lessonId: string) => void;
  onViewLessonDetails: (lesson: ArchivedLesson) => void;
}

export const ArchivedLessonsModal: React.FC<ArchivedLessonsModalProps> = ({
  isOpen,
  onClose,
  archivedLessons,
  domains,
  onDeleteLesson,
  onUnarchiveLesson,
  onViewLessonDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null);

  // Filtered lessons
  const filteredLessons = useMemo(() => {
    return archivedLessons.filter((item) => {
      // Domain filter
      if (selectedDomainFilter !== 'all' && item.domainId !== selectedDomainFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'passed' && !item.passed) return false;
      if (statusFilter === 'failed' && item.passed) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTopic = item.topic.toLowerCase().includes(query);
        const matchesDomain = item.domainName.toLowerCase().includes(query);
        const matchesSubArea = (item.subArea || '').toLowerCase().includes(query);
        return matchesTopic || matchesDomain || matchesSubArea;
      }

      return true;
    });
  }, [archivedLessons, selectedDomainFilter, statusFilter, searchTerm]);

  // Group by date string (YYYY-MM-DD)
  const groupedByDate = useMemo(() => {
    const groups: Record<string, ArchivedLesson[]> = {};
    filteredLessons.forEach((lesson) => {
      const dateKey = lesson.date || (lesson.completedAt ? lesson.completedAt.split('T')[0] : 'Sin Fecha');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(lesson);
    });

    // Sort dates descending (newest first)
    const sortedDateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDateKeys.map((dateKey) => ({
      date: dateKey,
      lessons: groups[dateKey],
    }));
  }, [filteredLessons]);

  if (!isOpen) return null;

  // Metrics
  const totalCount = archivedLessons.length;
  const passedCount = archivedLessons.filter((l) => l.passed).length;
  const failedCount = totalCount - passedCount;
  const avgScore = totalCount > 0 ? Math.round(archivedLessons.reduce((acc, l) => acc + l.score, 0) / totalCount) : 0;
  const totalHours = Number((archivedLessons.reduce((acc, l) => acc + l.durationMinutes, 0) / 60).toFixed(1));

  const formatDateHeader = (dateStr: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (dateStr === today) return `Hoy (${dateStr})`;
      if (dateStr === yesterday) return `Ayer (${dateStr})`;
      const [y, m, d] = dateStr.split('-');
      if (y && m && d) {
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
        return dateObj.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-700/80 flex items-center justify-center text-amber-400 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Lecciones Archivadas por Fecha</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {archivedLessons.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Historial permanente de lecciones completadas (aprobadas y no aprobadas) con consulta detallada sin regeneración de IA.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top KPI Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-slate-800 bg-slate-950/40 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Total Archivadas</span>
            <span className="text-base font-bold text-white font-mono">{totalCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
            <span className="text-[11px] text-emerald-300 block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Aprobadas (≥70 pts)</span>
            </span>
            <span className="text-base font-bold text-emerald-400 font-mono">{passedCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60">
            <span className="text-[11px] text-amber-300 block flex items-center gap-1">
              <XCircle className="w-3 h-3 text-amber-400" />
              <span>No Aprobadas (&lt;70 pts)</span>
            </span>
            <span className="text-base font-bold text-amber-400 font-mono">{failedCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60">
            <span className="text-[11px] text-indigo-300 block">Promedio / Horas</span>
            <span className="text-base font-bold text-indigo-400 font-mono">
              {avgScore} pts · {totalHours}h
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por tema, dominio o sub-área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDomainFilter}
              onChange={(e) => setSelectedDomainFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todos los Dominios</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Estado: Todos</option>
              <option value="passed">Aprobadas</option>
              <option value="failed">No Aprobadas</option>
            </select>
          </div>
        </div>

        {/* Main Content: Grouped by Date */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {groupedByDate.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-slate-400 space-y-3">
              <Archive className="w-10 h-10 mx-auto text-slate-600" />
              <div className="text-sm font-semibold text-slate-300">No hay lecciones archivadas</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Al completar cualquier lección pedagógica (incluso si no se logra aprobar), se archivará automáticamente aquí organizada por fecha para tu consulta y análisis.
              </p>
            </div>
          ) : (
            groupedByDate.map((group) => (
              <div key={group.date} className="space-y-3">
                {/* Date separator header */}
                <div className="flex items-center gap-2 pb-1 border-b border-slate-800 text-xs font-mono">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-bold text-slate-200 capitalize">{formatDateHeader(group.date)}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({group.lessons.length} lección{group.lessons.length > 1 ? 'es' : ''})
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {group.lessons.map((lesson) => {
                    const isPassed = lesson.passed;
                    const isConfirmingDelete = confirmDeleteId === lesson.id;
                    const isSummaryExpanded = expandedSummaryId === lesson.id;
                    const timeStr = formatTime(lesson.completedAt);

                    return (
                      <div
                        key={lesson.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isPassed
                            ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950/90 border-amber-900/40 hover:border-amber-800/60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="font-semibold text-indigo-300">{lesson.domainName}</span>
                              {lesson.subArea && (
                                <>
                                  <span className="text-slate-600">·</span>
                                  <span className="text-slate-400">{lesson.subArea}</span>
                                </>
                              )}
                              {timeStr && (
                                <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1 ml-auto sm:ml-0">
                                  <Clock className="w-3 h-3" />
                                  <span>{timeStr}</span>
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">{lesson.topic}</span>
                            </h4>

                            {/* Status & Bloom Badges */}
                            <div className="flex items-center gap-2 flex-wrap pt-0.5">
                              {/* Score and Pass/Fail badge - explicitly showing even failed are archived */}
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold flex items-center gap-1 border ${
                                  isPassed
                                    ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300'
                                    : 'bg-rose-950/80 border-rose-700/80 text-rose-300'
                                }`}
                              >
                                {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                <span>{isPassed ? 'Aprobada' : 'No Aprobada'} ({lesson.score}/100 pts)</span>
                              </span>

                              {lesson.lessonMode === 'difficulty' ? (
                                <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/80 text-[10px] font-mono flex items-center gap-1 uppercase font-semibold">
                                  <Layers className="w-3 h-3 text-indigo-400" />
                                  <span>Nivel: {lesson.difficultyLevel || 'Estándar'}</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-mono flex items-center gap-1">
                                  <Award className="w-3 h-3 text-indigo-400" />
                                  <span>Bloom: {getBloomName(lesson.bloomMastery || lesson.bloomLevel || 3)}</span>
                                </span>
                              )}

                              {lesson.precisionRubric && (
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800 text-[10px] font-mono">
                                  Rúbrica: {lesson.precisionRubric.conceptualRigor + lesson.precisionRubric.methodology + lesson.precisionRubric.accuracy}/100%
                                </span>
                              )}

                              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-mono">
                                ⏱ {lesson.durationMinutes} min
                              </span>

                              {lesson.dayName && lesson.lessonMode !== 'difficulty' && (
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-mono capitalize">
                                  {lesson.dayName}
                                </span>
                              )}
                            </div>

                            {/* Evaluation Summary preview */}
                            {lesson.evaluation?.summary && (
                              <div className="pt-2 text-xs text-slate-400 leading-relaxed">
                                <p className={isSummaryExpanded ? '' : 'line-clamp-2'}>
                                  {lesson.evaluation.summary}
                                </p>
                                {lesson.evaluation.summary.length > 140 && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedSummaryId(isSummaryExpanded ? null : lesson.id)}
                                    className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-0.5 flex items-center gap-0.5 cursor-pointer font-medium"
                                  >
                                    <span>{isSummaryExpanded ? 'Ver menos' : 'Leer retroalimentación completa'}</span>
                                    {isSummaryExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons for this Archived Lesson */}
                          <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                            {/* View complete lesson (Read-only, NO AI buttons) */}
                            <button
                              type="button"
                              onClick={() => onViewLessonDetails(lesson)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-200 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                              title="Revisar el problema, preguntas y retroalimentación de esta lección archivada"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Ver Detalles</span>
                            </button>

                            {/* Unarchive Lesson */}
                            <button
                              type="button"
                              onClick={() => onUnarchiveLesson(lesson.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Des-archivar lección para volver a cursarla o reactivarla en el plan de estudios"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                              <span>Des-archivar</span>
                            </button>

                            {/* Delete Archived Lesson */}
                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1 bg-rose-950/90 p-1 rounded-lg border border-rose-800">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteLesson(lesson.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold cursor-pointer"
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1.5 py-1 text-slate-400 hover:text-white text-[11px] cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(lesson.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar lección archivada permanentemente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Al revisar lecciones archivadas, los botones de regeneración de IA se encuentran desactivados exclusivamente.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
