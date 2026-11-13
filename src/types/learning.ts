export type MacroDomainId = string;

export interface MacroDomainInfo {
  id: MacroDomainId;
  name: string;
  shortLabel: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  isCustom?: boolean;
}

export interface LearningFolder {
  id: string;
  name: string;
  description?: string;
  macroDomainId: string;
  parentFolderId?: string | null; // For nested folders: null means root level of this macro-domain
  createdAt: string;
  color?: string;
}

export type BloomLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface BloomLevelInfo {
  level: BloomLevel;
  name: string; // 'Recordar', 'Entender', 'Aplicar', 'Analizar', 'Evaluar', 'Crear'
  description: string;
  verbs: string[];
}

export type ActivityType = 
  | 'theory'
  | 'exercises'
  | 'flashcards'
  | 'coding_lab'
  | 'reading'
  | 'speaking'
  | 'review'
  | 'srs_warmup'
  | 'high_performance_exam'
  | 'deliberate_practice';

export interface Milestone {
  id: string;
  title: string;
  bloomLevel?: BloomLevel;
  estimatedMinutes?: number;
  isExtended?: boolean; // Lección larga que requiere plazo extendido
  completed: boolean;
  completedAt?: string;
}

export interface ResourceLink {
  id: string;
  title: string;
  url?: string;
  type: 'book' | 'course' | 'doc' | 'video' | 'exercise_bank';
}

export type ConceptStatus = 'a_ver' | 'visto' | 'a_reforzar' | 'dominado';

export interface ConceptFolder {
  id: string;
  name: string;
  databaseKey: string; // Belongs strictly to this concept database
  macroDomainId: string; // Strictly scoped to selector
  parentFolderId?: string | null; // For nested subfolders: null means root level of this database
  description?: string;
  color?: string;
  createdAt: string;
}

export interface ConceptMediaAttachment {
  id: string;
  driveFileId: string;
  name: string;
  mimeType: string;
  mediaType: 'image' | 'audio' | 'pdf' | 'other';
  sizeBytes: number;
  webViewLink?: string;
  thumbnailLink?: string;
  downloadUrl?: string;
  createdAt: string;
  caption?: string;
}

export interface GoogleDriveSyncStatus {
  isSignedIn: boolean;
  userEmail?: string;
  userName?: string;
  userPhotoUrl?: string;
  isSyncing: boolean;
  lastSyncedAt?: string;
  folderId?: string;
  error?: string | null;
}

export interface ConceptItem {
  id: string;
  name: string;
  description: string;
  macroDomainId: string; // Strictly scoped to selector! Cannot mix across selectors
  databaseKey: string; // Identifier for the concept database cluster (e.g., "db-math-calc")
  databaseName: string; // Human readable title (e.g., "Base Conceptual: Matemáticas y Cálculo")
  domainId: string; // Primary domain ID
  linkedDomainIds: string[]; // List of all domain IDs sharing this concept database
  folderId?: string | null; // ID of the ConceptFolder inside this database (null = root)
  status: ConceptStatus; // 'a_ver' | 'visto' | 'a_reforzar' | 'dominado'
  bloomLevel: BloomLevel;
  technicalDetails?: string; // LaTeX formula, code snippet, grammar rule, or technical standard
  notes?: string;
  tableData?: Array<Record<string, string>> | null; // Array de objetos JSON editable
  mediaAttachments?: ConceptMediaAttachment[]; // Archivos multimedia respaldados en Google Drive
  createdAt: string;
  updatedAt?: string;
}

export interface ConceptDatabaseInfo {
  key: string;
  name: string;
  macroDomainId: string;
  linkedDomainIds: string[];
  conceptCount: number;
  description?: string;
}

export interface TopicItem {
  id: string;
  name: string;
  description?: string;
  bloomFocus?: BloomLevel;
}

export interface LearningDomain {
  id: string;
  name: string; // e.g. "JLPT N5", "Matemáticas y Cálculo"
  subArea: string; // e.g. "Cálculo Diferencial e Integral"
  macroDomainId: string;
  folderId?: string | null; // For folder hierarchy (null = root of the macro domain)
  conceptDatabaseKey?: string; // Identifier of linked concept database
  level: string; // e.g. "Universitario / Profesional", "Principiante N5"
  description: string;
  targetHours: number;
  topics: string[]; // e.g. ["Álgebra", "Cálculo Diferencial e Integral", ...]
  milestones: Milestone[];
  resources: ResourceLink[];
  createdAt: string;
  isCustom?: boolean;
}

// Session steps: [ 3 min: Warm-up / SRS ] ──> [ 10-15 min: Núcleo del Examen / Práctica ] ──> [ 2 min: Retroalimentación & Métricas ]
export interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface WarmupQuestion {
  id: string;
  question: string; // LaTeX enabled
  conceptTested: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface CoreMCQQuestion {
  id: string;
  question: string; // LaTeX enabled ($..$, $$..$$)
  options: string[]; // 4 multiple choice options
  correctAnswer: string;
  explanation: string;
  fromTable?: boolean; // Indicates if derived from a concept's tableData
  sourceConceptName?: string;
  sourceColumn?: string;
}

export interface CoreExamProblem {
  title: string;
  problemStatement: string; // LaTeX enabled ($..$, $$..$$)
  bloomLevel: BloomLevel;
  domainContext: string;
  codeSnippet?: string;
  testCases?: TestCase[];
  guidingQuestions?: string[];
  expectedKeyPoints: string[];
}

export type DifficultyLevel = 'basico' | 'intermedio' | 'avanzado' | 'experto';

export interface PrecisionRubricScore {
  conceptualRigor: number; // 0 - 30
  methodology: number; // 0 - 40
  accuracy: number; // 0 - 30
  feedbackCriteria: {
    criterion: string;
    score: number;
    maxScore: number;
    status: 'cumplido' | 'parcial' | 'no_cumplido';
  }[];
}

export interface DifficultyLessonItem {
  id: string;
  domainId: string;
  title: string;
  level: DifficultyLevel;
  estimatedMinutes: number;
  isExtendedLesson: boolean;
  objective: string;
  conceptIds?: string[];
  completed?: boolean;
  completedScore?: number;
  completedAt?: string;
  preparedProblem?: CoreExamProblem;
  preparedMcqQuestions?: CoreMCQQuestion[];
  rubricCriteria?: string[];
}

export interface DomainDifficultyTrack {
  domainId: string;
  domainName: string;
  macroDomainId: string;
  levels: {
    basico: DifficultyLessonItem[];
    intermedio: DifficultyLessonItem[];
    avanzado: DifficultyLessonItem[];
    experto: DifficultyLessonItem[];
  };
}

export interface PedagogicalSession {
  id: string;
  domainId: string;
  domainName: string;
  macroDomainId: string;
  dayOfWeek?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  isSundaySRS: boolean;
  isExtendedLesson: boolean; // Si la lección toma plazo más largo
  estimatedMinutes: number; // 20-30 min normally, or 45-60 min for extended
  bloomFocus: BloomLevel;
  lessonMode?: 'weekly' | 'difficulty';
  difficultyLevel?: DifficultyLevel;
  isWarmupActive?: boolean; // Solo se activa si hay conceptos previos (vistos, dominados o a reforzar)
  warmup: {
    durationMinutes: number; // 3 min (o 0 si está inactivo)
    instructions: string;
    questions: WarmupQuestion[];
  };
  core: {
    durationMinutes: number; // 10-15 min (or longer for extended)
    problem: CoreExamProblem;
    mcqQuestions?: CoreMCQQuestion[]; // 3-10 preguntas de selección múltiple según duración y dificultad
  };
  feedbackTemplate: {
    durationMinutes: number; // 2 min
    rubricPoints: string[];
  };
}

export interface EvaluationResult {
  score: number; // 0 - 100
  bloomMastery: BloomLevel;
  evaluationType?: 'bloom' | 'precision_rubric';
  difficultyAchieved?: DifficultyLevel;
  precisionRubric?: PrecisionRubricScore;
  summary: string;
  strengths: string[];
  areasToReinforce: string[];
  latexExplanation?: string;
  recommendedNextStep: string;
  srsRepetitionIntervalDays: number;
  mcqScore?: {
    total: number;
    correct: number;
    percentage: number;
  };
}

export interface WeeklyStudyPlanDay {
  dayName: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  isSundaySRS: boolean;
  topic: string;
  bloomLevel: BloomLevel;
  estimatedMinutes: number;
  isExtendedLesson: boolean;
  objective: string;
  warmupTopic: string;
  completed?: boolean;
  isCustomLesson?: boolean; // Creada a la medida por el usuario
  customConceptIds?: string[]; // IDs de conceptos seleccionados para la lección
  preparedProblem?: CoreExamProblem; // Problema aplicado generado o rehecho para la lección
  preparedMcqQuestions?: CoreMCQQuestion[]; // Preguntas de examen del núcleo generadas o rehechas
  preparedWarmupQuestions?: WarmupQuestion[]; // Preguntas de calentamiento
}

export interface WeeklyStudyPlan {
  id: string;
  domainId: string;
  domainName: string;
  macroDomainId: string;
  weekTitle: string;
  goalReference?: string;
  createdAt: string;
  days: WeeklyStudyPlanDay[];
}

export interface DailyStudyLog {
  id: string;
  subjectId: string; // maps to domainId
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  activityType: ActivityType;
  topicsCovered: string;
  outputSummary: string;
  comprehensionScore: 1 | 2 | 3 | 4 | 5;
  bloomLevelAchieved?: BloomLevel;
  notes?: string;
  keyTakeaway?: string;
  createdAt: string;
}

export type GoalFrequency = 'daily' | 'weekly' | 'monthly' | 'milestone';
export type GoalTargetType = 'hours' | 'sessions' | 'exercises' | 'milestones';

export interface Goal {
  id: string;
  title: string;
  category: string; // macroDomainId or 'all'
  subjectId?: string; // maps to domainId
  frequency: GoalFrequency;
  targetType: GoalTargetType;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

export interface UserPreferences {
  userName: string;
  dailyGoalMinutes: number;
  weeklyGoalHours: number;
}

export interface ArchivedLesson {
  id: string;
  domainId: string;
  domainName: string;
  subArea: string;
  macroDomainId: string;
  topic: string;
  dayName?: string;
  lessonMode?: 'weekly' | 'difficulty';
  difficultyLevel?: DifficultyLevel;
  precisionRubric?: PrecisionRubricScore;
  completedAt: string; // ISO 8601 timestamp (e.g. 2026-10-26T00:30:00.000Z)
  date: string; // YYYY-MM-DD for grouping
  durationMinutes: number;
  score: number; // 0 - 100
  passed: boolean; // true if score >= 70, archived even if not passed
  bloomLevel?: BloomLevel;
  bloomMastery?: BloomLevel;
  studentAnswer: string;
  session: PedagogicalSession;
  evaluation: EvaluationResult;
  isArchived: boolean;
}

