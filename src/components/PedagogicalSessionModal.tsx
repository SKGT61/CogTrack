import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  Clock,
  Award,
  Zap,
  ArrowRight,
  Brain,
  Sparkles,
  BookOpen,
  Code2,
  Target,
  RefreshCw,
  HelpCircle,
  ListChecks,
  Archive,
  RotateCcw,
} from 'lucide-react';
import {
  LearningDomain,
  PedagogicalSession,
  EvaluationResult,
  BloomLevel,
  DailyStudyLog,
  ConceptItem,
  CoreExamProblem,
  CoreMCQQuestion,
  DifficultyLevel,
} from '../types/learning';
import { MathRenderer } from './MathRenderer';
import {
  generateHighPerformanceSession,
  evaluateStudentSubmissionLocally,
  getBloomName,
  regenerateLessonQuestionsLocally,
  getDifficultyName,
  getDifficultyBadgeColor,
  evaluateStudentSubmissionWithRubric,
} from '../utils/pedagogicalEngine';

interface PedagogicalSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: LearningDomain | null;
  dayName?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  customTopic?: string;
  targetBloomLevel?: BloomLevel;
  isExtendedLesson?: boolean;
  priorConcepts?: ConceptItem[];
  associatedConcepts?: ConceptItem[]; // Explicitly linked concepts (e.g., from custom lesson or table concepts)
  initialProblem?: CoreExamProblem;
  initialMcqQuestions?: CoreMCQQuestion[];
  lessonMode?: 'weekly' | 'difficulty';
  difficultyLevel?: DifficultyLevel;
  isArchived?: boolean;
  archivedDate?: string;
  archivedScore?: number;
  initialSession?: PedagogicalSession;
  initialEvaluation?: EvaluationResult | null;
  initialStudentAnswer?: string;
  initialStep?: SessionStep;
  onUnarchive?: () => void;
  onCompleteAndLinkToGoals: (
    session: PedagogicalSession,
    evaluation: EvaluationResult,
    durationMinutes: number,
    studentAnswer: string
  ) => void;
}

type SessionStep = 'warmup' | 'core' | 'feedback';

export const PedagogicalSessionModal: React.FC<PedagogicalSessionModalProps> = ({
  isOpen,
  onClose,
  domain,
  dayName = 'lunes',
  customTopic,
  targetBloomLevel,
  isExtendedLesson = false,
  priorConcepts = [],
  associatedConcepts = [],
  initialProblem,
  initialMcqQuestions,
  lessonMode = 'weekly',
  difficultyLevel,
  isArchived = false,
  archivedDate,
  archivedScore,
  initialSession,
  initialEvaluation,
  initialStudentAnswer,
  initialStep,
  onUnarchive,
  onCompleteAndLinkToGoals,
}) => {
  if (!isOpen || !domain) return null;

  const hasPriorConcepts = priorConcepts.length > 0;

  const [session, setSession] = useState<PedagogicalSession>(() => {
    if (initialSession) {
      return initialSession;
    }
    const base = generateHighPerformanceSession(
      domain,
      dayName,
      customTopic,
      targetBloomLevel,
      isExtendedLesson,
      priorConcepts,
      associatedConcepts
    );
    const configuredBase = {
      ...base,
      lessonMode: lessonMode || base.lessonMode,
      difficultyLevel: difficultyLevel || base.difficultyLevel,
    };
    if (initialProblem || (initialMcqQuestions && initialMcqQuestions.length > 0)) {
      return {
        ...configuredBase,
        core: {
          ...configuredBase.core,
          problem: initialProblem || configuredBase.core.problem,
          mcqQuestions: initialMcqQuestions || configuredBase.core.mcqQuestions,
        },
      };
    }
    return configuredBase;
  });

  const isWarmupActive = Boolean(hasPriorConcepts && session.isWarmupActive !== false && (session.warmup?.durationMinutes || 0) > 0);
  const [currentStep, setCurrentStep] = useState<SessionStep>(
    initialStep || (initialEvaluation ? 'feedback' : isWarmupActive ? 'warmup' : 'core')
  );
  const [warmupAnswers, setWarmupAnswers] = useState<Record<string, string>>({});
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [studentAnswer, setStudentAnswer] = useState<string>(initialStudentAnswer || '');
  const [showLatexPreview, setShowLatexPreview] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(initialEvaluation || null);
  const [isRegeneratingMCQ, setIsRegeneratingMCQ] = useState<boolean>(false);
  const [regenerateSuccessMsg, setRegenerateSuccessMsg] = useState<string | null>(null);
  const [regeneratedWithModel, setRegeneratedWithModel] = useState<string | null>(null);

  // Timers
  const initialMinutes = isWarmupActive ? 3 : (session.core?.durationMinutes || (isExtendedLesson ? 35 : 15));
  const [stepSecondsLeft, setStepSecondsLeft] = useState<number>(isArchived ? 0 : initialMinutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(!isArchived);
  const [totalTimeSpentSeconds, setTotalTimeSpentSeconds] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Regenerate session if domain, target or prior concepts change (DISABLED for archived lessons)
  useEffect(() => {
    if (isArchived) return;
    const fetchOrGenerate = async () => {
      let activeSession: PedagogicalSession | null = null;
      try {
        const res = await fetch('/api/pedagogical/generate-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domainName: domain.name,
            subArea: domain.subArea,
            macroDomainId: domain.macroDomainId,
            dayName,
            isSundaySRS: dayName === 'domingo',
            customTopic,
            targetBloomLevel,
            isExtended: isExtendedLesson,
            priorConcepts,
            associatedConcepts,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            activeSession = {
              ...json.data,
              id: `sess-${domain.id}-${Date.now()}`,
              domainId: domain.id,
              domainName: domain.name,
              macroDomainId: domain.macroDomainId,
              dayOfWeek: dayName,
              isSundaySRS: dayName === 'domingo',
              isExtendedLesson,
              isWarmupActive: hasPriorConcepts,
            };
          }
        }
      } catch (e) {
        console.warn('Falling back to local pedagogical engine:', e);
      }

      if (!activeSession) {
        activeSession = generateHighPerformanceSession(
          domain,
          dayName,
          customTopic,
          targetBloomLevel,
          isExtendedLesson,
          priorConcepts,
          associatedConcepts
        );
      }

      setSession(activeSession);
      const activeWarmup = Boolean(hasPriorConcepts && activeSession.isWarmupActive !== false && (activeSession.warmup?.durationMinutes || 0) > 0);
      setCurrentStep(activeWarmup ? 'warmup' : 'core');
      setWarmupAnswers({});
      setMcqAnswers({});
      setStudentAnswer('');
      setEvaluation(null);
      const initMin = activeWarmup ? 3 : (activeSession.core?.durationMinutes || (isExtendedLesson ? 35 : 15));
      setStepSecondsLeft(initMin * 60);
      setIsTimerRunning(true);
      setTotalTimeSpentSeconds(0);
    };

    fetchOrGenerate();
  }, [domain.id, dayName, customTopic, targetBloomLevel, isExtendedLesson, priorConcepts.length, associatedConcepts.length]);

  // Master Timer Tick (DISABLED if isArchived)
  useEffect(() => {
    if (isArchived) return;
    if (isTimerRunning && currentStep !== 'feedback') {
      timerRef.current = setInterval(() => {
        setStepSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
        setTotalTimeSpentSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, currentStep, isArchived]);

  // Step Switchers
  const handleProceedToCore = () => {
    setCurrentStep('core');
    const coreMinutes = session.core.durationMinutes || (session.isExtendedLesson ? 35 : 15);
    setStepSecondsLeft(coreMinutes * 60);
    setIsTimerRunning(true);
  };

  const handleRegenerateQuestionsWithGemini = async () => {
    setIsRegeneratingMCQ(true);
    setRegenerateSuccessMsg(null);

    const targetTopic = session.core?.problem?.title?.replace(/^Problema Aplicado en:\s*/i, '') || customTopic || domain.name;
    const sessionMinutes = session.core?.durationMinutes || session.estimatedMinutes || 25;
    const allAvailableConcepts = [...associatedConcepts, ...priorConcepts];

    try {
      const res = await fetch('/api/pedagogical/regenerate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: domain.name,
          macroDomainId: domain.macroDomainId,
          subArea: domain.subArea,
          conceptDatabaseKey: domain.conceptDatabaseKey,
          topic: targetTopic,
          bloomLevel: session.bloomFocus,
          sessionMinutes,
          isExtended: session.isExtendedLesson,
          databaseConcepts: allAvailableConcepts,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && Array.isArray(json.data.mcqQuestions) && json.data.mcqQuestions.length > 0) {
          setSession((prev) => ({
            ...prev,
            core: {
              ...prev.core,
              problem: json.data.problem || prev.core.problem,
              mcqQuestions: json.data.mcqQuestions,
            },
          }));
          setMcqAnswers({});
          setStudentAnswer('');
          setRegeneratedWithModel(json.data.model || 'Gemini 1.5 Flash');
          setRegenerateSuccessMsg(
            `¡${json.data.mcqQuestions.length} preguntas y "Problema aplicado en" regenerados con éxito mediante ${json.data.model || 'Gemini 1.5 Flash'}!`
          );
          setTimeout(() => setRegenerateSuccessMsg(null), 4500);
          setIsRegeneratingMCQ(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Error calling Gemini 1.5 Flash question regeneration API:', err);
    }

    // Local pedagogical engine fallback if API is unavailable or offline
    const localPackage = regenerateLessonQuestionsLocally(
      domain,
      targetTopic,
      session.bloomFocus,
      sessionMinutes,
      session.isExtendedLesson,
      allAvailableConcepts
    );

    setSession((prev) => ({
      ...prev,
      core: {
        ...prev.core,
        problem: localPackage.problem,
        mcqQuestions: localPackage.mcqQuestions,
      },
    }));
    setMcqAnswers({});
    setStudentAnswer('');
    setRegeneratedWithModel('Motor Pedagógico Local');
    setRegenerateSuccessMsg(`¡${localPackage.mcqQuestions.length} preguntas y "Problema aplicado en" regenerados según contexto pedagógico!`);
    setTimeout(() => setRegenerateSuccessMsg(null), 4500);
    setIsRegeneratingMCQ(false);
  };

  const handleEvaluateSubmission = async () => {
    setIsEvaluating(true);
    const durationMinutes = Math.max(
      5,
      Math.round(totalTimeSpentSeconds / 60)
    );

    // If lesson is in difficulty mode (without Bloom taxonomy), evaluate with Precision Rubric directly
    if (session.lessonMode === 'difficulty') {
      const rubricEval = evaluateStudentSubmissionWithRubric(
        session,
        studentAnswer,
        warmupAnswers,
        durationMinutes,
        mcqAnswers
      );
      setEvaluation(rubricEval);
      setCurrentStep('feedback');
      setIsEvaluating(false);
      return;
    }

    try {
      // Attempt server-side Gemini Evaluation
      const res = await fetch('/api/pedagogical/evaluate-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session,
          studentAnswer,
          warmupAnswers,
          mcqAnswers,
          timeSpentMinutes: durationMinutes,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setEvaluation(json.data);
          setCurrentStep('feedback');
          setIsEvaluating(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Server evaluation unavailable, applying local expert engine:', err);
    }

    // Local deterministic expert evaluation fallback
    const localEval = evaluateStudentSubmissionLocally(
      session,
      studentAnswer,
      warmupAnswers,
      durationMinutes,
      mcqAnswers
    );
    setEvaluation(localEval);
    setCurrentStep('feedback');
    setIsEvaluating(false);
  };

  const handleSaveAndLink = () => {
    if (!evaluation) return;
    const durationMinutes = Math.max(5, Math.round(totalTimeSpentSeconds / 60));
    onCompleteAndLinkToGoals(session, evaluation, durationMinutes, studentAnswer);
    onClose();
  };

  // Timer format display
  const minutes = Math.floor(stepSecondsLeft / 60);
  const seconds = stepSecondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-6 p-6 shadow-2xl relative text-left flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                Motor de Alto Rendimiento
              </span>
              {isArchived ? (
                <>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono flex items-center gap-1">
                    <Archive className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lección Archivada {archivedDate ? `(${archivedDate})` : ''}</span>
                  </span>
                  {archivedScore !== undefined && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded font-mono border ${
                        archivedScore >= 70
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}
                    >
                      {archivedScore}/100 pts · {archivedScore >= 70 ? 'Aprobada' : 'No aprobada'}
                    </span>
                  )}
                  {onUnarchive && (
                    <button
                      type="button"
                      onClick={() => {
                        onUnarchive();
                        onClose();
                      }}
                      className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-700/60 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Des-archivar lección para reactivarla en tu plan y habilitar la regeneración por IA"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>Des-archivar</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {session.isSundaySRS && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                      Domingo: Repaso Espaciado (SRS)
                    </span>
                  )}
                  {session.isExtendedLesson && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                      Plazo Extendido
                    </span>
                  )}
                </>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              {domain.name} <span className="text-slate-400 font-normal">· {domain.subArea}</span>
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High Performance 3-Phase Architecture Bar */}
        <div className="my-4 p-2 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {/* Step 1: Warmup */}
            <div
              onClick={() => isArchived && isWarmupActive && setCurrentStep('warmup')}
              className={`p-2 rounded-lg transition-all ${
                isArchived && isWarmupActive ? 'cursor-pointer hover:bg-slate-800' : ''
              } ${
                !isWarmupActive
                  ? 'bg-slate-950/40 border border-slate-900 text-slate-600 line-through'
                  : currentStep === 'warmup'
                  ? 'bg-indigo-900/60 border border-indigo-500 text-white font-semibold'
                  : currentStep === 'core' || currentStep === 'feedback'
                  ? 'bg-slate-900/50 text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                {isWarmupActive ? 'Paso 1 (3 min)' : 'Paso 1 (Inactivo)'}
              </div>
              <div className="truncate">
                {isWarmupActive ? 'Warm-up / SRS' : 'Warm-up (Sin conceptos)'}
              </div>
            </div>

            {/* Step 2: Core Exam */}
            <div
              onClick={() => isArchived && setCurrentStep('core')}
              className={`p-2 rounded-lg transition-all ${
                isArchived ? 'cursor-pointer hover:bg-slate-800' : ''
              } ${
                currentStep === 'core'
                  ? 'bg-indigo-900/60 border border-indigo-500 text-white font-semibold'
                  : currentStep === 'feedback'
                  ? 'bg-slate-900/50 text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                Paso 2 ({session.isExtendedLesson ? '35 min' : '10-15 min'})
              </div>
              <div className="truncate">Núcleo del Examen</div>
            </div>

            {/* Step 3: Feedback */}
            <div
              onClick={() => isArchived && evaluation && setCurrentStep('feedback')}
              className={`p-2 rounded-lg transition-all ${
                isArchived && evaluation ? 'cursor-pointer hover:bg-slate-800' : ''
              } ${
                currentStep === 'feedback'
                  ? 'bg-indigo-900/60 border border-indigo-500 text-white font-semibold'
                  : 'text-slate-500'
              }`}
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Paso 3 (2 min)</div>
              <div className="truncate">Métricas & Metas</div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* STEP 1: WARM-UP / SRS */}
          {currentStep === 'warmup' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60">
                <div className="text-xs text-indigo-200">
                  <span className="font-semibold block text-indigo-300">
                    Memoria de Trabajo & Activación Cognitiva
                  </span>
                  {session.warmup.instructions}
                </div>
                <div className="font-mono tabular-nums text-lg font-bold text-indigo-400 shrink-0 ml-3">
                  {timeFormatted}
                </div>
              </div>

              <div className="space-y-4">
                {session.warmup.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono">Pregunta {idx + 1} de {session.warmup.questions.length}</span>
                      <span className="text-slate-500">{q.conceptTested}</span>
                    </div>

                    <div className="text-sm font-medium text-white">
                      <MathRenderer content={q.question} />
                    </div>

                    {q.options && q.options.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = warmupAnswers[q.id] === opt;
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => setWarmupAnswers({ ...warmupAnswers, [q.id]: opt })}
                              className={`w-full p-2.5 rounded-lg text-left text-xs border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-950 border-indigo-500 text-white font-medium'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <MathRenderer content={opt} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleProceedToCore}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Continuar al Núcleo del Examen</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CORE EXAM & PROBLEM SOLVING */}
          {currentStep === 'core' && (
            <div className="space-y-4">
              {/* Notice if warmup was bypassed due to lack of prior concepts */}
              {!isWarmupActive && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
                  <Brain className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    <strong className="text-white">Calentamiento no activado:</strong> Este tema aún no cuenta con conceptos previos registrados (vistos, dominados o a reforzar). La sesión se enfoca directamente en la práctica deliberada del núcleo.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs">
                  <div className="text-slate-400">
                    {session.lessonMode === 'difficulty' ? 'Nivel de Dificultad:' : 'Objetivo Pedagógico:'}
                  </div>
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    {session.lessonMode === 'difficulty' ? (
                      <span className="font-mono text-indigo-300">
                        Nivel {getDifficultyName(session.difficultyLevel || difficultyLevel || 'intermedio')} (Evaluación por Precisión y Dominio)
                      </span>
                    ) : (
                      <span>{getBloomName(session.bloomFocus)}</span>
                    )}
                  </div>
                </div>
                <div className="font-mono tabular-nums text-lg font-bold text-amber-400 shrink-0 ml-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{timeFormatted}</span>
                </div>
              </div>

              {/* Problem statement card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{session.core.problem.title}</span>
                  </h4>
                  {!isArchived ? (
                    <button
                      type="button"
                      onClick={handleRegenerateQuestionsWithGemini}
                      disabled={isRegeneratingMCQ}
                      className="px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/70 hover:border-indigo-500 text-indigo-200 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 shrink-0 self-start sm:self-auto"
                      title="Regenerar el núcleo del examen (problema aplicado y preguntas) con Gemini 1.5 Flash"
                    >
                      {isRegeneratingMCQ ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                          <span>Regenerando Núcleo con Gemini 1.5 Flash...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Regenerar Núcleo con Gemini 1.5 Flash</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] text-amber-300/80 font-mono bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Archive className="w-3 h-3" />
                      <span>Modo archivado (IA desactivada)</span>
                    </span>
                  )}
                </div>

                {regenerateSuccessMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{regenerateSuccessMsg}</span>
                    </div>
                    {regeneratedWithModel && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700">
                        {regeneratedWithModel}
                      </span>
                    )}
                  </div>
                )}

                <div className="text-sm text-slate-200">
                  <MathRenderer content={session.core.problem.problemStatement} />
                </div>

                {/* Code snippet if programming domain */}
                {session.core.problem.codeSnippet && (
                  <div className="mt-2">
                    <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1">
                      <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Plantilla de Código:</span>
                    </div>
                    <MathRenderer content={`\`\`\`${session.core.problem.codeSnippet}\`\`\``} />
                  </div>
                )}

                {/* Test cases if applicable */}
                {session.core.problem.testCases && session.core.problem.testCases.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase font-mono">
                      Casos de Prueba Esperados:
                    </span>
                    <div className="space-y-1.5">
                      {session.core.problem.testCases.map((tc, i) => (
                        <div key={i} className="text-xs font-mono p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          <div><strong>Input:</strong> {tc.input}</div>
                          <div><strong>Esperado:</strong> <span className="text-emerald-400">{tc.expectedOutput}</span></div>
                          {tc.explanation && <div className="text-slate-500 text-[11px]">{tc.explanation}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Guiding Questions */}
                {session.core.problem.guidingQuestions && session.core.problem.guidingQuestions.length > 0 && (
                  <div className="mt-2 text-xs text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-300">Puntos a considerar en tu desarrollo:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      {session.core.problem.guidingQuestions.map((gq, i) => (
                        <li key={i}>{gq}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* NÚCLEO DEL EXAMEN: PREGUNTAS DE SELECCIÓN MÚLTIPLE (3-10 PREGUNTAS) */}
              {session.core.mcqQuestions && session.core.mcqQuestions.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ListChecks className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Núcleo del Examen: Preguntas de Selección Múltiple
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono">
                        {session.core.mcqQuestions.length} preguntas ({session.estimatedMinutes} min · Nivel Bloom {session.bloomFocus})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-[11px] font-mono text-slate-400 mr-1 hidden sm:block">
                        <span className="text-indigo-400 font-semibold">{Object.keys(mcqAnswers).length}</span> de {session.core.mcqQuestions.length} respondidas
                      </div>

                      {!isArchived ? (
                        <button
                          type="button"
                          onClick={handleRegenerateQuestionsWithGemini}
                          disabled={isRegeneratingMCQ}
                          className="px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/70 hover:border-indigo-500 text-indigo-200 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                          title="Regenerar las preguntas del examen y el problema aplicado utilizando Gemini 1.5 Flash"
                        >
                          {isRegeneratingMCQ ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                              <span>Regenerando con Gemini 1.5 Flash...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>Regenerar preguntas y problema con Gemini 1.5 Flash</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                          {session.core.mcqQuestions.length} preguntas archivadas
                        </span>
                      )}
                    </div>
                  </div>

                  {regenerateSuccessMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{regenerateSuccessMsg}</span>
                      </div>
                      {regeneratedWithModel && (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700">
                          {regeneratedWithModel}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-3.5">
                    {session.core.mcqQuestions.map((q, idx) => {
                      const selectedOpt = mcqAnswers[q.id];
                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700/80 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-mono font-semibold text-indigo-400">
                              Pregunta {idx + 1} de {session.core.mcqQuestions!.length}
                            </span>
                            {q.fromTable && (
                              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-mono flex items-center gap-1">
                                <span>📊 Basada en tabla de:</span>
                                <span className="font-semibold">{q.sourceConceptName}</span>
                              </span>
                            )}
                          </div>

                          <div className="text-sm font-medium text-white leading-relaxed">
                            <MathRenderer content={q.question} />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = selectedOpt === opt;
                              const letter = String.fromCharCode(65 + oIdx);
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => setMcqAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                                  className={`p-3 rounded-lg text-left text-xs border transition-all cursor-pointer flex items-start gap-2.5 ${
                                    isSelected
                                      ? 'bg-indigo-950/90 border-indigo-500 text-white font-medium ring-1 ring-indigo-500 shadow-sm'
                                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold ${
                                      isSelected
                                        ? 'bg-indigo-500 text-slate-950'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {letter}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <MathRenderer content={opt} />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Student Response Area - Contextualized strictly by Macro Domain */}
              {(() => {
                const isMath = domain.macroDomainId === 'formal_quantitative';
                const isLanguage = domain.macroDomainId === 'linguistic_communication';
                const isTech = domain.macroDomainId === 'technological_applied';
                const isSocial = domain.macroDomainId === 'conceptual_normative_social';

                const solutionLabel = isMath
                  ? 'Tu Solución, Desarrollo Analítico o Demostración Matemática (admite fórmulas LaTeX con $..$):'
                  : isLanguage
                  ? `Tu Redacción, Traducción o Respuesta en ${domain.name}:`
                  : isTech
                  ? `Tu Código Fuente, Algoritmo o Solución de Software (${domain.name}):`
                  : isSocial
                  ? `Tu Análisis Crítico, Dictamen o Fundamentación Conceptual (${domain.name}):`
                  : `Tu Solución, Propuesta o Desarrollo (${domain.name}):`;

                const solutionPlaceholder = isMath
                  ? 'Redacta tu solución analítica paso a paso. Para fórmulas y variables usa notación LaTeX limpia: ej. $\\vec{F} = m \\vec{a}$ o integrales $\\int x^2 dx$...'
                  : isLanguage
                  ? `Redacta tu respuesta en ${domain.name}. Escribe el texto, oraciones, kanji o análisis gramatical requerido...`
                  : isTech
                  ? `Escribe tu código fuente limpio, estructuras de datos, firmas o script en ${domain.name}. Considera casos extremos...`
                  : isSocial
                  ? `Desarrolla tu análisis crítico, diagnóstico fundamentado en normas o propuesta de viabilidad en ${domain.name}...`
                  : `Desarrolla tu respuesta o propuesta detallada para ${domain.name}...`;

                const previewButtonLabel = isMath
                  ? (showLatexPreview ? 'Ocultar Vista Previa LaTeX' : 'Mostrar Vista Previa LaTeX')
                  : (showLatexPreview ? 'Ocultar Vista Previa' : 'Mostrar Vista Previa');

                const previewHeader = isMath
                  ? 'Renderizado en vivo (LaTeX):'
                  : isTech
                  ? 'Vista previa de código:'
                  : 'Vista previa en vivo:';

                return (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        {solutionLabel}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowLatexPreview(!showLatexPreview)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        {previewButtonLabel}
                      </button>
                    </div>

                    <textarea
                      rows={5}
                      value={studentAnswer}
                      readOnly={isArchived}
                      onChange={(e) => !isArchived && setStudentAnswer(e.target.value)}
                      placeholder={solutionPlaceholder}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed ${
                        isArchived ? 'opacity-90 cursor-default bg-slate-950/90' : ''
                      }`}
                    />

                    {/* Live Preview */}
                    {showLatexPreview && studentAnswer.trim() && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                          {previewHeader}
                        </span>
                        <MathRenderer content={studentAnswer} />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Evaluation submit or review button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  {isArchived
                    ? 'Lección completada y archivada. Puedes revisar tu solución y las métricas de evaluación.'
                    : session.core.mcqQuestions && session.core.mcqQuestions.length > 0
                    ? `${Object.keys(mcqAnswers).length} de ${session.core.mcqQuestions.length} preguntas MCQ contestadas.`
                    : 'Completa tu desarrollo para calificar.'}
                </span>

                {isArchived ? (
                  <div className="flex items-center gap-2">
                    {evaluation && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep('feedback')}
                        className="px-4 py-2 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Award className="w-4 h-4" />
                        <span>Ver Evaluación Completa ({archivedScore !== undefined ? archivedScore : evaluation.score} pts)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                      Cerrar Revisión
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isEvaluating || (!studentAnswer.trim() && Object.keys(mcqAnswers).length === 0)}
                    onClick={handleEvaluateSubmission}
                    className="px-6 py-2.5 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Evaluando con Taxonomía de Bloom...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Enviar al Evaluador y Calificar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: FEEDBACK, BLOOM MASTERY & LINK TO GOALS */}
          {currentStep === 'feedback' && evaluation && (
            <div className="space-y-4">
              {/* Score and Bloom Level / Precision Rubric Header */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    {evaluation.evaluationType === 'precision_rubric'
                      ? 'Evaluación por Dominio y Rúbrica de Precisión'
                      : 'Resultado de Evaluación Adaptativa'}
                  </div>
                  <div className="text-2xl font-bold text-white font-mono tabular-nums mt-0.5">
                    {evaluation.score} <span className="text-sm font-normal text-slate-400">/ 100 % de dominio</span>
                  </div>
                  <div className="mt-1 text-xs text-indigo-400 font-semibold flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    {evaluation.evaluationType === 'precision_rubric' || session.lessonMode === 'difficulty' ? (
                      <span>
                        Nivel de Dificultad: {getDifficultyName(evaluation.difficultyAchieved || session.difficultyLevel || 'intermedio')} (Rúbrica de Precisión)
                      </span>
                    ) : (
                      <span>
                        Nivel de Bloom Dominado: Nivel {evaluation.bloomMastery} ({getBloomName(evaluation.bloomMastery)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs text-slate-400 block font-mono">Próximo Repaso SRS:</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    En {evaluation.srsRepetitionIntervalDays} día{evaluation.srsRepetitionIntervalDays > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* PRECISION RUBRIC 3-AXIS CARD (Rendered for difficulty lessons) */}
              {evaluation.precisionRubric && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Rúbrica de Precisión Metodológica (Desglose por Ejes)</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      {evaluation.score} / 100 pts totales
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 block font-medium">1. Rigor Conceptual</span>
                      <div className="text-base font-bold font-mono text-white">
                        {evaluation.precisionRubric.conceptualRigor} <span className="text-[11px] text-slate-500 font-normal">/ 30 pts</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-400 h-full rounded-full"
                          style={{ width: `${(evaluation.precisionRubric.conceptualRigor / 30) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 block font-medium">2. Procedimiento y Método</span>
                      <div className="text-base font-bold font-mono text-white">
                        {evaluation.precisionRubric.methodology} <span className="text-[11px] text-slate-500 font-normal">/ 40 pts</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${(evaluation.precisionRubric.methodology / 40) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 block font-medium">3. Exactitud y Casos</span>
                      <div className="text-base font-bold font-mono text-white">
                        {evaluation.precisionRubric.accuracy} <span className="text-[11px] text-slate-500 font-normal">/ 30 pts</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-sky-400 h-full rounded-full"
                          style={{ width: `${(evaluation.precisionRubric.accuracy / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {evaluation.precisionRubric.feedbackCriteria && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      {evaluation.precisionRubric.feedbackCriteria.map((crit, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded bg-slate-900/60 text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                crit.status === 'cumplido'
                                  ? 'bg-emerald-400'
                                  : crit.status === 'parcial'
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400'
                              }`}
                            />
                            <span className="text-slate-300">{crit.criterion}</span>
                          </div>
                          <span className="text-slate-400">
                            {crit.score} / {crit.maxScore} pts ({crit.status === 'cumplido' ? 'Cumplido' : crit.status === 'parcial' ? 'Parcial' : 'A reforzar'})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MCQ Score Breakdown */}
              {evaluation.mcqScore && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Desempeño en Selección Múltiple ({evaluation.mcqScore.total} preguntas)</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-indigo-300">
                      {evaluation.mcqScore.correct} / {evaluation.mcqScore.total} correctas ({evaluation.mcqScore.percentage}%)
                    </div>
                  </div>

                  {session.core.mcqQuestions && session.core.mcqQuestions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800 max-h-64 overflow-y-auto pr-1">
                      {session.core.mcqQuestions.map((q, idx) => {
                        const userAnswer = mcqAnswers[q.id];
                        const isCorrect = userAnswer === q.correctAnswer;
                        return (
                          <div
                            key={q.id}
                            className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                              isCorrect
                                ? 'bg-emerald-950/20 border-emerald-900/60 text-slate-300'
                                : 'bg-rose-950/20 border-rose-900/60 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-white">Pregunta {idx + 1} {q.fromTable ? `(📊 ${q.sourceConceptName})` : ''}</span>
                              <span className={isCorrect ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                {isCorrect ? '✓ Correcta' : '✗ Incorrecta'}
                              </span>
                            </div>
                            <div className="text-slate-200">
                              <MathRenderer content={q.question} />
                            </div>
                            <div className="text-[11px] space-y-0.5">
                              <div>Tu respuesta: <span className={isCorrect ? 'text-emerald-300 font-medium' : 'text-rose-300 font-medium'}><MathRenderer content={userAnswer || '(Sin responder)'} /></span></div>
                              {!isCorrect && (
                                <div>Respuesta esperada: <span className="text-emerald-300 font-medium"><MathRenderer content={q.correctAnswer} /></span></div>
                              )}
                              <div className="text-slate-400 italic mt-1">{q.explanation}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                <div className="font-semibold text-white mb-1">Diagnóstico del Tutor Experto:</div>
                <MathRenderer content={evaluation.summary} />
              </div>

              {/* Strengths & Areas to Reinforce */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs space-y-1.5">
                  <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Fortalezas Identificadas:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-emerald-200/90 text-[11px]">
                    {evaluation.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs space-y-1.5">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" />
                    <span>Puntos Críticos de Refuerzo:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-200/90 text-[11px]">
                    {evaluation.areasToReinforce.map((ar, i) => (
                      <li key={i}>{ar}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Next Step */}
              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-200">
                <strong className="text-indigo-400 block mb-0.5">Recomendación Pedagógica Inmediata:</strong>
                {evaluation.recommendedNextStep}
              </div>

              {/* ACTION FOOTER */}
              {isArchived ? (
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Esta lección ya fue completada y archivada. Puedes revisar el núcleo o des-archivarla para volver a cursarla.
                  </span>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('core')}
                      className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                      Ver Núcleo y Respuestas
                    </button>
                    {onUnarchive && (
                      <button
                        type="button"
                        onClick={() => {
                          onUnarchive();
                          onClose();
                        }}
                        className="px-4 py-2 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Des-archivar Lección</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Esta acción guardará la sesión en el registro diario y sumará el avance a tus metas de aprendizaje.
                  </span>

                  <button
                    type="button"
                    onClick={handleSaveAndLink}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Target className="w-4 h-4" />
                    <span>Vincular Avance a Metas y Finalizar</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
