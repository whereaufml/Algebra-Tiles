import { Progress, ProgressLogEntry } from '../types/algebra';
import { calculateLevelFromXp, evaluateUnlockedBadges } from '../engine/GameSystem';

const STORAGE_KEY = 'algebra_quest_progress_v1';
export const PROGRESS_STORAGE_VERSION = 1;

export function createDefaultProgress(): Progress {
  return {
    nickname: 'Algebra Explorer',
    xp: 0,
    level: 1,
    completedMissions: {},
    completedLessons: [],
    completedCtlActivities: [],
    completedOpLabIds: [],
    badgeIds: [],
    assessmentHistory: [],
    progressLog: [],
    reasoningNotes: [],
    stats: {
      zeroPairsCleared: 0,
      likeTermsCombined: 0,
      equationsSolved: 0,
      misconceptionsGuided: 0,
    },
    lastActiveTab: 'dashboard',
  };
}

export function loadProgress(): {
  progress: Progress;
  hasExistingData: boolean;
  storageAvailable: boolean;
  corrupted: boolean;
} {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        progress: createDefaultProgress(),
        hasExistingData: false,
        storageAvailable: false,
        corrupted: false,
      };
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        progress: createDefaultProgress(),
        hasExistingData: false,
        storageAvailable: true,
        corrupted: false,
      };
    }

    const parsed = JSON.parse(raw) as Partial<Progress> & { version?: number };
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        progress: createDefaultProgress(),
        hasExistingData: false,
        storageAvailable: true,
        corrupted: true,
      };
    }

    if (parsed.version !== undefined && parsed.version !== PROGRESS_STORAGE_VERSION) {
      return {
        progress: createDefaultProgress(),
        hasExistingData: false,
        storageAvailable: true,
        corrupted: true,
      };
    }

    const defaults = createDefaultProgress();
    const merged: Progress = {
      ...defaults,
      ...parsed,
      xp: typeof parsed.xp === 'number' && Number.isFinite(parsed.xp) ? parsed.xp : 0,
      nickname:
        typeof parsed.nickname === 'string' && parsed.nickname.trim()
          ? parsed.nickname
          : defaults.nickname,
      stats: {
        ...defaults.stats,
        ...(parsed.stats && typeof parsed.stats === 'object' ? parsed.stats : {}),
      },
      completedMissions:
        parsed.completedMissions && typeof parsed.completedMissions === 'object'
          ? parsed.completedMissions
          : {},
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      completedCtlActivities: Array.isArray(parsed.completedCtlActivities)
        ? parsed.completedCtlActivities
        : [],
      completedOpLabIds: Array.isArray(parsed.completedOpLabIds) ? parsed.completedOpLabIds : [],
      badgeIds: Array.isArray(parsed.badgeIds) ? parsed.badgeIds : [],
      assessmentHistory: Array.isArray(parsed.assessmentHistory) ? parsed.assessmentHistory : [],
      progressLog: Array.isArray(parsed.progressLog) ? parsed.progressLog : [],
      reasoningNotes: Array.isArray(parsed.reasoningNotes) ? parsed.reasoningNotes : [],
    };
    merged.level = calculateLevelFromXp(merged.xp).level;
    merged.badgeIds = evaluateUnlockedBadges(merged);

    return {
      progress: merged,
      hasExistingData: true,
      storageAvailable: true,
      corrupted: false,
    };
  } catch {
    return {
      progress: createDefaultProgress(),
      hasExistingData: false,
      storageAvailable: true,
      corrupted: true,
    };
  }
}

export function saveProgress(progress: Progress): { ok: boolean; savedAt: string } {
  const next: Progress & { version: number } = {
    ...progress,
    version: PROGRESS_STORAGE_VERSION,
    level: calculateLevelFromXp(progress.xp).level,
    badgeIds: evaluateUnlockedBadges(progress),
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { ok: true, savedAt: new Date().toISOString() };
    }
    return { ok: false, savedAt: '' };
  } catch {
    return { ok: false, savedAt: '' };
  }
}

export function resetProgress(): Progress {
  const fresh = createDefaultProgress();
  saveProgress(fresh);
  return fresh;
}

export function appendProgressLog(
  progress: Progress,
  entry: Omit<ProgressLogEntry, 'id' | 'timestamp'>
): Progress {
  const logItem: ProgressLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...progress,
    progressLog: [logItem, ...progress.progressLog].slice(0, 50),
  };
}
