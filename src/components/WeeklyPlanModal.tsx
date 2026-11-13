import React, { useState } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  Play,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Table2,
  BookOpen,
  Check,
  Eye,
  ArrowLeft,
  ListChecks,
  FileText,
  Brain,
  Archive,
  RotateCcw,
} from 'lucide-react';
import {
  LearningDomain,
  WeeklyStudyPlan,
  WeeklyStudyPlanDay,
  BloomLevel,
  ConceptItem,
  CoreExamProblem,
  CoreMCQQuestion,
  WarmupQuestion,
} from '../types/learning';
import { MathRenderer } from './MathRenderer';
import {
  generateWeeklyStudyPlan,
  getBloomName,
  calculateCoreMCQCount,
  generateCoreProblemForTopic,
  generateWarmupQuestionsFrom4Contexts,
  regenerateLessonQuestionsLocally,
} from '../utils/pedagogicalEngine';

interface WeeklyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: LearningDomain | null;
  activePlan: WeeklyStudyPlan | null;
  allConcepts?: ConceptItem[];
  onSavePlan: (plan: WeeklyStudyPlan) => void;
  onLaunchDaySession: (
    domain: LearningDomain,
    dayName: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo',
    topic: string,
    bloomLevel: BloomLevel,
    isExtended: boolean,
    selectedConceptIds?: string[],
    preparedProblem?: CoreExamProblem,
    preparedMcqQuestions?: CoreMCQQuestion[]
  ) => void;
}

export const WeeklyPlanModal: React.FC<WeeklyPlanModalProps> = ({
  isOpen,
  onClose,
  domain,
  activePlan,
  allConcepts = [],
  onSavePlan,
  onLaunchDaySession,
}) => {
  const [plan, setPlan] = useState<WeeklyStudyPlan>(() => {
    return activePlan && domain && activePlan.domainId === domain.id
      ? activePlan
      : (domain ? generateWeeklyStudyPlan(domain) : {} as WeeklyStudyPlan);
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [generationMsg, setGenerationMsg] = useState<string | null>(null);

  // Filter concepts relevant to this domain
  const domainConcepts = domain
    ? allConcepts.filter(
        (c) =>
          c.domainId === domain.id ||
          c.databaseKey === (domain.conceptDatabaseKey || `db-${domain.id}`) ||
          c.linkedDomainIds?.includes(domain.id)
      )
    : [];

  const conceptsWithTables = domainConcepts.filter(
    (c) => Array.isArray(c.tableData) && c.tableData.length >= 2
  );

  // Custom Lesson Creation State
  const [isCreatingCustom, setIsCreatingCustom] = useState<boolean>(false);
  const [customDay, setCustomDay] = useState<
    'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo'
  >('Lunes');
  const [customTopic, setCustomTopic] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [customBloom, setCustomBloom] = useState<BloomLevel>(3);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customIsExtended, setCustomIsExtended] = useState(false);
  const [customWarmup, setCustomWarmup] = useState('');
  const [customSelectedConceptIds, setCustomSelectedConceptIds] = useState<string[]>([]);

  // User Day Editing State
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editTopic, setEditTopic] = useState('');
  const [editBloom, setEditBloom] = useState<BloomLevel>(3);
  const [editMinutes, setEditMinutes] = useState(25);
  const [editIsExtended, setEditIsExtended] = useState(false);
  const [editObjective, setEditObjective] = useState('');
  const [editWarmup, setEditWarmup] = useState('');

  // Lesson Preview State
  const [previewingDayIndex, setPreviewingDayIndex] = useState<number | null>(null);
  const [isReworkingPreview, setIsReworkingPreview] = useState<boolean>(false);
  const [reworkSuccessMsg, setReworkSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !domain) return null;

  const getDayKey = (
    dayName: string
  ): 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo' => {
    const lower = dayName.toLowerCase();
    if (lower.includes('lun')) return 'lunes';
    if (lower.includes('mar')) return 'martes';
    if (lower.includes('mi')) return 'miercoles';
    if (lower.includes('jue')) return 'jueves';
    if (lower.includes('vie')) return 'viernes';
    if (lower.includes('sáb') || lower.includes('sab')) return 'sabado';
    return 'domingo';
  };

  const handleStartEditingDay = (idx: number, day: WeeklyStudyPlanDay) => {
    setEditingDayIndex(idx);
    setEditTopic(day.topic);
    setEditBloom(day.bloomLevel);
    setEditMinutes(day.estimatedMinutes);
    setEditIsExtended(day.isExtendedLesson);
    setEditObjective(day.objective);
    setEditWarmup(day.warmupTopic);
  };

  const handleSaveEditedDay = (idx: number) => {
    const updatedDays = [...plan.days];
    const targetDay = updatedDays[idx];
    if (!targetDay) return;

    updatedDays[idx] = {
      ...targetDay,
      topic: editTopic.trim() || targetDay.topic,
      bloomLevel: editBloom,
      estimatedMinutes: Number(editMinutes) || 20,
      isExtendedLesson: editIsExtended,
      objective: editObjective.trim() || targetDay.objective,
      warmupTopic: editWarmup.trim() || targetDay.warmupTopic,
    };

    const updatedPlan: WeeklyStudyPlan = {
      ...plan,
      days: updatedDays,
    };

    setPlan(updatedPlan);
    onSavePlan(updatedPlan);
    setEditingDayIndex(null);
    setGenerationMsg(`¡Día ${targetDay.dayName} actualizado y guardado correctamente!`);
    setTimeout(() => setGenerationMsg(null), 3000);
  };

  const handleOpenCustomLessonCreator = () => {
    setIsCreatingCustom(true);
    setCustomDay('Lunes');
    setCustomTopic('');
    setCustomObjective('');
    setCustomMinutes(25);
    setCustomBloom(3);
    setCustomIsExtended(false);
    setCustomWarmup('');
    // Automatically select concepts that have tableData by default for convenience
    const tableConceptIds = conceptsWithTables.map((c) => c.id);
    setCustomSelectedConceptIds(tableConceptIds);
  };

  const handleToggleConceptSelection = (conceptId: string) => {
    setCustomSelectedConceptIds((prev) =>
      prev.includes(conceptId) ? prev.filter((id) => id !== conceptId) : [...prev, conceptId]
    );
  };

  const handleSaveCustomLesson = (launchNow: boolean = false) => {
    if (!customTopic.trim()) {
      alert('Por favor especifica el tema o título de la lección personalizada.');
      return;
    }

    const isSun = customDay === 'Domingo';
    const newLessonDay: WeeklyStudyPlanDay = {
      dayName: customDay,
      isSundaySRS: isSun,
      topic: customTopic.trim(),
      bloomLevel: customBloom,
      estimatedMinutes: Number(customMinutes) || 25,
      isExtendedLesson: customIsExtended,
      objective:
        customObjective.trim() ||
        `Dominar ${customTopic.trim()} en nivel ${customBloom} (${getBloomName(customBloom)}).`,
      warmupTopic:
        customWarmup.trim() ||
        (customSelectedConceptIds.length > 0
          ? `Reactivación de conceptos clave seleccionados`
          : `Recuperación de prerrequisitos de ${customTopic.trim()}`),
      isCustomLesson: true,
      customConceptIds: customSelectedConceptIds,
      completed: false,
    };

    // Replace the matching day or append
    const updatedDays = plan.days.map((d) => (d.dayName === customDay ? newLessonDay : d));

    const updatedPlan: WeeklyStudyPlan = {
      ...plan,
      days: updatedDays,
    };

    setPlan(updatedPlan);
    onSavePlan(updatedPlan);
    setIsCreatingCustom(false);

    setGenerationMsg(`¡Lección personalizada para ${customDay} guardada con éxito en el plan semanal!`);
    setTimeout(() => setGenerationMsg(null), 3500);

    if (launchNow) {
      onLaunchDaySession(
        domain,
        getDayKey(customDay),
        newLessonDay.topic,
        newLessonDay.bloomLevel,
        newLessonDay.isExtendedLesson,
        customSelectedConceptIds,
        newLessonDay.preparedProblem,
        newLessonDay.preparedMcqQuestions
      );
      onClose();
    }
  };

  const handleReworkPreviewQuestions = async (dayIdx: number) => {
    const targetDay = plan.days[dayIdx];
    if (!targetDay) return;

    setIsReworkingPreview(true);
    setReworkSuccessMsg(null);

    const attachedConcepts = (targetDay.customConceptIds || [])
      .map((id) => domainConcepts.find((c) => c.id === id))
      .filter(Boolean) as ConceptItem[];
    const conceptsToUse = attachedConcepts.length > 0 ? attachedConcepts : domainConcepts;

    try {
      const res = await fetch('/api/pedagogical/regenerate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: domain.name,
          macroDomainId: domain.macroDomainId,
          subArea: domain.subArea,
          conceptDatabaseKey: domain.conceptDatabaseKey || `db-${domain.id}`,
          topic: targetDay.topic,
          bloomLevel: targetDay.bloomLevel,
          sessionMinutes: targetDay.estimatedMinutes,
          isExtended: targetDay.isExtendedLesson,
          databaseConcepts: conceptsToUse,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && Array.isArray(json.data.mcqQuestions) && json.data.mcqQuestions.length > 0) {
          const updatedDays = [...plan.days];
          updatedDays[dayIdx] = {
            ...targetDay,
            preparedProblem: json.data.problem || targetDay.preparedProblem,
            preparedMcqQuestions: json.data.mcqQuestions,
          };

          const updatedPlan: WeeklyStudyPlan = {
            ...plan,
            days: updatedDays,
          };

          setPlan(updatedPlan);
          onSavePlan(updatedPlan);
          setReworkSuccessMsg(`¡${json.data.mcqQuestions.length} preguntas y problema aplicado rehechos con éxito con Gemini 1.5 Flash y guardados en el plan!`);
          setTimeout(() => setReworkSuccessMsg(null), 4500);
          setIsReworkingPreview(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Error reworking questions with Gemini 1.5 Flash:', err);
    }

    // Local pedagogical engine fallback
    const localPackage = regenerateLessonQuestionsLocally(
      domain,
      targetDay.topic,
      targetDay.bloomLevel,
      targetDay.estimatedMinutes,
      targetDay.isExtendedLesson,
      conceptsToUse
    );

    const updatedDays = [...plan.days];
    updatedDays[dayIdx] = {
      ...targetDay,
      preparedProblem: localPackage.problem,
      preparedMcqQuestions: localPackage.mcqQuestions,
    };

    const updatedPlan: WeeklyStudyPlan = {
      ...plan,
      days: updatedDays,
    };

    setPlan(updatedPlan);
    onSavePlan(updatedPlan);
    setReworkSuccessMsg(`¡${localPackage.mcqQuestions.length} preguntas y problema aplicado rehechos según contexto pedagógico y guardados!`);
    setTimeout(() => setReworkSuccessMsg(null), 4500);
    setIsReworkingPreview(false);
  };

  const handleGenerateAIPlan = async () => {
    setIsGeneratingAI(true);
    setGenerationMsg('Generando plan semanal optimizado con Taxonomía de Bloom mediante Gemini 1.5 Flash...');

    try {
      const res = await fetch('/api/pedagogical/generate-weekly-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: domain.name,
          macroDomainId: domain.macroDomainId,
          subArea: domain.subArea,
          conceptDatabaseKey: domain.conceptDatabaseKey || `db-${domain.id}`,
          databaseConcepts: domainConcepts,
          currentLevel: domain.level,
          topics: domain.topics,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const aiPlan: WeeklyStudyPlan = {
            id: `plan-${domain.id}-${Date.now()}`,
            domainId: domain.id,
            domainName: domain.name,
            macroDomainId: domain.macroDomainId,
            weekTitle: json.data.weekTitle || `Plan Semanal Adaptativo: ${domain.name} (${domain.subArea})`,
            createdAt: new Date().toISOString(),
            days: json.data.days.map((d: any) => ({
              ...d,
              isSundaySRS: d.dayName.toLowerCase().includes('domingo'),
            })),
          };
          setPlan(aiPlan);
          onSavePlan(aiPlan);
          setGenerationMsg('¡Plan adaptativo generado y guardado exitosamente con Gemini 1.5 Flash!');
          setTimeout(() => setGenerationMsg(null), 3000);
          setIsGeneratingAI(false);
          return;
        }
      }
    } catch (e) {
      console.warn('AI plan generation error, applying pedagogical rules:', e);
    }

    // Local deterministic fallback strictly grounded on the 4 context elements
    const localPlan = generateWeeklyStudyPlan(domain, undefined, domainConcepts);
    setPlan(localPlan);
    onSavePlan(localPlan);
    setGenerationMsg('Plan generado según reglas pedagógicas locales.');
    setTimeout(() => setGenerationMsg(null), 3000);
    setIsGeneratingAI(false);
  };

  const estimatedMCQCount = calculateCoreMCQCount(customMinutes, customBloom, customIsExtended);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl my-6 p-6 shadow-2xl relative text-left flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base sm:text-lg font-bold text-white">
                Plan de Estudios Semanal Adaptativo
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {domain.name} · Estructurado según la Taxonomía de Bloom con domingo exclusivo de SRS.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleOpenCustomLessonCreator}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Crear Lección Personalizada</span>
            </button>

            <button
              onClick={handleGenerateAIPlan}
              disabled={isGeneratingAI}
              className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              <span>Regenerar con Tutor IA</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {generationMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-indigo-950/50 border border-indigo-800 text-xs text-indigo-200">
            {generationMsg}
          </div>
        )}

        {/* CUSTOM LESSON CREATOR MODAL / INLINE DRAWER */}
        {isCreatingCustom && (
          <div className="mt-4 p-4 rounded-xl border border-indigo-500/80 bg-slate-950 space-y-4 shadow-xl shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white text-sm">
                  Configurar Lección Personalizada
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  Personalización Avanzada
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Día Asignado en la Semana
                </label>
                <select
                  value={customDay}
                  onChange={(e) => setCustomDay(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo (SRS Repaso)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Título / Tema de la Lección Personalizada *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Forma Te y Conjugaciones Verbales, Derivadas Compuestas..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nivel de Bloom Deseado
                </label>
                <select
                  value={customBloom}
                  onChange={(e) => setCustomBloom(Number(e.target.value) as BloomLevel)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>1 - Recordar (Términos y Hechos)</option>
                  <option value={2}>2 - Entender (Explicación conceptual)</option>
                  <option value={3}>3 - Aplicar (Resolución práctica)</option>
                  <option value={4}>4 - Analizar (Depuración y desglose)</option>
                  <option value={5}>5 - Evaluar (Optimización y juicio)</option>
                  <option value={6}>6 - Crear (Modelado original)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Duración Estimada (minutos)
                </label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 20)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <div className="text-[10px] text-indigo-400 mt-1 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Generará {estimatedMCQCount} preguntas de selección múltiple (MCQ)</span>
                </div>
              </div>

              <div className="flex items-center pt-4">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customIsExtended}
                    onChange={(e) => setCustomIsExtended(e.target.checked)}
                    className="rounded text-indigo-500"
                  />
                  <span>Lección Larga / Plazo Extendido</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Objetivo Pedagógico
              </label>
              <textarea
                rows={2}
                placeholder="Objetivo formativo específico que el alumno alcanzará en esta lección..."
                value={customObjective}
                onChange={(e) => setCustomObjective(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Tema de Calentamiento / Warm-up (3 min)
              </label>
              <input
                type="text"
                placeholder="Tema previo para reactivar memoria de trabajo antes del examen..."
                value={customWarmup}
                onChange={(e) => setCustomWarmup(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* CONCEPT DATABASE SELECTION: TABLE-ENABLED CONCEPTS HIGHLIGHTED */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                    <Table2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Vincular Conceptos de la Base de Datos para Formular Preguntas</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Las lecciones acceden a los conceptos seleccionados. Si tienen tablas de datos, se generarán automáticamente preguntas de selección múltiple sobre sus filas y columnas.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-indigo-400">
                  {customSelectedConceptIds.length} seleccionado(s)
                </span>
              </div>

              {domainConcepts.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
                  No hay conceptos registrados aún en esta base. Las preguntas se generarán directamente del tema.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {domainConcepts.map((concept) => {
                    const isSelected = customSelectedConceptIds.includes(concept.id);
                    const hasTable = Array.isArray(concept.tableData) && concept.tableData.length >= 2;

                    return (
                      <div
                        key={concept.id}
                        onClick={() => handleToggleConceptSelection(concept.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-indigo-950/70 border-indigo-500 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-indigo-500 border-indigo-500 text-slate-950'
                              : 'border-slate-700 bg-slate-950'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold truncate">{concept.name}</span>
                            {hasTable && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono shrink-0 flex items-center gap-1">
                                <Table2 className="w-2.5 h-2.5" />
                                <span>Tabla ({concept.tableData!.length} filas)</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {concept.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions for custom lesson */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleSaveCustomLesson(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Guardar en Plan Semanal
              </button>

              <button
                type="button"
                onClick={() => handleSaveCustomLesson(true)}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Guardar e Iniciar Sesión Ahora</span>
              </button>
            </div>
          </div>
        )}

        {/* LESSON PREVIEW VIEW */}
        {previewingDayIndex !== null ? (
          (() => {
            const previewDay = plan.days[previewingDayIndex];
            if (!previewDay) return null;

            const attachedConcepts = (previewDay.customConceptIds || [])
              .map((id) => domainConcepts.find((c) => c.id === id))
              .filter(Boolean) as ConceptItem[];
            const conceptsPool = attachedConcepts.length > 0 ? attachedConcepts : domainConcepts;

            const activeProblem = previewDay.preparedProblem || generateCoreProblemForTopic(
              domain,
              previewDay.topic,
              previewDay.bloomLevel,
              previewDay.isSundaySRS,
              conceptsPool
            );

            const activeWarmup = previewDay.preparedWarmupQuestions || generateWarmupQuestionsFrom4Contexts(
              domain,
              previewDay.topic,
              conceptsPool
            );

            const activeMcqs = (previewDay.preparedMcqQuestions && previewDay.preparedMcqQuestions.length > 0)
              ? previewDay.preparedMcqQuestions
              : regenerateLessonQuestionsLocally(
                  domain,
                  previewDay.topic,
                  previewDay.bloomLevel,
                  previewDay.estimatedMinutes,
                  previewDay.isExtendedLesson,
                  conceptsPool
                ).mcqQuestions;

            return (
              <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
                {/* Preview Navigation & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                  <div>
                    <button
                      type="button"
                      onClick={() => setPreviewingDayIndex(null)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mb-1.5 font-medium cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver al Plan de Estudios Semanal</span>
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-base font-mono">{previewDay.dayName}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-sm font-semibold text-slate-200">{previewDay.topic}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono">
                        Nivel Bloom {previewDay.bloomLevel}: {getBloomName(previewDay.bloomLevel)}
                      </span>
                      {previewDay.isSundaySRS && (
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono">
                          Repaso Espaciado (SRS)
                        </span>
                      )}
                      {previewDay.isExtendedLesson && (
                        <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono">
                          Lección Larga
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{previewDay.objective}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                    {!previewDay.completed ? (
                      <button
                        type="button"
                        onClick={() => handleReworkPreviewQuestions(previewingDayIndex)}
                        disabled={isReworkingPreview}
                        className="px-3.5 py-2 text-xs font-semibold text-amber-200 hover:text-white bg-amber-950/80 hover:bg-amber-900 border border-amber-700/80 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        title="Rehacer las preguntas y el problema aplicado utilizando Gemini 1.5 Flash"
                      >
                        {isReworkingPreview ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            <span>Rehaciendo con Gemini 1.5 Flash...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Rehacer preguntas con Gemini 1.5 Flash</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800 text-xs text-amber-300 font-medium flex items-center gap-1.5">
                        <Archive className="w-3.5 h-3.5 text-amber-400" />
                        <span>Lección Archivada (IA desactivada)</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onLaunchDaySession(
                          domain,
                          getDayKey(previewDay.dayName),
                          previewDay.topic,
                          previewDay.bloomLevel,
                          previewDay.isExtendedLesson,
                          previewDay.customConceptIds,
                          activeProblem,
                          activeMcqs
                        );
                        onClose();
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Iniciar Sesión Ahora</span>
                    </button>
                  </div>
                </div>

                {reworkSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{reworkSuccessMsg}</span>
                  </div>
                )}

                {/* 4 Context Anchors Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-2 text-xs">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                    Contexto Exclusivo de la Lección (4 Pilares)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-slate-300">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block font-mono">1. Dominio / Tema</span>
                      <span className="font-semibold text-white truncate block">{domain.name}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block font-mono">2. Ruta / Selector Principal</span>
                      <span className="font-semibold text-white truncate block">{domain.macroDomainId}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block font-mono">3. Sub-Área o Especialidad</span>
                      <span className="font-semibold text-white truncate block">{domain.subArea || 'General'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block font-mono">4. Base de Datos Conceptual</span>
                      <span className="font-semibold text-emerald-400 truncate block">
                        {domain.conceptDatabaseKey || `db-${domain.id}`} ({conceptsPool.length} conceptos vinculados)
                      </span>
                    </div>
                  </div>
                </div>

                {/* FASE 1: CALENTAMIENTO COGNITIVO */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-indigo-400" />
                      <h5 className="font-bold text-white text-xs sm:text-sm">
                        Fase 1: Calentamiento Cognitivo & Recuperación Activa (3 min)
                      </h5>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {activeWarmup.length} ítems de calentamiento
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Generado acorde al contexto de Dominio, Ruta, Sub-Área y Base de Datos Conceptual ({previewDay.warmupTopic}).
                  </p>
                  <div className="space-y-2.5">
                    {activeWarmup.map((w, wIdx) => (
                      <div key={w.id || wIdx} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-mono text-indigo-400">Ítem {wIdx + 1}</span>
                          <span className="font-mono text-slate-500">{w.conceptTested}</span>
                        </div>
                        <div className="text-slate-100 font-medium">
                          <MathRenderer content={w.question} />
                        </div>
                        {w.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {w.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`p-2 rounded border text-[11px] ${
                                  opt === w.correctAnswer
                                    ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200 font-medium'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                                }`}
                              >
                                <MathRenderer content={opt} />
                                {opt === w.correctAnswer && (
                                  <span className="text-[9px] text-emerald-400 block font-mono mt-0.5">✓ Respuesta esperada</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* FASE 2: PROBLEMA APLICADO */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <h5 className="font-bold text-white text-xs sm:text-sm">
                        Fase 2: {activeProblem.title} ({previewDay.estimatedMinutes > 30 ? '30-40' : '10-15'} min)
                      </h5>
                    </div>
                    <span className="text-[10px] font-mono text-amber-300 px-2 py-0.5 rounded bg-amber-950 border border-amber-800">
                      Nivel Bloom {activeProblem.bloomLevel}
                    </span>
                  </div>

                  <div className="text-xs text-slate-200 leading-relaxed p-3.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <MathRenderer content={activeProblem.problemStatement} />
                  </div>

                  {activeProblem.codeSnippet && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <MathRenderer content={`\`\`\`${activeProblem.codeSnippet}\`\`\``} />
                    </div>
                  )}

                  {activeProblem.guidingQuestions && activeProblem.guidingQuestions.length > 0 && (
                    <div className="text-xs text-slate-400 space-y-1 pt-1">
                      <span className="font-semibold text-slate-300">Puntos a considerar en la resolución:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                        {activeProblem.guidingQuestions.map((gq, i) => (
                          <li key={i}>{gq}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeProblem.expectedKeyPoints && activeProblem.expectedKeyPoints.length > 0 && (
                    <div className="text-xs text-slate-400 space-y-1 pt-1">
                      <span className="font-semibold text-slate-300">Criterios de evaluación y rúbrica esperada:</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activeProblem.expectedKeyPoints.map((kp, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 text-[11px]">
                            • {kp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* FASE 3: NÚCLEO DEL EXAMEN - PREGUNTAS DE SELECCIÓN MÚLTIPLE */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-indigo-400" />
                      <h5 className="font-bold text-white text-xs sm:text-sm">
                        Fase 3: Núcleo del Examen — Preguntas de Selección Múltiple
                      </h5>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-300 px-2.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 font-semibold">
                      {activeMcqs.length} preguntas MCQ calculadas para {previewDay.estimatedMinutes} min
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeMcqs.map((q, qIdx) => (
                      <div key={q.id || qIdx} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-mono text-indigo-400 font-semibold">
                            Pregunta {qIdx + 1} de {activeMcqs.length}
                          </span>
                          {q.fromTable && (
                            <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-mono flex items-center gap-1">
                              <Table2 className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Basada en tabla de: <strong>{q.sourceConceptName}</strong></span>
                            </span>
                          )}
                        </div>

                        <div className="text-white font-medium text-xs leading-relaxed">
                          <MathRenderer content={q.question} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = opt === q.correctAnswer;
                            const letter = String.fromCharCode(65 + oIdx);
                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                                  isCorrect
                                    ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-200 font-medium shadow-sm'
                                    : 'bg-slate-950 border-slate-800 text-slate-300'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded text-[10px] flex items-center justify-center font-mono shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {letter}
                                </span>
                                <div className="flex-1">
                                  <MathRenderer content={opt} />
                                  {isCorrect && (
                                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5 font-semibold">
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>Respuesta correcta del examen</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="pt-1.5 text-[11px] text-slate-400 border-t border-slate-800/60 flex items-start gap-1.5">
                            <span className="text-slate-500 font-mono shrink-0">Explicación:</span>
                            <span>{q.explanation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          /* Days List */
          <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
          {plan.days.map((day, idx) => {
            const isEditing = editingDayIndex === idx;

            if (isEditing) {
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-indigo-500/80 bg-slate-950 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-white text-xs font-mono">
                      Editando {day.dayName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingDayIndex(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancelar edición
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Tema / Tópico del Día
                      </label>
                      <input
                        type="text"
                        value={editTopic}
                        onChange={(e) => setEditTopic(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Nivel de Bloom
                      </label>
                      <select
                        value={editBloom}
                        onChange={(e) => setEditBloom(Number(e.target.value) as BloomLevel)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value={1}>1 - Recordar</option>
                        <option value={2}>2 - Entender</option>
                        <option value={3}>3 - Aplicar</option>
                        <option value={4}>4 - Analizar</option>
                        <option value={5}>5 - Evaluar</option>
                        <option value={6}>6 - Crear</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Duración Estimada (min)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="180"
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(parseInt(e.target.value) || 20)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsExtended}
                          onChange={(e) => setEditIsExtended(e.target.checked)}
                          className="rounded text-indigo-500"
                        />
                        <span>Lección larga / Plazo extendido</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Objetivo Pedagógico
                    </label>
                    <textarea
                      rows={2}
                      value={editObjective}
                      onChange={(e) => setEditObjective(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Tema de Calentamiento / Warm-up
                    </label>
                    <input
                      type="text"
                      value={editWarmup}
                      onChange={(e) => setEditWarmup(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingDayIndex(null)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEditedDay(idx)}
                      className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg"
                    >
                      Guardar Cambios del Día
                    </button>
                  </div>
                </div>
              );
            }

            // Find attached concepts if any
            const attachedConcepts = (day.customConceptIds || [])
              .map((id) => domainConcepts.find((c) => c.id === id))
              .filter(Boolean) as ConceptItem[];

            const attachedWithTables = attachedConcepts.filter(
              (c) => Array.isArray(c.tableData) && c.tableData.length >= 2
            );

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  day.isCustomLesson
                    ? 'bg-indigo-950/25 border-indigo-500/60 hover:border-indigo-400 shadow-sm'
                    : day.isSundaySRS
                    ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
                    : day.isExtendedLesson
                    ? 'bg-slate-950 border-indigo-900/50 hover:border-indigo-600'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-bold text-white font-mono">{day.dayName}</span>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <span className="text-indigo-400 font-mono text-[11px]">
                        Nivel {day.bloomLevel}: {getBloomName(day.bloomLevel)}
                      </span>
                      {day.isCustomLesson && (
                        <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700 text-[10px] font-mono flex items-center gap-1 font-semibold">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Lección Personalizada</span>
                        </span>
                      )}
                      {day.isSundaySRS && (
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono">
                          Únicamente Repaso Espaciado (SRS)
                        </span>
                      )}
                      {day.isExtendedLesson && (
                        <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono">
                          Lección Larga / Plazo Extendido
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-100">
                      {day.topic}
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                      {day.objective}
                    </p>

                    {/* Attached concepts tags if custom lesson */}
                    {attachedConcepts.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                        <span className="text-slate-500 font-mono">Conceptos vinculados:</span>
                        {attachedConcepts.map((c) => (
                          <span
                            key={c.id}
                            className={`px-2 py-0.5 rounded border text-[10px] font-mono flex items-center gap-1 ${
                              Array.isArray(c.tableData) && c.tableData.length >= 2
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                : 'bg-slate-900 text-slate-300 border-slate-800'
                            }`}
                          >
                            {Array.isArray(c.tableData) && c.tableData.length >= 2 && (
                              <Table2 className="w-2.5 h-2.5 text-emerald-400" />
                            )}
                            <span>{c.name}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 pt-0.5">
                      <strong className="text-slate-400">Warm-up (3 min):</strong> {day.warmupTopic}
                    </div>
                  </div>

                  {/* Right: duration, edit and action */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <div className="text-right mr-1">
                      <div className="text-xs font-mono tabular-nums text-slate-300 flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{day.estimatedMinutes} min</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {calculateCoreMCQCount(day.estimatedMinutes, day.bloomLevel, day.isExtendedLesson)} preguntas MCQ
                      </div>
                    </div>

                    <button
                      onClick={() => setPreviewingDayIndex(idx)}
                      title="Previsualizar las preguntas y el problema de esta lección"
                      className="px-2.5 py-2 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Previsualizar</span>
                    </button>

                    <button
                      onClick={() => handleStartEditingDay(idx, day)}
                      title="Editar este día del plan"
                      className="px-2.5 py-2 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => {
                        onLaunchDaySession(
                          domain,
                          getDayKey(day.dayName),
                          day.topic,
                          day.bloomLevel,
                          day.isExtendedLesson,
                          day.customConceptIds,
                          day.preparedProblem,
                          day.preparedMcqQuestions
                        );
                        onClose();
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Iniciar Sesión</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Regla pedagógica: Puedes crear lecciones personalizadas vinculando conceptos y tablas. El examen generará entre 3 y 10 preguntas de selección múltiple según duración y dificultad.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
