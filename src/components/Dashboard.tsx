import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calculator,
  Check,
  Clock,
  Compass,
  Edit3,
  FilePlus2,
  Flag,
  GraduationCap,
  Lock,
  Map,
  Shapes,
  Star,
} from 'lucide-react';
import { AppTab, LevelConfig, Mission, Progress } from '../types/algebra';
import {
  CTL_ACTIVITIES_CONFIG,
  CURRICULUM_META,
  LEARNING_PATHWAY_MAP,
  LEVELS_CONFIG,
  MISSIONS_CONFIG,
} from '../data/curriculumConfig';
import { BADGE_DEFINITIONS, calculateLevelFromXp, countTotalStars } from '../engine/GameSystem';
import { countTileStatuses } from '../engine/MathEngine';
import {
  PersistedWorkspaceSession,
  computeWorkspaceHasRecoverableWork,
} from '../storage/WorkspaceStorage';

interface DashboardProps {
  progress: Progress;
  teacherDemoMode: boolean;
  savedWorkspace?: PersistedWorkspaceSession | null;
  onContinueWorkspace?: () => void;
  onResetWorkspaceSession?: () => void;
  onUpdateNickname: (nickname: string) => void;
  onNavigate: (tab: AppTab) => void;
  onStartMission: (mission: Mission) => void;
  onOpenTopicByLevel: (levelId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  progress,
  teacherDemoMode,
  savedWorkspace = null,
  onContinueWorkspace,
  onResetWorkspaceSession,
  onUpdateNickname,
  onNavigate,
  onStartMission,
  onOpenTopicByLevel,
}) => {
  const [selectedLevelId, setSelectedLevelId] = useState<string>(LEVELS_CONFIG[0].id);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(progress.nickname);
  const [confirmNewWorkspace, setConfirmNewWorkspace] = useState(false);

  const hasRecoverableWorkspace = Boolean(
    savedWorkspace && computeWorkspaceHasRecoverableWork(savedWorkspace)
  );
  const workspaceExploreTiles =
    savedWorkspace?.exploreHistory[savedWorkspace.exploreHistoryIdx] || [];
  const workspaceExploreCounts = countTileStatuses(workspaceExploreTiles);
  const workspaceEqState =
    savedWorkspace?.equationHistory[savedWorkspace.equationHistoryIdx];
  const workspaceEqCounts = workspaceEqState
    ? {
        activeCount:
          countTileStatuses(workspaceEqState.leftTiles).activeCount +
          countTileStatuses(workspaceEqState.rightTiles).activeCount,
        cancelledCount:
          countTileStatuses(workspaceEqState.leftTiles).cancelledCount +
          countTileStatuses(workspaceEqState.rightTiles).cancelledCount,
      }
    : { activeCount: 0, cancelledCount: 0 };

  const completedCount = Object.keys(progress.completedMissions).length;
  const totalMissions = MISSIONS_CONFIG.length;
  const missionPercent = Math.round((completedCount / totalMissions) * 100);
  const totalStars = countTotalStars(progress);
  const levelInfo = calculateLevelFromXp(progress.xp);

  const isLevelUnlocked = (lvl: LevelConfig): boolean => {
    if (teacherDemoMode || !lvl.prerequisiteLevelId) return true;
    const prereqMissions = MISSIONS_CONFIG.filter((m) => m.levelId === lvl.prerequisiteLevelId);
    return prereqMissions.some((m) => Boolean(progress.completedMissions[m.id]));
  };

  const isLevelCompleted = (lvl: LevelConfig): boolean => {
    const lvlMissions = MISSIONS_CONFIG.filter((m) => m.levelId === lvl.id);
    return lvlMissions.length > 0 && lvlMissions.every((m) => Boolean(progress.completedMissions[m.id]));
  };

  const nextMission =
    MISSIONS_CONFIG.find((m) => !progress.completedMissions[m.id]) || MISSIONS_CONFIG[0];

  const selectedLevel =
    LEVELS_CONFIG.find((l) => l.id === selectedLevelId) || LEVELS_CONFIG[0];
  const selectedLevelMissions = MISSIONS_CONFIG.filter((m) => m.levelId === selectedLevel.id);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed) {
      onUpdateNickname(trimmed);
    } else {
      setNameInput(progress.nickname);
    }
    setEditingName(false);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Welcome Banner */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E5E0F3] bg-white p-6 sm:flex-row sm:items-center">
        <div className="space-y-1.5">
          {!editingName ? (
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#39286F] sm:text-3xl">
                Welcome, {progress.nickname}!
              </h1>
              <button
                type="button"
                onClick={() => {
                  setNameInput(progress.nickname);
                  setEditingName(true);
                }}
                aria-label="Edit nickname"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-[#F7F5FC] hover:text-[#39286F]"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveName} className="flex flex-wrap items-center gap-2">
              <label htmlFor="nickname-input" className="sr-only">
                Player nickname
              </label>
              <input
                id="nickname-input"
                type="text"
                maxLength={28}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="rounded-xl border border-[#5943A8] px-3 py-1.5 text-sm font-semibold text-[#39286F] focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-xl bg-[#5943A8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#39286F]"
              >
                Save
              </button>
            </form>
          )}

          <p className="max-w-2xl text-sm font-medium text-slate-700">
            Choose a mission, experiment with Algebra Tiles, and build your understanding one tile at a time.
          </p>
          <p className="max-w-2xl text-xs text-slate-500">
            Explore algebraic concepts, solve challenges, and develop your mathematical skills through interactive activities. Your progress is automatically saved in this browser.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onStartMission(nextMission)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#27A89A] px-5 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#1E8E82] whitespace-nowrap"
        >
          Continue Adventure
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* Resume Last Workspace Card */}
      {hasRecoverableWorkspace && savedWorkspace && onContinueWorkspace && (
        <section
          data-testid="dashboard-resume-workspace-card"
          className="flex flex-col gap-3 rounded-2xl border-2 border-[#27A89A]/45 bg-[#F4FBF9] p-5"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-[#27A89A] px-2.5 py-0.5 text-[11px] font-bold text-white">
                  SAVED WORKSPACE READY
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#14554E]">
                  <Clock className="h-3.5 w-3.5" />
                  Last auto-saved:{' '}
                  {new Date(savedWorkspace.savedAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-[#39286F]">
                Resume Your Last Algebra Workshop Session?
              </h2>
              <p className="text-xs text-slate-700">
                Mode:{' '}
                <strong>
                  {savedWorkspace.mode === 'equation'
                    ? 'Equation Balance'
                    : savedWorkspace.mode === 'area'
                    ? 'Area Model'
                    : 'Algebraic Expression'}
                </strong>{' '}
                · Latest result:{' '}
                <strong className="font-math text-[#5943A8]">
                  {savedWorkspace.mode === 'equation'
                    ? savedWorkspace.equationExpression
                    : savedWorkspace.symbolicExpression}
                </strong>{' '}
                ·{' '}
                {savedWorkspace.mode === 'equation'
                  ? `${workspaceEqCounts.activeCount} active tile(s), ${workspaceEqCounts.cancelledCount} faded tile(s)`
                  : `${workspaceExploreCounts.activeCount} active tile(s), ${workspaceExploreCounts.cancelledCount} faded tile(s)`}{' '}
                · Undo available:{' '}
                <strong>
                  {savedWorkspace.mode === 'equation'
                    ? savedWorkspace.equationHistoryIdx
                    : savedWorkspace.exploreHistoryIdx}{' '}
                  step(s)
                </strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onResetWorkspaceSession && (
                <button
                  type="button"
                  onClick={() => setConfirmNewWorkspace(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#D6CEF0] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#39286F] hover:border-[#5943A8]"
                >
                  <FilePlus2 className="h-3.5 w-3.5 text-[#5943A8]" />
                  Start New Workspace
                </button>
              )}
              <button
                type="button"
                onClick={onContinueWorkspace}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#5943A8] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#39286F]"
              >
                Continue Last Work
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {confirmNewWorkspace && onResetWorkspaceSession && (
            <div
              role="alertdialog"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EF8748] bg-[#FFF8F3] px-4 py-2.5 text-xs text-[#39286F]"
            >
              <span>
                Clear the current workspace tiles &amp; Undo/Redo history to start fresh? <strong>Your XP, stars, badges, and completed missions remain safe.</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmNewWorkspace(false)}
                  className="rounded-lg border border-[#E5E0F3] bg-white px-3 py-1.5 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetWorkspaceSession();
                    setConfirmNewWorkspace(false);
                  }}
                  className="rounded-lg bg-[#C94438] px-3 py-1.5 font-bold text-white"
                >
                  Yes, Start New Workspace
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Main 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        {/* Left: Adventure Map */}
        <section className="flex flex-col justify-between rounded-2xl border border-[#E5E0F3] bg-white p-6">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-[#39286F]">
                  Adventure Map
                </h2>
                <p className="text-xs text-slate-600">
                  Complete levels step by step or select any stage to inspect its missions.
                </p>
              </div>
              {teacherDemoMode && (
                <span className="text-xs font-semibold text-[#5943A8]">
                  Teacher Demo Mode Active
                </span>
              )}
            </div>

            {/* Connected Level Nodes Path */}
            <div className="relative my-7 flex flex-col items-center justify-between gap-6 sm:flex-row sm:gap-2 sm:px-4">
              <div
                className="pointer-events-none absolute top-9 left-10 right-10 hidden h-1.5 rounded-full bg-[#ECE7F8] sm:block"
                aria-hidden="true"
              />
              {LEVELS_CONFIG.map((lvl, idx) => {
                const unlocked = isLevelUnlocked(lvl);
                const completed = isLevelCompleted(lvl);
                const isSelected = selectedLevel.id === lvl.id;
                const yOffsetClass =
                  idx % 2 === 1 ? 'sm:translate-y-4' : 'sm:-translate-y-2';

                return (
                  <div
                    key={lvl.id}
                    className={`relative z-10 flex flex-col items-center ${yOffsetClass}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedLevelId(lvl.id)}
                      aria-label={`Level ${lvl.number}: ${lvl.title}`}
                      style={{
                        backgroundColor: unlocked ? lvl.color : '#CBD5E1',
                      }}
                      className={`flex h-16 w-16 items-center justify-center rounded-full text-lg font-extrabold text-white shadow-sm transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39286F] ${
                        isSelected ? 'ring-4 ring-[#39286F]/30 scale-105' : ''
                      }`}
                    >
                      {completed ? (
                        <Check className="h-7 w-7 stroke-[2.75]" />
                      ) : unlocked ? (
                        lvl.number
                      ) : (
                        <Lock className="h-5 w-5" />
                      )}
                    </button>
                    <span className="mt-2.5 text-center text-xs font-bold text-[#39286F]">
                      {lvl.shortTitle}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {completed ? 'Done' : unlocked ? 'Available' : 'Locked'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Level Detail Panel */}
          <div className="mt-2 rounded-2xl border border-[#E5E0F3] bg-[#F7F5FC] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[#5943A8]">
                  Level {selectedLevel.number} ·{' '}
                  {isLevelCompleted(selectedLevel)
                    ? 'Completed'
                    : isLevelUnlocked(selectedLevel)
                    ? 'Available'
                    : 'Locked (complete previous level first)'}
                </p>
                <h3 className="text-base font-bold text-[#39286F]">
                  {selectedLevel.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => onOpenTopicByLevel(selectedLevel.id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#5943A8]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#39286F] hover:bg-[#EFEAF9] whitespace-nowrap"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Study Guide
              </button>
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {selectedLevel.description}
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {selectedLevelMissions.map((mission) => {
                const done = progress.completedMissions[mission.id];
                const unlocked = isLevelUnlocked(selectedLevel);
                return (
                  <button
                    key={mission.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => onStartMission(mission)}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#E5E0F3] bg-white px-3.5 py-2.5 text-left transition-colors hover:border-[#5943A8] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#39286F]">
                        {mission.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        +{mission.rewardXp} XP
                      </p>
                    </div>
                    {done ? (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#D97706] shrink-0">
                        <Star className="h-3.5 w-3.5 fill-[#F4C95D] text-[#D97706]" />
                        {done.stars}
                      </span>
                    ) : unlocked ? (
                      <ArrowRight className="h-4 w-4 shrink-0 text-[#5943A8]" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right: Learning Progress & Recent Achievements */}
        <div className="flex flex-col gap-5">
          {/* Learning Progress */}
          <section className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#39286F]">Learning Progress</h2>
              <span className="font-math text-xs font-bold text-[#5943A8] tabular-nums">
                Level {String(levelInfo.level).padStart(2, '0')}
              </span>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-700 tabular-nums">
              {completedCount} of {totalMissions} challenges completed
            </p>
            <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-[#ECE7F8]">
              <div
                style={{ width: `${Math.max(4, missionPercent)}%` }}
                className="h-full rounded-full bg-[#27A89A] transition-all duration-300"
              />
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 border-t border-[#F0ECF9] pt-4 text-center">
              <div>
                <p className="font-math text-lg font-bold text-[#39286F] tabular-nums">
                  {progress.xp}
                </p>
                <p className="text-[11px] text-slate-500">Total XP</p>
              </div>
              <div>
                <p className="font-math text-lg font-bold text-[#39286F] tabular-nums">
                  {totalStars}
                </p>
                <p className="text-[11px] text-slate-500">Stars</p>
              </div>
              <div>
                <p className="font-math text-lg font-bold text-[#39286F] tabular-nums">
                  {progress.completedCtlActivities.length}/{CTL_ACTIVITIES_CONFIG.length}
                </p>
                <p className="text-[11px] text-slate-500">Core Missions</p>
              </div>
              <div>
                <p className="font-math text-lg font-bold text-[#39286F] tabular-nums">
                  {progress.completedOpLabIds.length}/8
                </p>
                <p className="text-[11px] text-slate-500">Operation Lab</p>
              </div>
            </div>
          </section>

          {/* Recent Achievements */}
          <section className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#39286F]">Recent Achievements</h2>
              <button
                type="button"
                onClick={() => onNavigate('achievements')}
                className="text-xs font-semibold text-[#5943A8] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {BADGE_DEFINITIONS.slice(0, 3).map((badge) => {
                const earned = progress.badgeIds.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center rounded-xl border p-3 text-center ${
                      earned
                        ? 'border-[#E5E0F3] bg-[#FCFBFF]'
                        : 'border-dashed border-[#E5E0F3] bg-slate-50/70 opacity-65'
                    }`}
                  >
                    <div
                      style={{
                        backgroundColor: earned ? badge.accentColor : '#CBD5E1',
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                    >
                      <Award className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-xs font-bold text-[#39286F] leading-tight">
                      {badge.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {earned ? 'Earned' : 'Locked'}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Learning Pathway Overview */}
      <section className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#39286F]">
              Learning Pathway Overview
            </h2>
            <p className="text-xs text-slate-600">
              Follow the guided progression from Algebra Foundations through Story Missions 1–4, or jump directly into Operation Lab and Quizzes.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-4">
          {LEARNING_PATHWAY_MAP.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => onNavigate(row.targetTab)}
              className="flex flex-col justify-between rounded-xl border border-[#E5E0F3] bg-[#FCFBFF] p-3.5 text-left transition-colors hover:border-[#5943A8]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#39286F]">{row.pathway}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      row.statusLabel === 'Core'
                        ? 'bg-[#EAF7F5] text-[#14554E]'
                        : row.statusLabel === 'Advanced'
                        ? 'bg-[#EFEAFD] text-[#5943A8]'
                        : 'bg-[#EEF5FD] text-[#184376]'
                    }`}
                  >
                    {row.statusLabel}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                  {row.contentSummary}
                </p>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#5943A8]">
                Open Module <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Quick Module Shortcuts */}
      <section aria-label="Quick Module Shortcuts" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          {
            id: 'academy' as AppTab,
            title: 'Learn Concepts',
            desc: 'Foundations & glossary',
            icon: BookOpen,
            accent: '#3A86D8',
          },
          {
            id: 'story' as AppTab,
            title: 'Story Missions',
            desc: 'Missions 1–4 & proofs',
            icon: Map,
            accent: '#27A89A',
          },
          {
            id: 'workshop' as AppTab,
            title: 'Algebra Workshop',
            desc: 'Interactive Snap & Stack',
            icon: Shapes,
            accent: '#1E8E82',
          },
          {
            id: 'oplab' as AppTab,
            title: 'Operation Lab',
            desc: '4 algebraic operations',
            icon: Calculator,
            accent: '#5943A8',
          },
          {
            id: 'challenge' as AppTab,
            title: 'Challenge Arena',
            desc: '8 progressive puzzles',
            icon: Flag,
            accent: '#EF8748',
          },
          {
            id: 'assessment' as AppTab,
            title: 'Quiz & Check',
            desc: 'Practice quizzes & notes',
            icon: Compass,
            accent: '#5943A8',
          },
          {
            id: 'teacher' as AppTab,
            title: 'Teacher Mode',
            desc: 'Demo & summary export',
            icon: GraduationCap,
            accent: '#39286F',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onNavigate(card.id)}
              className="flex flex-col items-start rounded-2xl border border-[#E5E0F3] bg-white p-4 text-left transition-colors hover:border-[#5943A8] hover:bg-[#FCFBFF]"
            >
              <div
                style={{ backgroundColor: `${card.accent}18`, color: card.accent }}
                className="flex h-9 w-9 items-center justify-center rounded-xl"
              >
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-bold text-[#39286F]">{card.title}</p>
              <p className="mt-0.5 text-xs text-slate-600">{card.desc}</p>
            </button>
          );
        })}
      </section>
    </div>
  );
};
