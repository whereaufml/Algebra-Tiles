import { BadgeDefinition, Progress } from '../types/algebra';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'badge-algebra-builder',
    title: 'Algebra Builder',
    description: 'Menyusun ekspresi aljabar pertama dengan ubin x², x, dan 1.',
    criteriaText: 'Selesaikan minimal 1 misi menyusun ekspresi.',
    iconKey: 'builder',
    accentColor: '#3A86D8',
  },
  {
    id: 'badge-like-term-explorer',
    title: 'Like-Term Explorer',
    description: 'Menggabungkan suku sejenis dengan tepat tanpa mencampur suku berbeda.',
    criteriaText: 'Selesaikan misi Suku Sejenis atau gabungkan suku sejenis 3 kali.',
    iconKey: 'liketerms',
    accentColor: '#27A89A',
  },
  {
    id: 'badge-zero-pair-master',
    title: 'Zero Pair Master',
    description: 'Memahami bagaimana pasangan ubin berlawanan tanda saling meniadakan.',
    criteriaText: 'Bentuk & sederhanakan minimal 3 zero pair atau selesaikan misi Zero Pairs.',
    iconKey: 'zeropair',
    accentColor: '#EF8748',
  },
  {
    id: 'badge-equation-solver',
    title: 'Equation Solver',
    description: 'Menjaga kesetaraan kedua sisi papan persamaan hingga menemukan nilai x.',
    criteriaText: 'Selesaikan minimal 1 misi keseimbangan persamaan.',
    iconKey: 'equation',
    accentColor: '#5943A8',
  },
  {
    id: 'badge-academy-scholar',
    title: 'Academy Scholar',
    description: 'Menuntaskan materi visual dan cek pemahaman di Learning Academy.',
    criteriaText: 'Selesaikan minimal 4 submateri Learning Academy.',
    iconKey: 'academy',
    accentColor: '#F4C95D',
  },
  {
    id: 'badge-quiz-champion',
    title: 'Quiz Champion',
    description: 'Menunjukkan penguasaan konsep pada evaluasi kuis dengan skor >= 80%.',
    criteriaText: 'Raih skor minimal 80% pada salah satu kuis.',
    iconKey: 'quiz',
    accentColor: '#39286F',
  },
];

export function calculateLevelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelThreshold: number;
  progressPercent: number;
} {
  const xpPerLevel = 250;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const currentLevelXp = xp % xpPerLevel;
  const nextLevelThreshold = xpPerLevel;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelThreshold) * 100));

  return {
    level,
    currentLevelXp,
    nextLevelThreshold,
    progressPercent,
  };
}

export function calculateMissionStars(attempts: number, hintsUsed: number): 1 | 2 | 3 {
  if (attempts <= 2 && hintsUsed === 0) return 3;
  if (attempts <= 4 && hintsUsed <= 1) return 2;
  return 1;
}

export function evaluateUnlockedBadges(progress: Progress): string[] {
  const unlocked = new Set(progress.badgeIds);
  const completedIds = Object.keys(progress.completedMissions);

  if (completedIds.length >= 1) {
    unlocked.add('badge-algebra-builder');
  }

  if (
    completedIds.some((id) => id.includes('suku')) ||
    progress.stats.likeTermsCombined >= 3
  ) {
    unlocked.add('badge-like-term-explorer');
  }

  if (
    completedIds.some((id) => id.includes('zero')) ||
    progress.stats.zeroPairsCleared >= 3
  ) {
    unlocked.add('badge-zero-pair-master');
  }

  if (
    completedIds.some((id) => id.includes('persamaan')) ||
    progress.stats.equationsSolved >= 1
  ) {
    unlocked.add('badge-equation-solver');
  }

  if (progress.completedLessons.length >= 4) {
    unlocked.add('badge-academy-scholar');
  }

  if (progress.assessmentHistory.some((a) => a.percentage >= 80)) {
    unlocked.add('badge-quiz-champion');
  }

  return Array.from(unlocked);
}

export function countTotalStars(progress: Progress): number {
  return Object.values(progress.completedMissions).reduce((sum, item) => sum + item.stars, 0);
}
