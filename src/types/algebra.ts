export type TileType = 'x2' | 'x' | '1' | 'y2' | 'xy' | 'y';
export type TileSign = 1 | -1;
export type TileStatus = 'active' | 'cancelled';

export interface TilePosition {
  x: number;
  y: number;
}

export interface Tile {
  id: string;
  type: TileType;
  sign: TileSign;
  position: TilePosition;
  status?: TileStatus;
  groupId?: string | null;
  zeroPairId?: string | null;
}

export type WorkspaceMode = 'explore' | 'equation' | 'area';

export interface ExpressionSummary {
  x2: number;
  x: number;
  constant: number;
  y2: number;
  xy: number;
  y: number;
  posX2: number;
  negX2: number;
  posX: number;
  negX: number;
  posOne: number;
  negOne: number;
  posY2: number;
  negY2: number;
  posXY: number;
  negXY: number;
  posY: number;
  negY: number;
}

export interface EquationState {
  leftTiles: Tile[];
  rightTiles: Tile[];
  initialLeft: ExpressionSummary;
  initialRight: ExpressionSummary;
  lastActionNote: string;
  isBalanced: boolean;
  imbalanceReason?: string;
}

export type ValidationRuleType =
  | 'exact_tiles'
  | 'equivalent_simplified'
  | 'equation_solve';

export interface MissionValidationRule {
  type: ValidationRuleType;
  target: {
    x2: number;
    x: number;
    constant: number;
    y2?: number;
    xy?: number;
    y?: number;
  };
  requireNoZeroPairs?: boolean;
  targetVariableValue?: number;
}

export interface Mission {
  id: string;
  levelId: string;
  order: number;
  title: string;
  topic: string;
  learningGoalId?: string;
  mode: 'explore' | 'equation';
  instructions: string;
  lkpdPrompt: string;
  reasoningPrompt?: string;
  initialTiles?: Array<{ type: TileType; sign: TileSign; count: number }>;
  initialEquation?: {
    left: Array<{ type: TileType; sign: TileSign; count: number }>;
    right: Array<{ type: TileType; sign: TileSign; count: number }>;
  };
  validationRule: MissionValidationRule;
  hints: string[];
  rewardXp: number;
}

export interface LevelConfig {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  pathway: 'fondasi' | 'ctl_inti' | 'operation_lab' | 'evaluasi';
  description: string;
  learningObjectives: string[];
  color: string;
  prerequisiteLevelId?: string;
}

export interface TopicSubLesson {
  id: string;
  title: string;
  objective: string;
  explanation: string;
  visualDemo: {
    caption: string;
    tiles: Array<{ type: TileType; sign: TileSign; count: number }>;
    rightTiles?: Array<{ type: TileType; sign: TileSign; count: number }>;
    symbolicResult: string;
    highlightNote?: string;
  };
  summary: string;
  checkQuestion: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface TopicConfig {
  id: string;
  levelId: string;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  lessons: TopicSubLesson[];
}

export interface GlossaryItem {
  term: string;
  definition: string;
  example: string;
}

export type AssessmentQuestionType =
  | 'multiple_choice'
  | 'build_tiles'
  | 'interpret_tiles'
  | 'symbolic_input';

export interface AssessmentItem {
  id: string;
  topic: string;
  unit:
    | 'exit_ticket'
    | 'formatif_dasar'
    | 'formatif_suku'
    | 'formatif_zeropair'
    | 'formatif_persamaan'
    | 'evaluasi_akhir';
  type: AssessmentQuestionType;
  prompt: string;
  contextHint?: string;
  visualTiles?: Array<{ type: TileType; sign: TileSign; count: number }>;
  options?: string[];
  correctOptionIndex?: number;
  expectedTarget?: {
    x2: number;
    x: number;
    constant: number;
    requireNoZeroPairs?: boolean;
  };
  acceptedSymbolicForms?: string[];
  explanation: string;
  recommendedTopicId: string;
}

export type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface OperationStepExample {
  id: string;
  title: string;
  problem: string;
  steps: string[];
  visualGroups?: Array<{
    groupLabel: string;
    tiles: Array<{ type: TileType; sign: TileSign; count: number }>;
  }>;
  finalExpression: string;
  takeaway: string;
}

export interface OperationExercise {
  id: string;
  prompt: string;
  problemLabel: string;
  expectedTarget: {
    x2: number;
    x: number;
    constant: number;
  };
  placeholder: string;
  hint: string;
  explanation: string;
  visualPresetTiles?: Array<{ type: TileType; sign: TileSign; count: number }>;
  groupVisualConfig?: {
    groupsCount: number;
    perGroup: Array<{ type: TileType; sign: TileSign; count: number }>;
    mode: 'repeat' | 'split';
  };
}

export interface OperationModuleConfig {
  id: OperationType;
  title: string;
  shortTitle: string;
  subtitle: string;
  ruleSummary: string;
  scopeBoundaryNote: string;
  materiPoints: string[];
  workedExamples: OperationStepExample[];
  exercises: OperationExercise[];
}

export interface CtlChallengeOption {
  id: 'A' | 'B' | 'C';
  title: string;
  leftExpression: string;
  rightExpression: string;
  leftTarget: { x2: number; x: number; constant: number };
  rightTarget: { x2: number; x: number; constant: number };
  leftGroups?: number;
  rightGroups?: number;
  observationPrompt: string;
  sampleReasoning: string;
}

export interface CtlActivityConfig {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  ctlPillars: string[];
  contextStory: string;
  taskSummary: string;
  lkpdInstruction: string;
  reasoningPrompt: string;
  rewardXp: number;
}

export interface ReasoningEntry {
  id: string;
  source: 'ctl' | 'mission' | 'oplab';
  title: string;
  reasonText: string;
  updatedAt: string;
}

export interface ReflectionEntry {
  understandingSummary: string;
  favoriteActivity: string;
  remainingQuestion: string;
  updatedAt: string;
}

export interface MissionCompletion {
  missionId: string;
  stars: 1 | 2 | 3;
  attempts: number;
  hintsUsed: number;
  completedAt: string;
}

export interface AssessmentHistoryEntry {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  weakTopics: string[];
  completedAt: string;
}

export interface ProgressLogEntry {
  id: string;
  activityType: 'mission' | 'academy' | 'assessment' | 'workshop' | 'ctl' | 'oplab' | 'reflection';
  title: string;
  topic: string;
  detail: string;
  xpEarned: number;
  timestamp: string;
}

export interface Progress {
  nickname: string;
  xp: number;
  level: number;
  completedMissions: Record<string, MissionCompletion>;
  completedLessons: string[];
  completedCtlActivities: string[];
  completedOpLabIds: string[];
  badgeIds: string[];
  assessmentHistory: AssessmentHistoryEntry[];
  progressLog: ProgressLogEntry[];
  reasoningNotes: ReasoningEntry[];
  reflection?: ReflectionEntry;
  stats: {
    zeroPairsCleared: number;
    likeTermsCombined: number;
    equationsSolved: number;
    misconceptionsGuided: number;
  };
  lastActiveTab?: AppTab;
  lastMissionId?: string;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  criteriaText: string;
  iconKey: 'zeropair' | 'liketerms' | 'builder' | 'equation' | 'academy' | 'quiz';
  accentColor: string;
}

export type AppTab =
  | 'dashboard'
  | 'academy'
  | 'story'
  | 'workshop'
  | 'oplab'
  | 'challenge'
  | 'assessment'
  | 'achievements'
  | 'teacher';
