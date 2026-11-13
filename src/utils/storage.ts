import {
  Goal,
  LearningDomain,
  LearningFolder,
  MacroDomainInfo,
  DailyStudyLog,
  UserPreferences,
  WeeklyStudyPlan,
  ConceptItem,
  ConceptFolder,
  ArchivedLesson,
  DomainDifficultyTrack,
} from '../types/learning';
import {
  INITIAL_DOMAINS,
  INITIAL_FOLDERS,
  INITIAL_MACRO_DOMAINS,
  INITIAL_GOALS,
  INITIAL_PREFERENCES,
  generateInitialLogs,
} from '../data/initialData';
import { INITIAL_CONCEPTS, INITIAL_CONCEPT_FOLDERS } from '../data/initialConcepts';

const STORAGE_KEYS = {
  DOMAINS: 'cognitivetrack_domains_v3',
  FOLDERS: 'cognitivetrack_folders_v3',
  MACRO_DOMAINS: 'cognitivetrack_macro_domains_v3',
  CONCEPTS: 'cognitivetrack_concepts_v3',
  CONCEPT_FOLDERS: 'cognitivetrack_concept_folders_v3',
  LOGS: 'cognitivetrack_logs_v3',
  GOALS: 'cognitivetrack_goals_v3',
  PREFERENCES: 'cognitivetrack_prefs_v3',
  WEEKLY_PLANS: 'cognitivetrack_plans_v3',
  ARCHIVED_LESSONS: 'cognitivetrack_archived_lessons_v1',
  DIFFICULTY_TRACKS: 'cognitivetrack_difficulty_tracks_v1',
};

export interface AppStateData {
  domains: LearningDomain[];
  folders: LearningFolder[];
  macroDomains: MacroDomainInfo[];
  concepts: ConceptItem[];
  conceptFolders: ConceptFolder[];
  logs: DailyStudyLog[];
  goals: Goal[];
  preferences: UserPreferences;
  weeklyPlans: WeeklyStudyPlan[];
  archivedLessons: ArchivedLesson[];
  difficultyTracks: DomainDifficultyTrack[];
}

export function loadStoredData(): AppStateData {
  try {
    const rawDomains = localStorage.getItem(STORAGE_KEYS.DOMAINS);
    const rawFolders = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    const rawMacro = localStorage.getItem(STORAGE_KEYS.MACRO_DOMAINS);
    const rawConcepts = localStorage.getItem(STORAGE_KEYS.CONCEPTS);
    const rawConceptFolders = localStorage.getItem(STORAGE_KEYS.CONCEPT_FOLDERS);
    const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    const rawGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    const rawPrefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    const rawPlans = localStorage.getItem(STORAGE_KEYS.WEEKLY_PLANS);
    const rawArchived = localStorage.getItem(STORAGE_KEYS.ARCHIVED_LESSONS);
    const rawDifficulty = localStorage.getItem(STORAGE_KEYS.DIFFICULTY_TRACKS);

    const domains: LearningDomain[] = rawDomains ? JSON.parse(rawDomains) : INITIAL_DOMAINS;
    const folders: LearningFolder[] = rawFolders ? JSON.parse(rawFolders) : INITIAL_FOLDERS;
    const macroDomains: MacroDomainInfo[] = rawMacro ? JSON.parse(rawMacro) : INITIAL_MACRO_DOMAINS;
    const conceptFolders: ConceptFolder[] = rawConceptFolders ? JSON.parse(rawConceptFolders) : INITIAL_CONCEPT_FOLDERS;
    let concepts: ConceptItem[] = rawConcepts ? JSON.parse(rawConcepts) : INITIAL_CONCEPTS;
    if (rawConcepts) {
      concepts = concepts.map((c) => {
        const init = INITIAL_CONCEPTS.find((ic) => ic.id === c.id);
        if (init && init.tableData && !c.tableData) {
          return {
            ...c,
            tableData: init.tableData,
            technicalDetails: init.technicalDetails && (!c.technicalDetails || !c.technicalDetails.includes('\n'))
              ? init.technicalDetails
              : c.technicalDetails,
          };
        }
        return c;
      });
    }
    const logs: DailyStudyLog[] = rawLogs ? JSON.parse(rawLogs) : generateInitialLogs();
    const goals: Goal[] = rawGoals ? JSON.parse(rawGoals) : INITIAL_GOALS;
    const preferences: UserPreferences = rawPrefs ? JSON.parse(rawPrefs) : INITIAL_PREFERENCES;
    const weeklyPlans: WeeklyStudyPlan[] = rawPlans ? JSON.parse(rawPlans) : [];
    const archivedLessons: ArchivedLesson[] = rawArchived ? JSON.parse(rawArchived) : [];
    const difficultyTracks: DomainDifficultyTrack[] = rawDifficulty ? JSON.parse(rawDifficulty) : [];

    return { domains, folders, macroDomains, concepts, conceptFolders, logs, goals, preferences, weeklyPlans, archivedLessons, difficultyTracks };
  } catch (err) {
    console.error('Error loading stored learning data:', err);
    return {
      domains: INITIAL_DOMAINS,
      folders: INITIAL_FOLDERS,
      macroDomains: INITIAL_MACRO_DOMAINS,
      concepts: INITIAL_CONCEPTS,
      conceptFolders: INITIAL_CONCEPT_FOLDERS,
      logs: generateInitialLogs(),
      goals: INITIAL_GOALS,
      preferences: INITIAL_PREFERENCES,
      weeklyPlans: [],
      archivedLessons: [],
      difficultyTracks: [],
    };
  }
}

export function saveDomains(domains: LearningDomain[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DOMAINS, JSON.stringify(domains));
  } catch (e) {
    console.error('Failed to save domains:', e);
  }
}

export function saveFolders(folders: LearningFolder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
  } catch (e) {
    console.error('Failed to save folders:', e);
  }
}

export function saveMacroDomains(macroDomains: MacroDomainInfo[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MACRO_DOMAINS, JSON.stringify(macroDomains));
  } catch (e) {
    console.error('Failed to save macro domains:', e);
  }
}

export function saveConcepts(concepts: ConceptItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(concepts));
  } catch (e) {
    console.error('Failed to save concepts:', e);
  }
}

export function saveConceptFolders(conceptFolders: ConceptFolder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONCEPT_FOLDERS, JSON.stringify(conceptFolders));
  } catch (e) {
    console.error('Failed to save concept folders:', e);
  }
}

export function saveLogs(logs: DailyStudyLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save logs:', e);
  }
}

export function saveGoals(goals: Goal[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  } catch (e) {
    console.error('Failed to save goals:', e);
  }
}

export function savePreferences(preferences: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  } catch (e) {
    console.error('Failed to save preferences:', e);
  }
}

export function saveWeeklyPlans(plans: WeeklyStudyPlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_PLANS, JSON.stringify(plans));
  } catch (e) {
    console.error('Failed to save plans:', e);
  }
}

export function saveArchivedLessons(archived: ArchivedLesson[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_LESSONS, JSON.stringify(archived));
  } catch (e) {
    console.error('Failed to save archived lessons:', e);
  }
}

export function saveDifficultyTracks(tracks: DomainDifficultyTrack[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DIFFICULTY_TRACKS, JSON.stringify(tracks));
  } catch (e) {
    console.error('Failed to save difficulty tracks:', e);
  }
}

export function exportBackupJSON(data: AppStateData): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('download', `rutas_aprendizaje_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function resetToSampleData(): AppStateData {
  const defaultData: AppStateData = {
    domains: INITIAL_DOMAINS,
    folders: INITIAL_FOLDERS,
    macroDomains: INITIAL_MACRO_DOMAINS,
    concepts: INITIAL_CONCEPTS,
    conceptFolders: INITIAL_CONCEPT_FOLDERS,
    logs: generateInitialLogs(),
    goals: INITIAL_GOALS,
    preferences: INITIAL_PREFERENCES,
    weeklyPlans: [],
    archivedLessons: [],
    difficultyTracks: [],
  };
  saveDomains(defaultData.domains);
  saveFolders(defaultData.folders);
  saveMacroDomains(defaultData.macroDomains);
  saveConcepts(defaultData.concepts);
  saveConceptFolders(defaultData.conceptFolders);
  saveLogs(defaultData.logs);
  saveGoals(defaultData.goals);
  savePreferences(defaultData.preferences);
  saveWeeklyPlans(defaultData.weeklyPlans);
  saveArchivedLessons(defaultData.archivedLessons);
  saveDifficultyTracks(defaultData.difficultyTracks);
  return defaultData;
}

