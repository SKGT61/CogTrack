import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Layers,
  Sparkles,
  Play,
  Clock,
  Award,
  CheckCircle2,
  ChevronRight,
  Eye,
  BookOpen,
  Target,
  RefreshCw,
  PlusCircle,
  Brain,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  FileText,
  ListChecks,
} from 'lucide-react';
import {
  LearningDomain,
  WeeklyStudyPlan,
  WeeklyStudyPlanDay,
  DomainDifficultyTrack,
  DifficultyLevel,
  DifficultyLessonItem,
  ConceptItem,
  BloomLevel,
  CoreExamProblem,
  CoreMCQQuestion,
} from '../types/learning';
import {
  getDifficultyName,
  getDifficultyDescription,
  getDifficultyBadgeColor,
  getBloomName,
  generateDifficultyTrackForDomain,
} from '../utils/pedagogicalEngine';
import { MathRenderer } from './MathRenderer';

interface LessonsHubViewProps {
  domains: LearningDomain[];
  selectedDomainId: string | null;
  onSelectDomainId: (id: string) => void;
  weeklyPlans: WeeklyStudyPlan[];
  difficultyTracks: DomainDifficultyTrack[];
  allConcepts: ConceptItem[];
  onSaveWeeklyPlan: (plan: WeeklyStudyPlan) => void;
  onSaveDifficultyTracks: (tracks: DomainDifficultyTrack[]) => void;
  onOpenWeeklyPlanModal: (domain: LearningDomain) => void;
  onLaunchWeeklySession: (
    domain: LearningDomain,
    dayName: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo',
    topic: string,
    bloomLevel: BloomLevel,
    isExtended: boolean,
    selectedConceptIds?: string[],
    preparedProblem?: CoreExamProblem,
    preparedMcqQuestions?: CoreMCQQuestion[]
  ) => void;
  onLaunchDifficultySession: (
    domain: LearningDomain,
    lesson: DifficultyLessonItem
  ) => void;
}

export const LessonsHubView: React.FC<LessonsHubViewProps> = ({
  domains,
  selectedDomainId,
  onSelectDomainId,
  weeklyPlans,
  difficultyTracks,
  allConcepts,
  onSaveWeeklyPlan,
  onSaveDifficultyTracks,
  onOpenWeeklyPlanModal,
  onLaunchWeeklySession,
  onLaunchDifficultySession,
}) => {
  const [activeMode, setActiveMode] = useState<'weekly' | 'difficulty'>('difficulty');
  const [selectedDifficultyTab, setSelectedDifficultyTab] = useState<DifficultyLevel>('basico');
  const [previewLesson, setPreviewLesson] = useState<DifficultyLessonItem | null>(null);

  // Active domain
  const activeDomain = useMemo(() => {
    if (selectedDomainId) {
      const found = domains.find((d) => d.id === selectedDomainId);
      if (found) return found;
    }
    return domains[0] || null;
  }, [domains, selectedDomainId]);

  // Active weekly plan
  const activeWeeklyPlan = useMemo(() => {
    if (!activeDomain) return null;
    return weeklyPlans.find((p) => p.domainId === activeDomain.id) || null;
  }, [weeklyPlans, activeDomain]);

  // Active difficulty track (auto-generate if missing for active domain)
  const activeDifficultyTrack = useMemo(() => {
    if (!activeDomain) return null;
    const existing = difficultyTracks.find((t) => t.domainId === activeDomain.id);
    if (existing) return existing;

    // Create a new deterministic track for this domain
    const newTrack = generateDifficultyTrackForDomain(activeDomain, allConcepts);
    return newTrack;
  }, [difficultyTracks, activeDomain, allConcepts]);

  // If active track was just generated dynamically, persist it
  React.useEffect(() => {
    if (activeDomain && activeDifficultyTrack) {
      const exists = difficultyTracks.some((t) => t.domainId === activeDomain.id);
      if (!exists) {
        onSaveDifficultyTracks([...difficultyTracks, activeDifficultyTrack]);
      }
    }
  }, [activeDomain?.id, activeDifficultyTrack, difficultyTracks, onSaveDifficultyTracks]);

  const handleRegenerateDifficultyTrack = () => {
    if (!activeDomain) return;
    const freshTrack = generateDifficultyTrackForDomain(activeDomain, allConcepts);
    const updated = [
      ...difficultyTracks.filter((t) => t.domainId !== activeDomain.id),
      freshTrack,
    ];
    onSaveDifficultyTracks(updated);
  };

  const getDayKey = (dayName: string): 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo' => {
    const lower = dayName.toLowerCase();
    if (lower.includes('lun')) return 'lunes';
    if (lower.includes('mar')) return 'martes';
    if (lower.includes('mi')) return 'miercoles';
    if (lower.includes('jue')) return 'jueves';
    if (lower.includes('vie')) return 'viernes';
    if (lower.includes('sáb') || lower.includes('sab')) return 'sabado';
    return 'domingo';
  };

  if (domains.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto my-12 space-y-3">
        <BookOpen className="w-10 h-10 mx-auto text-slate-500" />
        <h3 className="text-base font-bold text-white">No tienes dominios registrados aún</h3>
        <p className="text-xs text-slate-400">
          Crea tu primer dominio o disciplina de aprendizaje para acceder al Centro de Lecciones (por Plan Semanal o por Niveles de Dificultad).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Top Header & Navigation Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Centro de Lecciones Adaptativo</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Gestión Integral de Lecciones
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Elige entre la disciplina del <strong>Plan Semanal</strong> (Lunes a Domingo con Bloom y SRS) o la progresión autodirigida por <strong>Niveles de Dificultad</strong> (Básico a Experto evaluado por rúbrica de precisión).
          </p>
        </div>

        {/* Modalidad Switcher */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode('difficulty')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'difficulty'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Por Niveles de Dificultad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('weekly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'weekly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Plan Semanal</span>
          </button>
        </div>
      </div>

      {/* Domain Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs text-slate-500 font-mono uppercase shrink-0 mr-1">Dominio:</span>
        {domains.map((dom) => {
          const isSelected = activeDomain?.id === dom.id;
          return (
            <button
              key={dom.id}
              onClick={() => onSelectDomainId(dom.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 text-white border-indigo-500/80 shadow-sm font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{dom.name}</span>
              <span className="ml-1.5 text-[10px] text-slate-500">· {dom.subArea || dom.level}</span>
            </button>
          );
        })}
      </div>

      {/* MODE 1: NIVELES DE DIFICULTAD (BASICO, INTERMEDIO, AVANZADO, EXPERTO) */}
      {activeMode === 'difficulty' && activeDifficultyTrack && (
        <div className="space-y-5">
          {/* Difficulty Level Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(['basico', 'intermedio', 'avanzado', 'experto'] as DifficultyLevel[]).map((lvl) => {
              const isSelected = selectedDifficultyTab === lvl;
              const badgeColors = getDifficultyBadgeColor(lvl);
              const lessons = activeDifficultyTrack.levels[lvl] || [];
              const completedCount = lessons.filter((l) => l.completed).length;
              const totalCount = lessons.length;
              const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedDifficultyTab(lvl)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? `bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/30`
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}`}>
                      Nivel {getDifficultyName(lvl)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {completedCount}/{totalCount}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-200">
                    {pct === 100 ? 'Dominio Completado' : `${pct}% Dominado`}
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-1 mt-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct === 100 ? 'bg-emerald-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Level Header & Details Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono uppercase">
                  Nivel {getDifficultyName(selectedDifficultyTab)}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-300">
                  {getDifficultyDescription(selectedDifficultyTab)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Evaluación directa por <strong>dominio porcentual</strong> y <strong>rúbrica de precisión analítica</strong> (rigor conceptual, metodología paso a paso y verificación de casos).
              </p>
            </div>

            <button
              type="button"
              onClick={handleRegenerateDifficultyTrack}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              title="Regenerar la ruta de lecciones por dificultad según la base conceptual"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Regenerar Nivel</span>
            </button>
          </div>

          {/* Lessons List for Active Difficulty Level */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(activeDifficultyTrack.levels[selectedDifficultyTab] || []).map((lesson, idx) => {
              const isCompleted = Boolean(lesson.completed);
              const badge = getDifficultyBadgeColor(lesson.level);

              return (
                <div
                  key={lesson.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isCompleted
                      ? 'bg-slate-950/90 border-emerald-900/60 hover:border-emerald-700/80'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Lección #{idx + 1}
                      </span>
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Dominada ({lesson.completedScore || 85} pts)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono">
                          ⏱ {lesson.estimatedMinutes} min
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                      {lesson.title}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {lesson.objective}
                    </p>

                    {/* Rubric Criteria Tags */}
                    {lesson.rubricCriteria && lesson.rubricCriteria.length > 0 && (
                      <div className="pt-1 border-t border-slate-800/80 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-500 block">
                          Criterios de Precisión:
                        </span>
                        <ul className="text-[11px] text-slate-400 space-y-0.5">
                          {lesson.rubricCriteria.map((c, i) => (
                            <li key={i} className="truncate">• {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewLesson(lesson)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ver Detalles</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => activeDomain && onLaunchDifficultySession(activeDomain, lesson)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>{isCompleted ? 'Volver a Cursar' : 'Iniciar Lección'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: PLAN SEMANAL CRONOLÓGICO (LUNES A DOMINGO) */}
      {activeMode === 'weekly' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">
                  {activeWeeklyPlan ? activeWeeklyPlan.weekTitle : `Plan Semanal: ${activeDomain?.name}`}
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribución disciplinada de Lunes a Sábado con Taxonomía de Bloom progresiva y Domingo de Repaso Espaciado (SRS).
              </p>
            </div>

            {activeDomain && (
              <button
                type="button"
                onClick={() => onOpenWeeklyPlanModal(activeDomain)}
                className="px-3.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-200 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gestionar Plan Semanal Completo</span>
              </button>
            )}
          </div>

          {/* Days Grid */}
          {activeWeeklyPlan && activeWeeklyPlan.days && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {activeWeeklyPlan.days.map((day, idx) => {
                const isSun = day.dayName.toLowerCase().includes('domingo');
                const isCompleted = Boolean(day.completed);

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                      isCompleted
                        ? 'bg-slate-950/90 border-emerald-900/60'
                        : isSun
                        ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white font-mono">{day.dayName}</span>
                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Completada</span>
                          </span>
                        ) : isSun ? (
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono">
                            Repaso SRS
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800 text-[10px] font-mono">
                            Bloom Nivel {day.bloomLevel}
                          </span>
                        )}
                      </div>

                      <h5 className="text-xs font-bold text-slate-100 line-clamp-2">
                        {day.topic}
                      </h5>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {day.objective}
                      </p>
                    </div>

                    <div className="pt-2.5 mt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        ⏱ {day.estimatedMinutes} min
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          activeDomain &&
                          onLaunchWeeklySession(
                            activeDomain,
                            getDayKey(day.dayName),
                            day.topic,
                            day.bloomLevel,
                            day.isExtendedLesson,
                            day.customConceptIds,
                            day.preparedProblem,
                            day.preparedMcqQuestions
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow"
                      >
                        <Play className="w-3 h-3 fill-slate-950" />
                        <span>{isCompleted ? 'Repasar' : 'Iniciar'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUICK PREVIEW MODAL FOR DIFFICULTY LESSON */}
      {previewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getDifficultyBadgeColor(previewLesson.level).bg} ${getDifficultyBadgeColor(previewLesson.level).text} ${getDifficultyBadgeColor(previewLesson.level).border}`}>
                  Nivel {getDifficultyName(previewLesson.level)}
                </span>
                <span className="text-xs text-slate-400">⏱ {previewLesson.estimatedMinutes} min</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLesson(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{previewLesson.title}</h3>
              <p className="text-xs text-slate-300 mt-1">{previewLesson.objective}</p>
            </div>

            {/* Problem Statement Preview */}
            {previewLesson.preparedProblem && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white pb-1.5 border-b border-slate-800">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Problema Aplicado del Núcleo:</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <MathRenderer content={previewLesson.preparedProblem.problemStatement} />
                </div>
              </div>
            )}

            {/* Rubric Criteria */}
            {previewLesson.rubricCriteria && previewLesson.rubricCriteria.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rúbrica de Precisión Evaluada:</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-1">
                  {previewLesson.rubricCriteria.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewLesson(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeDomain) {
                    onLaunchDifficultySession(activeDomain, previewLesson);
                    setPreviewLesson(null);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Iniciar Sesión Ahora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
