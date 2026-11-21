import { Progress, ProgressLogEntry } from '../types/algebra';
import { calculateLevelFromXp, evaluateUnlockedBadges } from '../engine/GameSystem';

const STORAGE_KEY = 'algebra_quest_progress_v1';

export function createDefaultProgress(): Progress {
  return {
    nickname: 'Penjelajah Aljabar',
    xp: 0,
    level: 1,
    completedMissions: {},
    completedLessons: [],
    badgeIds: [],
    assessmentHistory: [],
    progressLog: [],
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
} {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        progress: createDefaultProgress(),
        hasExistingData: false,
        storageAvailable: false,
      };
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        progress: createDefaultProgress(),
        hasExistingData: false,
        storageAvailable: true,
      };
    }

    const parsed = JSON.parse(raw) as Partial<Progress>;
    const defaults = createDefaultProgress();
    const merged: Progress = {
      ...defaults,
      ...parsed,
      stats: {
        ...defaults.stats,
        ...(parsed.stats || {}),
      },
      completedMissions: parsed.completedMissions || {},
      completedLessons: parsed.completedLessons || [],
      badgeIds: parsed.badgeIds || [],
      assessmentHistory: parsed.assessmentHistory || [],
      progressLog: parsed.progressLog || [],
    };
    merged.level = calculateLevelFromXp(merged.xp).level;
    merged.badgeIds = evaluateUnlockedBadges(merged);

    return {
      progress: merged,
      hasExistingData: true,
      storageAvailable: true,
    };
  } catch {
    return {
      progress: createDefaultProgress(),
      hasExistingData: false,
      storageAvailable: false,
    };
  }
}

export function saveProgress(progress: Progress): { ok: boolean; savedAt: string } {
  const next: Progress = {
    ...progress,
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
