export type TileType = 'x2' | 'x' | '1';
export type TileSign = 1 | -1;

export interface TilePosition {
  x: number;
  y: number;
}

export interface Tile {
  id: string;
  type: TileType;
  sign: TileSign;
  position: TilePosition;
  groupId?: string | null;
  zeroPairId?: string | null;
}

export type WorkspaceMode = 'explore' | 'equation' | 'area';

export interface ExpressionSummary {
  x2: number;
  x: number;
  constant: number;
  posX2: number;
  negX2: number;
  posX: number;
  negX: number;
  posOne: number;
  negOne: number;
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
  mode: 'explore' | 'equation';
  instructions: string;
  lkpdPrompt: string;
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
  | 'interpret_tiles';

export interface AssessmentItem {
  id: string;
  topic: string;
  unit: 'formatif_dasar' | 'formatif_suku' | 'formatif_zeropair' | 'formatif_persamaan' | 'evaluasi_akhir';
  type: AssessmentQuestionType;
  prompt: string;
  visualTiles?: Array<{ type: TileType; sign: TileSign; count: number }>;
  options?: string[];
  correctOptionIndex?: number;
  expectedTarget?: {
    x2: number;
    x: number;
    constant: number;
    requireNoZeroPairs?: boolean;
  };
  explanation: string;
  recommendedTopicId: string;
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
  activityType: 'mission' | 'academy' | 'assessment' | 'workshop';
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
  badgeIds: string[];
  assessmentHistory: AssessmentHistoryEntry[];
  progressLog: ProgressLogEntry[];
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
  | 'workshop'
  | 'challenge'
  | 'assessment'
  | 'achievements'
  | 'teacher';
