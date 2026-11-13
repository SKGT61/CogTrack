import React, { useState, useEffect, useMemo } from 'react';
import {
  loadStoredData,
  saveDomains,
  saveFolders,
  saveMacroDomains,
  saveLogs,
  saveGoals,
  savePreferences,
  saveWeeklyPlans,
  saveConcepts,
  saveConceptFolders,
  saveArchivedLessons,
  saveDifficultyTracks,
  exportBackupJSON,
  resetToSampleData,
  AppStateData,
} from './utils/storage';
import {
  calculateStreak,
  getWeeklyData,
  getMacroDomainDistribution,
  getHeatmapGrid,
  formatDateISO,
} from './utils/analytics';
import { generateWeeklyStudyPlan } from './utils/pedagogicalEngine';
import {
  LearningDomain,
  LearningFolder,
  MacroDomainInfo,
  DailyStudyLog,
  Goal,
  UserPreferences,
  WeeklyStudyPlan,
  PedagogicalSession,
  EvaluationResult,
  BloomLevel,
  ConceptItem,
  ConceptFolder,
  ConceptStatus,
  CoreExamProblem,
  CoreMCQQuestion,
  ArchivedLesson,
  DifficultyLevel,
  DifficultyLessonItem,
  DomainDifficultyTrack,
  GoogleDriveSyncStatus,
} from './types/learning';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
  backupStateToGoogleDrive,
  restoreStateFromGoogleDrive,
} from './utils/googleDriveService';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { HeatmapCalendar } from './components/HeatmapCalendar';
import { WeeklyProgressChart } from './components/WeeklyProgressChart';
import { CategoryDistribution } from './components/CategoryDistribution';
import { GoalsSection } from './components/GoalsSection';
import { DomainsView } from './components/DomainsView';
import { DailyLogFeed } from './components/DailyLogFeed';
import { LogEntryModal } from './components/LogEntryModal';
import { StudyTimerModal } from './components/StudyTimerModal';
import { GoalModal } from './components/GoalModal';
import { DomainModal } from './components/DomainModal';
import { FolderModal } from './components/FolderModal';
import { NewMacroDomainModal } from './components/NewMacroDomainModal';
import { DataManagementModal } from './components/DataManagementModal';
import { PedagogicalSessionModal } from './components/PedagogicalSessionModal';
import { WeeklyPlanModal } from './components/WeeklyPlanModal';
import { LessonsHubView } from './components/LessonsHubView';
import { ConceptDatabaseView } from './components/ConceptDatabaseView';
import { ConceptModal } from './components/ConceptModal';
import { ArchivedLessonsModal } from './components/ArchivedLessonsModal';
import { Check, Zap, Target, Archive } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<AppStateData>(() => loadStoredData());
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'logs' | 'domains' | 'lessons' | 'goals'>('dashboard');
  const [lessonsHubSelectedDomainId, setLessonsHubSelectedDomainId] = useState<string | null>(null);

  // Google Drive Cloud Sync State
  const [driveSyncStatus, setDriveSyncStatus] = useState<GoogleDriveSyncStatus>({
    isSignedIn: false,
    isSyncing: false,
  });

  // Filter selection from heatmap click or category selection
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logInitialDomainId, setLogInitialDomainId] = useState<string | undefined>(undefined);
  const [logInitialDuration, setLogInitialDuration] = useState<number | undefined>(undefined);

  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [domainToEdit, setDomainToEdit] = useState<LearningDomain | null>(null);
  const [domainTargetMacroId, setDomainTargetMacroId] = useState<string>('formal_quantitative');
  const [domainTargetFolderId, setDomainTargetFolderId] = useState<string | null>(null);

  // Folder Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<LearningFolder | null>(null);
  const [activeFolderMacroId, setActiveFolderMacroId] = useState<string>('formal_quantitative');
  const [activeFolderParentId, setActiveFolderParentId] = useState<string | null>(null);

  // New Macro Domain Selector Modal
  const [isNewMacroModalOpen, setIsNewMacroModalOpen] = useState(false);

  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Pedagogical Engine Modals State
  const [isPedagogicalSessionOpen, setIsPedagogicalSessionOpen] = useState(false);
  const [pedagogicalTargetDomain, setPedagogicalTargetDomain] = useState<LearningDomain | null>(null);
  const [sessionDayName, setSessionDayName] = useState<'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'>('lunes');
  const [sessionCustomTopic, setSessionCustomTopic] = useState<string | undefined>(undefined);
  const [sessionTargetBloom, setSessionTargetBloom] = useState<BloomLevel | undefined>(undefined);
  const [sessionIsExtended, setSessionIsExtended] = useState<boolean>(false);
  const [sessionCustomConceptIds, setSessionCustomConceptIds] = useState<string[]>([]);
  const [sessionPreparedProblem, setSessionPreparedProblem] = useState<CoreExamProblem | undefined>(undefined);
  const [sessionPreparedMcqQuestions, setSessionPreparedMcqQuestions] = useState<CoreMCQQuestion[] | undefined>(undefined);
  const [sessionLessonMode, setSessionLessonMode] = useState<'weekly' | 'difficulty'>('weekly');
  const [sessionDifficultyLevel, setSessionDifficultyLevel] = useState<DifficultyLevel | undefined>(undefined);
  const [sessionLessonItem, setSessionLessonItem] = useState<DifficultyLessonItem | undefined>(undefined);

  const [isWeeklyPlanOpen, setIsWeeklyPlanOpen] = useState(false);
  const [weeklyPlanDomain, setWeeklyPlanDomain] = useState<LearningDomain | null>(null);

  // Concept Database and Concept Modals state
  const [isConceptDbOpen, setIsConceptDbOpen] = useState(false);
  const [conceptDbDomain, setConceptDbDomain] = useState<LearningDomain | null>(null);
  const [conceptInitialFolderId, setConceptInitialFolderId] = useState<string | null>(null);
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
  const [conceptToEdit, setConceptToEdit] = useState<ConceptItem | null>(null);

  // Archived Lessons State
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [selectedArchivedLesson, setSelectedArchivedLesson] = useState<ArchivedLesson | null>(null);

  const [linkNotification, setLinkNotification] = useState<string | null>(null);

  // Persistence effects
  useEffect(() => {
    saveDomains(data.domains);
  }, [data.domains]);

  useEffect(() => {
    saveFolders(data.folders);
  }, [data.folders]);

  useEffect(() => {
    saveMacroDomains(data.macroDomains);
  }, [data.macroDomains]);

  useEffect(() => {
    saveLogs(data.logs);
  }, [data.logs]);

  useEffect(() => {
    saveGoals(data.goals);
  }, [data.goals]);

  useEffect(() => {
    savePreferences(data.preferences);
  }, [data.preferences]);

  useEffect(() => {
    saveWeeklyPlans(data.weeklyPlans);
  }, [data.weeklyPlans]);

  useEffect(() => {
    saveConcepts(data.concepts);
  }, [data.concepts]);

  useEffect(() => {
    saveConceptFolders(data.conceptFolders);
  }, [data.conceptFolders]);

  useEffect(() => {
    saveArchivedLessons(data.archivedLessons || []);
  }, [data.archivedLessons]);

  useEffect(() => {
    saveDifficultyTracks(data.difficultyTracks || []);
  }, [data.difficultyTracks]);

  // Google Auth initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setDriveSyncStatus((prev) => ({
          ...prev,
          isSignedIn: true,
          userEmail: user.email || undefined,
          userName: user.displayName || undefined,
          userPhotoUrl: user.photoURL || undefined,
        }));
      },
      () => {
        setDriveSyncStatus({
          isSignedIn: false,
          isSyncing: false,
        });
      }
    );
    return () => unsubscribe();
  }, []);

  // Debounced auto-sync to Google Drive when data changes and user is signed in
  useEffect(() => {
    if (!driveSyncStatus.isSignedIn) return;

    const timer = setTimeout(async () => {
      const token = await getAccessToken();
      if (!token) return;

      try {
        setDriveSyncStatus((prev) => ({ ...prev, isSyncing: true }));
        const res = await backupStateToGoogleDrive(token, data);
        setDriveSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: res.syncedAt,
          folderId: res.fileId,
          error: null,
        }));
      } catch (err: any) {
        console.warn('Auto-sync to Google Drive error:', err);
        setDriveSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          error: err.message,
        }));
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [data, driveSyncStatus.isSignedIn]);

  const handleSignInGoogle = async () => {
    try {
      setDriveSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));
      const result = await googleSignIn();
      if (result) {
        setDriveSyncStatus({
          isSignedIn: true,
          userEmail: result.user.email || undefined,
          userName: result.user.displayName || undefined,
          userPhotoUrl: result.user.photoURL || undefined,
          isSyncing: false,
        });

        // Trigger immediate backup to ensure fresh cloud copy
        const res = await backupStateToGoogleDrive(result.accessToken, data);
        setDriveSyncStatus((prev) => ({
          ...prev,
          lastSyncedAt: res.syncedAt,
          folderId: res.fileId,
        }));

        setLinkNotification(`¡Conectado con Google Drive (${result.user.email})! Respaldo inicial completado.`);
        setTimeout(() => setLinkNotification(null), 4000);
      }
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      setDriveSyncStatus((prev) => ({ ...prev, isSyncing: false, error: err.message }));
      setLinkNotification(`Error de conexión con Google: ${err.message}`);
      setTimeout(() => setLinkNotification(null), 4000);
    }
  };

  const handleSignOutGoogle = async () => {
    await googleSignOut();
    setDriveSyncStatus({
      isSignedIn: false,
      isSyncing: false,
    });
    setLinkNotification('Sesión de Google Drive cerrada.');
    setTimeout(() => setLinkNotification(null), 3000);
  };

  const handleSyncWithDrive = async () => {
    const token = await getAccessToken();
    if (!token) {
      await handleSignInGoogle();
      return;
    }

    try {
      setDriveSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));
      const res = await backupStateToGoogleDrive(token, data);
      setDriveSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: res.syncedAt,
        folderId: res.fileId,
      }));
      setLinkNotification('¡Sincronización con Google Drive completada!');
      setTimeout(() => setLinkNotification(null), 3500);
    } catch (err: any) {
      setDriveSyncStatus((prev) => ({ ...prev, isSyncing: false, error: err.message }));
      setLinkNotification(`Error al sincronizar con Drive: ${err.message}`);
      setTimeout(() => setLinkNotification(null), 4000);
    }
  };

  const handleRestoreFromDrive = async () => {
    const token = await getAccessToken();
    if (!token) {
      alert('Debes iniciar sesión con Google para restaurar datos desde Google Drive.');
      return;
    }

    const confirmed = window.confirm(
      '¿Deseas restaurar toda la base de datos desde tu copia en Google Drive? Los datos locales actuales se reemplazarán con el respaldo de la nube.'
    );
    if (!confirmed) return;

    try {
      setDriveSyncStatus((prev) => ({ ...prev, isSyncing: true }));
      const restored = await restoreStateFromGoogleDrive(token);

      if (restored && (restored.domains || restored.subjects)) {
        setData({
          domains: restored.domains || restored.subjects || [],
          folders: restored.folders || [],
          macroDomains: restored.macroDomains || [],
          concepts: restored.concepts || [],
          conceptFolders: restored.conceptFolders || [],
          logs: restored.logs || [],
          goals: restored.goals || [],
          preferences: restored.preferences || data.preferences,
          weeklyPlans: restored.weeklyPlans || [],
          archivedLessons: restored.archivedLessons || [],
          difficultyTracks: restored.difficultyTracks || [],
        });

        setDriveSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: new Date().toISOString(),
        }));

        setLinkNotification('¡Base de datos restaurada con éxito desde Google Drive!');
        setTimeout(() => setLinkNotification(null), 4000);
      } else {
        throw new Error('El archivo en Drive no contiene un formato válido de CognitiveTrack.');
      }
    } catch (err: any) {
      setDriveSyncStatus((prev) => ({ ...prev, isSyncing: false, error: err.message }));
      alert(`Error al restaurar: ${err.message}`);
    }
  };

  // Derived Analytics
  const domainsMap = useMemo(() => new Map<string, LearningDomain>(data.domains.map((d) => [d.id, d])), [data.domains]);

  const streakInfo = useMemo(() => calculateStreak(data.logs), [data.logs]);

  const totalMinutes = useMemo(() => data.logs.reduce((sum, l) => sum + l.durationMinutes, 0), [data.logs]);
  const totalHours = totalMinutes / 60;
  const totalSessions = data.logs.length;

  const weeklyData = useMemo(() => getWeeklyData(data.logs, domainsMap), [data.logs, domainsMap]);
  const weeklyHours = useMemo(() => weeklyData.reduce((sum, d) => sum + d.totalMinutes, 0) / 60, [weeklyData]);

  const macroMetrics = useMemo(
    () => getMacroDomainDistribution(data.logs, domainsMap, data.macroDomains),
    [data.logs, domainsMap, data.macroDomains]
  );

  const heatmapWeeks = useMemo(() => getHeatmapGrid(data.logs, domainsMap), [data.logs, domainsMap]);

  const avgComprehension = useMemo(() => {
    if (data.logs.length === 0) return 0;
    const sum = data.logs.reduce((acc, l) => acc + l.comprehensionScore, 0);
    return sum / data.logs.length;
  }, [data.logs]);

  // Handlers for Logs
  const handleSaveLog = (newLogData: Omit<DailyStudyLog, 'id' | 'createdAt'>) => {
    const newLog: DailyStudyLog = {
      ...newLogData,
      id: `log-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // Update goals matching domain or macroDomain
    const updatedGoals = data.goals.map((g) => {
      const dom = domainsMap.get(newLog.subjectId);
      const isMatch =
        g.category === 'all' ||
        (dom && g.category === dom.macroDomainId) ||
        g.subjectId === newLog.subjectId;

      if (!isMatch) return g;

      if (g.targetType === 'hours') {
        const addedHours = Number((newLog.durationMinutes / 60).toFixed(1));
        return { ...g, currentValue: Number((g.currentValue + addedHours).toFixed(1)) };
      }
      if (g.targetType === 'sessions') {
        return { ...g, currentValue: g.currentValue + 1 };
      }
      return g;
    });

    setData((prev) => ({
      ...prev,
      logs: [newLog, ...prev.logs],
      goals: updatedGoals,
    }));
  };

  const handleDeleteLog = (logId: string) => {
    setData((prev) => ({
      ...prev,
      logs: prev.logs.filter((l) => l.id !== logId),
    }));
  };

  // Complete Pedagogical Session, Archive by Date, and Link Directly to Goals
  const handleCompletePedagogicalSession = (
    session: PedagogicalSession,
    evaluation: EvaluationResult,
    durationMinutes: number,
    studentAnswer: string
  ) => {
    const now = new Date();
    const todayStr = formatDateISO(now);
    const passed = evaluation.score >= 70;
    const dom = domainsMap.get(session.domainId);
    const topicName = session.core?.problem?.title?.replace(/^Problema Aplicado en:\s*/i, '') || session.domainName;

    const currentLessonMode = session.lessonMode || sessionLessonMode;
    const currentDifficultyLevel = session.difficultyLevel || sessionDifficultyLevel;

    const newLog: DailyStudyLog = {
      id: `log-ped-${Date.now()}`,
      subjectId: session.domainId,
      date: todayStr,
      durationMinutes,
      activityType: currentLessonMode === 'difficulty' ? 'deliberate_practice' : (session.isSundaySRS ? 'srs_warmup' : 'high_performance_exam'),
      bloomLevelAchieved: evaluation.bloomMastery,
      topicsCovered: currentLessonMode === 'difficulty'
        ? `${session.core.problem.title} (Nivel ${currentDifficultyLevel ? currentDifficultyLevel.toUpperCase() : 'ESTÁNDAR'})`
        : `${session.core.problem.title} (${session.isSundaySRS ? 'Repaso SRS' : `Bloom Nivel ${evaluation.bloomMastery}`})`,
      outputSummary: evaluation.precisionRubric
        ? `Evaluación por Rúbrica (${evaluation.score}% dominio): Rigor ${evaluation.precisionRubric.conceptualRigor}/30, Metodología ${evaluation.precisionRubric.methodology}/40, Exactitud ${evaluation.precisionRubric.accuracy}/30. ${evaluation.summary.slice(0, 100)}...`
        : `Evaluación adaptativa: ${evaluation.score}/100 pts. ${evaluation.summary.slice(0, 140)}...`,
      comprehensionScore: evaluation.score >= 85 ? 5 : evaluation.score >= 70 ? 4 : evaluation.score >= 50 ? 3 : 2,
      keyTakeaway: evaluation.strengths[0] || 'Práctica deliberada completada con éxito.',
      notes: studentAnswer.slice(0, 200),
      createdAt: now.toISOString(),
    };

    // New Archived Lesson (saved by date, even if not passed / score < 70)
    const newArchivedLesson: ArchivedLesson = {
      id: `arch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      domainId: session.domainId,
      domainName: session.domainName,
      subArea: dom?.subArea || '',
      macroDomainId: session.macroDomainId,
      topic: topicName,
      dayName: session.dayOfWeek,
      completedAt: now.toISOString(),
      date: todayStr,
      durationMinutes,
      score: evaluation.score,
      passed, // true if score >= 70, false otherwise; archived regardless!
      bloomLevel: session.bloomFocus,
      bloomMastery: evaluation.bloomMastery,
      lessonMode: currentLessonMode,
      difficultyLevel: currentDifficultyLevel,
      precisionRubric: evaluation.precisionRubric,
      studentAnswer,
      session,
      evaluation,
      isArchived: true,
    };

    // Direct Link to Active Goals
    let affectedGoalsCount = 0;
    const addedHours = Number((durationMinutes / 60).toFixed(1));

    const updatedGoals = data.goals.map((g) => {
      const isMatch =
        g.category === 'all' ||
        (dom && g.category === dom.macroDomainId) ||
        g.subjectId === session.domainId;

      if (!isMatch) return g;

      affectedGoalsCount++;
      if (g.targetType === 'hours') {
        return { ...g, currentValue: Number((g.currentValue + addedHours).toFixed(1)) };
      }
      if (g.targetType === 'sessions') {
        return { ...g, currentValue: g.currentValue + 1 };
      }
      if (g.targetType === 'exercises') {
        return { ...g, currentValue: g.currentValue + 1 };
      }
      return g;
    });

    // Mark matching day in weekly plan as completed (if in weekly mode or matching topic)
    const updatedWeeklyPlans = data.weeklyPlans.map((wp) => {
      if (wp.domainId !== session.domainId) return wp;
      return {
        ...wp,
        days: wp.days.map((d) => {
          const dayMatch = session.dayOfWeek && d.dayName.toLowerCase().startsWith(session.dayOfWeek.slice(0, 3).toLowerCase());
          if (dayMatch || d.topic === topicName) {
            return { ...d, completed: true };
          }
          return d;
        }),
      };
    });

    // If difficulty lesson, mark corresponding lesson as completed in difficultyTracks
    const updatedDifficultyTracks = (data.difficultyTracks || []).map((dt) => {
      if (dt.domainId !== session.domainId) return dt;
      const updateList = (list: DifficultyLessonItem[]) =>
        list.map((item) => {
          if (item.id === sessionLessonItem?.id || item.title === topicName) {
            return {
              ...item,
              completed: true,
              completedScore: evaluation.score,
              completedAt: now.toISOString(),
            };
          }
          return item;
        });

      return {
        ...dt,
        levels: {
          basico: updateList(dt.levels.basico),
          intermedio: updateList(dt.levels.intermedio),
          avanzado: updateList(dt.levels.avanzado),
          experto: updateList(dt.levels.experto),
        },
      };
    });

    setData((prev) => ({
      ...prev,
      logs: [newLog, ...prev.logs],
      goals: updatedGoals,
      archivedLessons: [newArchivedLesson, ...(prev.archivedLessons || [])],
      weeklyPlans: updatedWeeklyPlans,
      difficultyTracks: updatedDifficultyTracks,
    }));

    setLinkNotification(
      `¡Lección archivada (${passed ? 'Aprobada' : 'No aprobada'}, ${evaluation.score} pts / %)! Se añadieron ${durationMinutes} min al registro diario.`
    );
    setTimeout(() => setLinkNotification(null), 4500);
  };

  // Handlers for Archived Lessons
  const handleDeleteArchivedLesson = (lessonId: string) => {
    setData((prev) => ({
      ...prev,
      archivedLessons: (prev.archivedLessons || []).filter((l) => l.id !== lessonId),
    }));

    if (selectedArchivedLesson?.id === lessonId) {
      setSelectedArchivedLesson(null);
    }

    setLinkNotification('Lección archivada eliminada permanentemente.');
    setTimeout(() => setLinkNotification(null), 3000);
  };

  const handleUnarchiveLesson = (lessonId: string) => {
    const lessonToUnarchive = (data.archivedLessons || []).find((l) => l.id === lessonId);
    if (!lessonToUnarchive) return;

    // Remove from archived lessons
    const updatedArchived = (data.archivedLessons || []).filter((l) => l.id !== lessonId);

    // Mark matching weekly plan day as uncompleted (completed: false)
    const updatedWeeklyPlans = data.weeklyPlans.map((wp) => {
      if (wp.domainId !== lessonToUnarchive.domainId) return wp;
      return {
        ...wp,
        days: wp.days.map((d) => {
          const dayMatch = lessonToUnarchive.dayName && d.dayName.toLowerCase().startsWith(lessonToUnarchive.dayName.slice(0, 3).toLowerCase());
          if (d.topic === lessonToUnarchive.topic || dayMatch) {
            return { ...d, completed: false };
          }
          return d;
        }),
      };
    });

    // Mark matching difficulty lesson as uncompleted (completed: false)
    const updatedDifficultyTracks = (data.difficultyTracks || []).map((dt) => {
      if (dt.domainId !== lessonToUnarchive.domainId) return dt;
      const unarchiveList = (list: DifficultyLessonItem[]) =>
        list.map((item) => {
          if (item.title === lessonToUnarchive.topic) {
            return {
              ...item,
              completed: false,
              completedScore: undefined,
              completedAt: undefined,
            };
          }
          return item;
        });

      return {
        ...dt,
        levels: {
          basico: unarchiveList(dt.levels.basico),
          intermedio: unarchiveList(dt.levels.intermedio),
          avanzado: unarchiveList(dt.levels.avanzado),
          experto: unarchiveList(dt.levels.experto),
        },
      };
    });

    setData((prev) => ({
      ...prev,
      archivedLessons: updatedArchived,
      weeklyPlans: updatedWeeklyPlans,
      difficultyTracks: updatedDifficultyTracks,
    }));

    if (selectedArchivedLesson?.id === lessonId) {
      setSelectedArchivedLesson(null);
    }

    setLinkNotification(
      `Lección "${lessonToUnarchive.topic}" des-archivada con éxito. Ya puedes volver a cursarla con regeneración IA activa.`
    );
    setTimeout(() => setLinkNotification(null), 4500);
  };

  // Handlers for Goals
  const handleSaveGoal = (goalData: Omit<Goal, 'id' | 'createdAt'>, goalId?: string) => {
    if (goalId) {
      setData((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === goalId ? { ...g, ...goalData } : g)),
      }));
    } else {
      const newGoal: Goal = {
        ...goalData,
        id: `goal-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({
        ...prev,
        goals: [newGoal, ...prev.goals],
      }));
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== goalId),
    }));
  };

  const handleUpdateGoalProgress = (goalId: string, delta: number) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        const nextVal = Math.max(0, Number((g.currentValue + delta).toFixed(1)));
        return { ...g, currentValue: nextVal };
      }),
    }));
  };

  // Handlers for Domains
  const handleSaveDomain = async (domainData: Omit<LearningDomain, 'id' | 'createdAt'>, domainId?: string) => {
    if (domainId) {
      setData((prev) => ({
        ...prev,
        domains: prev.domains.map((d) => (d.id === domainId ? { ...d, ...domainData } : d)),
      }));
    } else {
      const newDomain: LearningDomain = {
        ...domainData,
        id: `dom-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };

      // Filter concepts belonging strictly to this concept database
      const dbKey = newDomain.conceptDatabaseKey || `db-${newDomain.id}`;
      const matchingDbConcepts = data.concepts.filter(
        (c) =>
          c.databaseKey === dbKey ||
          c.domainId === newDomain.id ||
          c.linkedDomainIds?.includes(newDomain.id)
      );

      // Generate the weekly plan lessons utilizing EXCLUSIVELY the context of:
      // 1. "Nombre del Dominio / Tema" (newDomain.name)
      // 2. "Ruta / Selector Principal" (newDomain.macroDomainId)
      // 3. "Sub-Área o Especialidad" (newDomain.subArea)
      // 4. "Base de Datos Conceptual" (dbKey + matchingDbConcepts)
      let generatedPlan: WeeklyStudyPlan | null = null;
      try {
        const res = await fetch('/api/pedagogical/generate-weekly-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domainName: newDomain.name,
            macroDomainId: newDomain.macroDomainId,
            subArea: newDomain.subArea,
            conceptDatabaseKey: dbKey,
            databaseConcepts: matchingDbConcepts,
            currentLevel: newDomain.level,
            topics: newDomain.topics,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            generatedPlan = {
              id: `plan-${newDomain.id}-${Date.now()}`,
              domainId: newDomain.id,
              domainName: newDomain.name,
              macroDomainId: newDomain.macroDomainId,
              weekTitle: json.data.weekTitle || `Plan Semanal: ${newDomain.name} (${newDomain.subArea})`,
              createdAt: new Date().toISOString(),
              days: json.data.days.map((d: any) => ({
                ...d,
                isSundaySRS: d.dayName.toLowerCase().includes('domingo'),
              })),
            };
          }
        }
      } catch (err) {
        console.warn('AI weekly plan generation error, utilizing deterministic pedagogical engine:', err);
      }

      if (!generatedPlan) {
        generatedPlan = generateWeeklyStudyPlan(newDomain, undefined, matchingDbConcepts);
      }

      setData((prev) => ({
        ...prev,
        domains: [...prev.domains, newDomain],
        weeklyPlans: [
          ...prev.weeklyPlans.filter((p) => p.domainId !== newDomain.id),
          generatedPlan!,
        ],
      }));
    }
  };

  const handleDeleteDomain = (domainId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este dominio de aprendizaje?')) {
      setData((prev) => ({
        ...prev,
        domains: prev.domains.filter((d) => d.id !== domainId),
      }));
    }
  };

  const handleToggleMilestone = (domainId: string, milestoneId: string) => {
    setData((prev) => ({
      ...prev,
      domains: prev.domains.map((d) => {
        if (d.id !== domainId) return d;
        return {
          ...d,
          milestones: d.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            const completed = !m.completed;
            return {
              ...m,
              completed,
              completedAt: completed ? formatDateISO(new Date()) : undefined,
            };
          }),
        };
      }),
    }));
  };

  const handleAddMilestone = (domainId: string, title: string) => {
    setData((prev) => ({
      ...prev,
      domains: prev.domains.map((d) => {
        if (d.id !== domainId) return d;
        return {
          ...d,
          milestones: [
            ...d.milestones,
            {
              id: `m-${Date.now()}`,
              title,
              completed: false,
            },
          ],
        };
      }),
    }));
  };

  // Handlers for Folders
  const handleOpenAddFolder = (macroDomainId: string, parentFolderId?: string | null) => {
    setActiveFolderMacroId(macroDomainId);
    setActiveFolderParentId(parentFolderId || null);
    setFolderToEdit(null);
    setIsFolderModalOpen(true);
  };

  const handleOpenEditFolder = (folder: LearningFolder) => {
    setActiveFolderMacroId(folder.macroDomainId);
    setActiveFolderParentId(folder.parentFolderId || null);
    setFolderToEdit(folder);
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = (
    folderData: Omit<LearningFolder, 'id' | 'createdAt'>,
    folderId?: string
  ) => {
    if (folderId) {
      setData((prev) => ({
        ...prev,
        folders: prev.folders.map((f) => (f.id === folderId ? { ...f, ...folderData } : f)),
      }));
    } else {
      const newFolder: LearningFolder = {
        ...folderData,
        id: `folder-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setData((prev) => ({
        ...prev,
        folders: [...prev.folders, newFolder],
      }));
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta carpeta? Los temas contenidos no se borrarán, pero se moverán a la raíz de la ruta.')) {
      setData((prev) => ({
        ...prev,
        folders: prev.folders.filter((f) => f.id !== folderId && f.parentFolderId !== folderId),
        domains: prev.domains.map((d) => (d.folderId === folderId ? { ...d, folderId: null } : d)),
      }));
    }
  };

  // Handlers for Custom Selectors / Macro Domains
  const handleSaveMacroDomain = (newMacro: MacroDomainInfo) => {
    setData((prev) => ({
      ...prev,
      macroDomains: [...prev.macroDomains, newMacro],
    }));
  };

  const handleOpenAddDomain = (macroDomainId?: string, folderId?: string | null) => {
    setDomainTargetMacroId(macroDomainId || 'formal_quantitative');
    setDomainTargetFolderId(folderId || null);
    setDomainToEdit(null);
    setIsDomainModalOpen(true);
  };

  // Launching Pedagogical Sessions
  const handleStartPedagogicalSession = (
    domain: LearningDomain,
    dayName: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo' = 'lunes',
    customTopic?: string,
    targetBloomLevel?: BloomLevel,
    isExtended: boolean = false,
    selectedConceptIds?: string[],
    preparedProblem?: CoreExamProblem,
    preparedMcqQuestions?: CoreMCQQuestion[]
  ) => {
    setPedagogicalTargetDomain(domain);
    setSessionLessonMode('weekly');
    setSessionDifficultyLevel(undefined);
    setSessionLessonItem(undefined);
    setSessionDayName(dayName);
    setSessionCustomTopic(customTopic);
    setSessionTargetBloom(targetBloomLevel);
    setSessionIsExtended(isExtended);
    setSessionCustomConceptIds(selectedConceptIds || []);
    setSessionPreparedProblem(preparedProblem);
    setSessionPreparedMcqQuestions(preparedMcqQuestions);
    setIsPedagogicalSessionOpen(true);
  };

  const handleLaunchDifficultySession = (
    domain: LearningDomain,
    lesson: DifficultyLessonItem
  ) => {
    setPedagogicalTargetDomain(domain);
    setSessionLessonMode('difficulty');
    setSessionDifficultyLevel(lesson.level);
    setSessionLessonItem(lesson);
    setSessionDayName('lunes');
    setSessionCustomTopic(lesson.title);
    setSessionTargetBloom(undefined);
    setSessionIsExtended(false);
    setSessionCustomConceptIds(lesson.conceptIds || []);
    setSessionPreparedProblem(lesson.preparedProblem);
    setSessionPreparedMcqQuestions(lesson.preparedMcqQuestions);
    setIsPedagogicalSessionOpen(true);
  };

  const handleSaveDifficultyTracks = (tracks: DomainDifficultyTrack[]) => {
    setData((prev) => ({
      ...prev,
      difficultyTracks: tracks,
    }));
  };

  const handleOpenWeeklyPlan = (domain: LearningDomain) => {
    setWeeklyPlanDomain(domain);
    setIsWeeklyPlanOpen(true);
  };

  const handleSaveWeeklyPlan = (plan: WeeklyStudyPlan) => {
    setData((prev) => ({
      ...prev,
      weeklyPlans: [...prev.weeklyPlans.filter((p) => p.domainId !== plan.domainId), plan],
    }));
  };

  const handleQuickLog = (domainId: string) => {
    setLogInitialDomainId(domainId);
    setLogInitialDuration(60);
    setIsLogModalOpen(true);
  };

  const handleTimerComplete = (domainId: string, durationMinutes: number) => {
    setLogInitialDomainId(domainId);
    setLogInitialDuration(durationMinutes);
    setIsLogModalOpen(true);
  };

  const handleDateSelectedFromHeatmap = (dateStr: string) => {
    setSelectedDateFilter(dateStr);
    setCurrentTab('logs');
  };

  // Handlers for Concepts
  const handleOpenConceptDatabase = (domain: LearningDomain) => {
    setConceptDbDomain(domain);
    setIsConceptDbOpen(true);
  };

  const handleOpenAddConcept = (targetDomain?: LearningDomain, initialFolderId?: string | null) => {
    if (targetDomain) {
      setConceptDbDomain(targetDomain);
    }
    setConceptInitialFolderId(initialFolderId || null);
    setConceptToEdit(null);
    setIsConceptModalOpen(true);
  };

  const handleOpenEditConcept = (concept: ConceptItem) => {
    setConceptToEdit(concept);
    setIsConceptModalOpen(true);
  };

  const handleSaveConceptFolder = (
    folderData: Omit<ConceptFolder, 'id' | 'createdAt'>,
    folderId?: string
  ) => {
    if (folderId) {
      setData((prev) => ({
        ...prev,
        conceptFolders: prev.conceptFolders.map((f) =>
          f.id === folderId ? { ...f, ...folderData } : f
        ),
      }));
    } else {
      const newFolder: ConceptFolder = {
        ...folderData,
        id: `cf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setData((prev) => ({
        ...prev,
        conceptFolders: [...prev.conceptFolders, newFolder],
      }));
    }
  };

  const handleDeleteConceptFolder = (folderId: string) => {
    setData((prev) => {
      const folder = prev.conceptFolders.find((f) => f.id === folderId);
      const targetParentId = folder ? folder.parentFolderId || null : null;

      const updatedConcepts = prev.concepts.map((c) =>
        c.folderId === folderId ? { ...c, folderId: targetParentId } : c
      );

      const updatedFolders = prev.conceptFolders
        .filter((f) => f.id !== folderId)
        .map((f) =>
          f.parentFolderId === folderId ? { ...f, parentFolderId: targetParentId } : f
        );

      return {
        ...prev,
        conceptFolders: updatedFolders,
        concepts: updatedConcepts,
      };
    });
  };

  const handleMoveConceptToFolder = (conceptId: string, targetFolderId: string | null) => {
    setData((prev) => ({
      ...prev,
      concepts: prev.concepts.map((c) =>
        c.id === conceptId
          ? { ...c, folderId: targetFolderId, updatedAt: new Date().toISOString() }
          : c
      ),
    }));
  };

  const handleSaveConcept = (
    conceptData: Omit<ConceptItem, 'id' | 'createdAt'>,
    conceptId?: string
  ) => {
    if (conceptId) {
      setData((prev) => ({
        ...prev,
        concepts: prev.concepts.map((c) =>
          c.id === conceptId
            ? { ...c, ...conceptData, updatedAt: new Date().toISOString() }
            : c
        ),
      }));
    } else {
      const newConcept: ConceptItem = {
        ...conceptData,
        id: `cnc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setData((prev) => ({
        ...prev,
        concepts: [...prev.concepts, newConcept],
      }));
    }
  };

  const handleDeleteConcept = (conceptId: string) => {
    setData((prev) => ({
      ...prev,
      concepts: prev.concepts.filter((c) => c.id !== conceptId),
    }));
  };

  const handleChangeConceptStatus = (conceptId: string, newStatus: ConceptStatus) => {
    setData((prev) => ({
      ...prev,
      concepts: prev.concepts.map((c) =>
        c.id === conceptId
          ? {
              ...c,
              status: newStatus,
              lastStudiedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }));
  };

  const handleAddMultipleConcepts = (newConcepts: ConceptItem[]) => {
    setData((prev) => {
      const existingIds = new Set(prev.concepts.map((c) => c.id));
      const filteredNew = newConcepts.filter((c) => !existingIds.has(c.id));
      return {
        ...prev,
        concepts: [...prev.concepts, ...filteredNew],
      };
    });
  };

  const handleReplaceConcepts = (
    scope: { databaseKey: string; folderId: string | null },
    newConcepts: ConceptItem[]
  ) => {
    setData((prev) => {
      const filtered = prev.concepts.filter((c) => {
        if (c.databaseKey !== scope.databaseKey) return true;
        if (scope.folderId !== null) {
          return c.folderId !== scope.folderId;
        }
        return false;
      });
      return {
        ...prev,
        concepts: [...filtered, ...newConcepts],
      };
    });
  };

  // Prior concepts for the active pedagogical session (strictly filtered to matching macroDomain and prior learning statuses)
  const activeSessionPriorConcepts = useMemo(() => {
    if (!pedagogicalTargetDomain) return [];
    const dbKey = pedagogicalTargetDomain.conceptDatabaseKey || `db-${pedagogicalTargetDomain.id}`;
    return data.concepts.filter(
      (c) =>
        c.macroDomainId === pedagogicalTargetDomain.macroDomainId &&
        (c.databaseKey === dbKey ||
          c.domainId === pedagogicalTargetDomain.id ||
          c.linkedDomainIds?.includes(pedagogicalTargetDomain.id)) &&
        (c.status === 'visto' || c.status === 'dominado' || c.status === 'a_reforzar')
    );
  }, [pedagogicalTargetDomain, data.concepts]);

  // Associated concepts for the active session (prioritizes explicitly selected concepts from custom lesson, or any table concepts in the domain)
  const activeSessionAssociatedConcepts = useMemo(() => {
    if (!pedagogicalTargetDomain) return [];
    if (sessionCustomConceptIds.length > 0) {
      return data.concepts.filter((c) => sessionCustomConceptIds.includes(c.id));
    }
    const dbKey = pedagogicalTargetDomain.conceptDatabaseKey || `db-${pedagogicalTargetDomain.id}`;
    return data.concepts.filter(
      (c) =>
        (c.domainId === pedagogicalTargetDomain.id ||
          c.databaseKey === dbKey ||
          c.linkedDomainIds?.includes(pedagogicalTargetDomain.id)) &&
        Array.isArray(c.tableData) &&
        c.tableData.length >= 2
    );
  }, [pedagogicalTargetDomain, sessionCustomConceptIds, data.concepts]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenLogModal={() => {
          setLogInitialDomainId(undefined);
          setLogInitialDuration(60);
          setIsLogModalOpen(true);
        }}
        onOpenTimerModal={() => setIsTimerModalOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenArchivedModal={() => setIsArchivedModalOpen(true)}
        archivedCount={(data.archivedLessons || []).length}
        streakInfo={streakInfo}
        driveSyncStatus={driveSyncStatus}
        onSignInGoogle={handleSignInGoogle}
        onSyncNow={handleSyncWithDrive}
      />

      {/* Floating Goal Linking Feedback Toast */}
      {linkNotification && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-950 border border-emerald-500/80 text-emerald-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 max-w-md animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{linkNotification}</span>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* TAB: DASHBOARD */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <MetricCards
              streakInfo={streakInfo}
              totalHours={totalHours}
              totalSessions={totalSessions}
              weeklyHours={weeklyHours}
              preferences={data.preferences}
              avgComprehension={avgComprehension}
              onOpenGoalsTab={() => setCurrentTab('goals')}
            />

            {/* Visual Heatmap Calendar */}
            <HeatmapCalendar
              weeks={heatmapWeeks}
              onSelectDate={handleDateSelectedFromHeatmap}
            />

            {/* Split row: Weekly Progress Chart + Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeeklyProgressChart
                days={weeklyData}
                dailyTargetMinutes={data.preferences.dailyGoalMinutes}
                onSelectDate={handleDateSelectedFromHeatmap}
              />
              <CategoryDistribution
                metrics={macroMetrics}
                onSelectCategory={() => setCurrentTab('domains')}
              />
            </div>

            {/* Quick Goals Spotlight */}
            <GoalsSection
              goals={data.goals}
              domains={data.domains}
              onAddGoal={() => {
                setGoalToEdit(null);
                setIsGoalModalOpen(true);
              }}
              onEditGoal={(g) => {
                setGoalToEdit(g);
                setIsGoalModalOpen(true);
              }}
              onDeleteGoal={handleDeleteGoal}
              onUpdateGoalProgress={handleUpdateGoalProgress}
            />
          </div>
        )}

        {/* TAB: DAILY LOGS FEED */}
        {currentTab === 'logs' && (
          <DailyLogFeed
            logs={data.logs}
            domains={data.domains}
            selectedDateFilter={selectedDateFilter}
            onClearDateFilter={() => setSelectedDateFilter(null)}
            onDeleteLog={handleDeleteLog}
            onOpenLogModal={() => {
              setLogInitialDomainId(undefined);
              setLogInitialDuration(60);
              setIsLogModalOpen(true);
            }}
          />
        )}

        {/* TAB: RUTAS DE APRENDIZAJE */}
        {currentTab === 'domains' && (
          <DomainsView
            domains={data.domains}
            folders={data.folders}
            macroDomains={data.macroDomains}
            concepts={data.concepts}
            logs={data.logs}
            onAddDomain={handleOpenAddDomain}
            onEditDomain={(d) => {
              setDomainTargetMacroId(d.macroDomainId);
              setDomainTargetFolderId(d.folderId || null);
              setDomainToEdit(d);
              setIsDomainModalOpen(true);
            }}
            onDeleteDomain={handleDeleteDomain}
            onAddFolder={handleOpenAddFolder}
            onEditFolder={handleOpenEditFolder}
            onDeleteFolder={handleDeleteFolder}
            onOpenNewMacroDomainModal={() => setIsNewMacroModalOpen(true)}
            onToggleMilestone={handleToggleMilestone}
            onAddMilestone={handleAddMilestone}
            onStartPedagogicalSession={(d) => handleStartPedagogicalSession(d, 'lunes')}
            onOpenWeeklyPlan={handleOpenWeeklyPlan}
            onOpenLessonsHub={(d) => {
              setLessonsHubSelectedDomainId(d.id);
              setCurrentTab('lessons');
            }}
            onOpenConceptDatabase={handleOpenConceptDatabase}
            onQuickLog={handleQuickLog}
          />
        )}

        {/* TAB: LECCIONES (HUB UNIFICADO: NIVELES DE DIFICULTAD O PLAN SEMANAL) */}
        {currentTab === 'lessons' && (
          <LessonsHubView
            domains={data.domains}
            selectedDomainId={lessonsHubSelectedDomainId || data.domains[0]?.id || null}
            onSelectDomainId={(id) => setLessonsHubSelectedDomainId(id)}
            weeklyPlans={data.weeklyPlans}
            difficultyTracks={data.difficultyTracks || []}
            allConcepts={data.concepts}
            onSaveWeeklyPlan={handleSaveWeeklyPlan}
            onSaveDifficultyTracks={handleSaveDifficultyTracks}
            onOpenWeeklyPlanModal={handleOpenWeeklyPlan}
            onLaunchWeeklySession={handleStartPedagogicalSession}
            onLaunchDifficultySession={handleLaunchDifficultySession}
          />
        )}

        {/* TAB: GOALS */}
        {currentTab === 'goals' && (
          <GoalsSection
            goals={data.goals}
            domains={data.domains}
            onAddGoal={() => {
              setGoalToEdit(null);
              setIsGoalModalOpen(true);
            }}
            onEditGoal={(g) => {
              setGoalToEdit(g);
              setIsGoalModalOpen(true);
            }}
            onDeleteGoal={handleDeleteGoal}
            onUpdateGoalProgress={handleUpdateGoalProgress}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CognitiveTrack · Plataforma de Aprendizaje de Alto Rendimiento</span>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <span>Sistemas Físicos y Matemáticos</span>
            <span aria-hidden="true">·</span>
            <span>Culturas e Idiomas</span>
            <span aria-hidden="true">·</span>
            <span>Código y Tecnología</span>
            <span aria-hidden="true">·</span>
            <span>Sociedad y Entorno</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <PedagogicalSessionModal
        isOpen={isPedagogicalSessionOpen}
        onClose={() => {
          setIsPedagogicalSessionOpen(false);
          setSessionPreparedProblem(undefined);
          setSessionPreparedMcqQuestions(undefined);
          setSessionLessonMode('weekly');
          setSessionDifficultyLevel(undefined);
          setSessionLessonItem(undefined);
        }}
        domain={pedagogicalTargetDomain}
        dayName={sessionDayName}
        customTopic={sessionCustomTopic}
        targetBloomLevel={sessionTargetBloom}
        isExtendedLesson={sessionIsExtended}
        lessonMode={sessionLessonMode}
        difficultyLevel={sessionDifficultyLevel}
        priorConcepts={activeSessionPriorConcepts}
        associatedConcepts={activeSessionAssociatedConcepts}
        initialProblem={sessionPreparedProblem}
        initialMcqQuestions={sessionPreparedMcqQuestions}
        onCompleteAndLinkToGoals={handleCompletePedagogicalSession}
      />

      {/* Review Modal for Archived Lesson (Exclusively WITHOUT AI buttons) */}
      {selectedArchivedLesson && (
        <PedagogicalSessionModal
          isOpen={Boolean(selectedArchivedLesson)}
          onClose={() => setSelectedArchivedLesson(null)}
          domain={
            domainsMap.get(selectedArchivedLesson.domainId) || {
              id: selectedArchivedLesson.domainId,
              name: selectedArchivedLesson.domainName,
              macroDomainId: selectedArchivedLesson.macroDomainId,
              subArea: selectedArchivedLesson.subArea,
              topics: [selectedArchivedLesson.topic],
              milestones: [],
              resources: [],
              level: 'Universitario / Profesional',
              description: selectedArchivedLesson.topic,
              targetHours: 40,
              createdAt: selectedArchivedLesson.completedAt,
            }
          }
          dayName={
            (selectedArchivedLesson.dayName?.toLowerCase() as any) || 'lunes'
          }
          customTopic={selectedArchivedLesson.topic}
          targetBloomLevel={selectedArchivedLesson.bloomLevel}
          lessonMode={selectedArchivedLesson.lessonMode}
          difficultyLevel={selectedArchivedLesson.difficultyLevel}
          isArchived={true}
          archivedDate={selectedArchivedLesson.date}
          archivedScore={selectedArchivedLesson.score}
          initialSession={selectedArchivedLesson.session}
          initialEvaluation={selectedArchivedLesson.evaluation}
          initialStudentAnswer={selectedArchivedLesson.studentAnswer}
          initialStep="feedback"
          onUnarchive={() => handleUnarchiveLesson(selectedArchivedLesson.id)}
          onCompleteAndLinkToGoals={() => {}}
        />
      )}

      {/* Archived Lessons Management Modal */}
      {isArchivedModalOpen && (
        <ArchivedLessonsModal
          isOpen={isArchivedModalOpen}
          onClose={() => setIsArchivedModalOpen(false)}
          archivedLessons={data.archivedLessons || []}
          domains={data.domains}
          onDeleteLesson={handleDeleteArchivedLesson}
          onUnarchiveLesson={handleUnarchiveLesson}
          onViewLessonDetails={(lesson) => {
            setSelectedArchivedLesson(lesson);
          }}
        />
      )}

      {isWeeklyPlanOpen && weeklyPlanDomain && (
        <WeeklyPlanModal
          isOpen={isWeeklyPlanOpen}
          onClose={() => setIsWeeklyPlanOpen(false)}
          domain={weeklyPlanDomain}
          activePlan={
            data.weeklyPlans.find((p) => p.domainId === weeklyPlanDomain?.id) || null
          }
          allConcepts={data.concepts}
          onSavePlan={handleSaveWeeklyPlan}
          onLaunchDaySession={handleStartPedagogicalSession}
        />
      )}

      {isConceptDbOpen && conceptDbDomain && (
        <ConceptDatabaseView
          isOpen={isConceptDbOpen}
          onClose={() => {
            setIsConceptDbOpen(false);
            setConceptDbDomain(null);
            setConceptInitialFolderId(null);
          }}
          domain={conceptDbDomain}
          concepts={data.concepts}
          conceptFolders={data.conceptFolders}
          allDomains={data.domains}
          onAddConcept={handleOpenAddConcept}
          onEditConcept={handleOpenEditConcept}
          onDeleteConcept={handleDeleteConcept}
          onChangeConceptStatus={handleChangeConceptStatus}
          onMoveConceptToFolder={handleMoveConceptToFolder}
          onAddMultipleConcepts={handleAddMultipleConcepts}
          onReplaceConcepts={handleReplaceConcepts}
          onSaveConceptFolder={handleSaveConceptFolder}
          onDeleteConceptFolder={handleDeleteConceptFolder}
        />
      )}

      {isConceptModalOpen && conceptDbDomain && (
        <ConceptModal
          isOpen={isConceptModalOpen}
          onClose={() => {
            setIsConceptModalOpen(false);
            setConceptToEdit(null);
            setConceptInitialFolderId(null);
          }}
          domain={conceptDbDomain}
          conceptFolders={data.conceptFolders}
          initialFolderId={conceptInitialFolderId}
          conceptToEdit={conceptToEdit}
          isGoogleDriveSignedIn={driveSyncStatus.isSignedIn}
          onSignInSuccess={handleSignInGoogle}
          onSaveConcept={handleSaveConcept}
        />
      )}

      {isLogModalOpen && (
        <LogEntryModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          domains={data.domains}
          initialDomainId={logInitialDomainId}
          initialDurationMinutes={logInitialDuration}
          onSaveLog={handleSaveLog}
        />
      )}

      {isTimerModalOpen && (
        <StudyTimerModal
          isOpen={isTimerModalOpen}
          onClose={() => setIsTimerModalOpen(false)}
          domains={data.domains}
          onCompleteSession={handleTimerComplete}
        />
      )}

      {isGoalModalOpen && (
        <GoalModal
          isOpen={isGoalModalOpen}
          onClose={() => {
            setIsGoalModalOpen(false);
            setGoalToEdit(null);
          }}
          domains={data.domains}
          goalToEdit={goalToEdit}
          onSaveGoal={handleSaveGoal}
        />
      )}

      {isDomainModalOpen && (
        <DomainModal
          isOpen={isDomainModalOpen}
          onClose={() => {
            setIsDomainModalOpen(false);
            setDomainToEdit(null);
          }}
          macroDomains={data.macroDomains}
          availableFolders={data.folders}
          existingConcepts={data.concepts}
          activeMacroDomainId={domainTargetMacroId}
          activeFolderId={domainTargetFolderId}
          domainToEdit={domainToEdit}
          onSaveDomain={handleSaveDomain}
        />
      )}

      {isFolderModalOpen && (
        <FolderModal
          isOpen={isFolderModalOpen}
          onClose={() => {
            setIsFolderModalOpen(false);
            setFolderToEdit(null);
          }}
          macroDomains={data.macroDomains}
          availableFolders={data.folders}
          activeMacroDomainId={activeFolderMacroId}
          currentFolderId={activeFolderParentId}
          folderToEdit={folderToEdit}
          onSaveFolder={handleSaveFolder}
        />
      )}

      {isNewMacroModalOpen && (
        <NewMacroDomainModal
          isOpen={isNewMacroModalOpen}
          onClose={() => setIsNewMacroModalOpen(false)}
          onSaveMacroDomain={handleSaveMacroDomain}
        />
      )}

      {isDataModalOpen && (
        <DataManagementModal
          isOpen={isDataModalOpen}
          onClose={() => setIsDataModalOpen(false)}
          preferences={data.preferences}
          onUpdatePreferences={(newPrefs) => setData((prev) => ({ ...prev, preferences: newPrefs }))}
          onExportBackup={() => exportBackupJSON(data)}
          onImportBackup={(importedData) => setData(importedData)}
          onResetDefaults={() => setData(resetToSampleData())}
          driveSyncStatus={driveSyncStatus}
          onSignInGoogle={handleSignInGoogle}
          onSignOutGoogle={handleSignOutGoogle}
          onSyncWithDrive={handleSyncWithDrive}
          onRestoreFromDrive={handleRestoreFromDrive}
        />
      )}
    </div>
  );
}
