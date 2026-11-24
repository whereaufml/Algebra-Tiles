import { BadgeDefinition, Progress } from '../types/algebra';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'badge-algebra-builder',
    title: 'Algebra Builder',
    description: 'Build your first algebraic expression using x², x, and 1 tiles.',
    criteriaText: 'Complete at least 1 expression-building mission.',
    iconKey: 'builder',
    accentColor: '#3A86D8',
  },
  {
    id: 'badge-like-term-explorer',
    title: 'Like-Term Explorer',
    description: 'Combine like terms accurately without mixing unlike terms.',
    criteriaText: 'Complete a Like Terms mission or combine like terms 3 times.',
    iconKey: 'liketerms',
    accentColor: '#27A89A',
  },
  {
    id: 'badge-zero-pair-master',
    title: 'Zero Pair Master',
    description: 'Understand how opposite-sign tiles cancel each other out to zero.',
    criteriaText: 'Form and cancel at least 3 zero pairs or complete a Zero Pairs mission.',
    iconKey: 'zeropair',
    accentColor: '#EF8748',
  },
  {
    id: 'badge-equation-solver',
    title: 'Equation Solver',
    description: 'Keep both sides of the equation balanced until you isolate x.',
    criteriaText: 'Complete at least 1 equation balance mission.',
    iconKey: 'equation',
    accentColor: '#5943A8',
  },
  {
    id: 'badge-academy-scholar',
    title: 'Academy Scholar',
    description: 'Complete visual lessons and concept checks in the Learning section.',
    criteriaText: 'Complete at least 4 lessons in Learn.',
    iconKey: 'academy',
    accentColor: '#F4C95D',
  },
  {
    id: 'badge-quiz-champion',
    title: 'Quiz Champion',
    description: 'Demonstrate concept mastery with a score of 80% or higher on a quiz.',
    criteriaText: 'Score at least 80% on any quiz.',
    iconKey: 'quiz',
    accentColor: '#39286F',
  },
  {
    id: 'badge-distributive-builder',
    title: 'Distributive Builder',
    description: 'Multiply the factor outside parentheses across every term inside accurately.',
    criteriaText: 'Complete Mission 3 or a distributive multiplication exercise in Operation Lab.',
    iconKey: 'builder',
    accentColor: '#27A89A',
  },
  {
    id: 'badge-division-detective',
    title: 'Division Detective',
    description: 'Divide an algebraic expression into equal groups by a non-zero number.',
    criteriaText: 'Complete a division exercise in Operation Lab.',
    iconKey: 'liketerms',
    accentColor: '#3A86D8',
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

  if (
    progress.completedCtlActivities.includes('ctl-activity-3') ||
    progress.completedOpLabIds.some((id) => id.includes('mul'))
  ) {
    unlocked.add('badge-distributive-builder');
  }

  if (progress.completedOpLabIds.some((id) => id.includes('div'))) {
    unlocked.add('badge-division-detective');
  }

  return Array.from(unlocked);
}

export function countTotalStars(progress: Progress): number {
  return Object.values(progress.completedMissions).reduce((sum, item) => sum + item.stars, 0);
}
