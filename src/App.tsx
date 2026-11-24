import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  Calculator,
  CheckSquare,
  Flag,
  GraduationCap,
  Home,
  Map,
  Menu,
  Shapes,
  Star,
  X,
} from 'lucide-react';
import {
  AppTab,
  CtlActivityConfig,
  Mission,
  Progress,
  ReasoningEntry,
  ReflectionEntry,
} from './types/algebra';
import { TOPICS_CONFIG, MISSIONS_CONFIG } from './data/curriculumConfig';
import {
  calculateLevelFromXp,
  calculateMissionStars,
  evaluateUnlockedBadges,
} from './engine/GameSystem';
import {
  appendProgressLog,
  loadProgress,
  resetProgress,
  saveProgress,
} from './storage/ProgressStorage';
import {
  PersistedWorkspaceSession,
  clearWorkspaceSession,
  loadWorkspaceSession,
  saveWorkspaceSession,
} from './storage/WorkspaceStorage';
import { Dashboard } from './components/Dashboard';
import { LearningAcademy } from './components/LearningAcademy';
import { StoryMission } from './components/StoryMission';
import { AlgebraWorkshop, WorkspaceSessionDraft } from './components/AlgebraWorkshop';
import { OperationLab } from './components/OperationLab';
import { ChallengeArena } from './components/ChallengeArena';
import { Assessment } from './components/Assessment';
import { AchievementProgress } from './components/AchievementProgress';
import { TeacherMode } from './components/TeacherMode';

const NAV_ITEMS: Array<{
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'academy', label: 'Learn', icon: BookOpen },
  { id: 'story', label: 'Missions', icon: Map },
  { id: 'workshop', label: 'Workshop', icon: Shapes },
  { id: 'oplab', label: 'Operation Lab', icon: Calculator },
  { id: 'challenge', label: 'Challenges', icon: Flag },
  { id: 'assessment', label: 'Quiz', icon: CheckSquare },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'teacher', label: 'Teacher Mode', icon: GraduationCap },
];

export default function App() {
  const [initialLoad] = useState(() => loadProgress());
  const [initialWorkspaceLoad] = useState(() => loadWorkspaceSession());
  const [progress, setProgress] = useState<Progress>(initialLoad.progress);
  const [storageAvailable] = useState<boolean>(initialLoad.storageAvailable);
  const [workspaceSession, setWorkspaceSession] = useState<PersistedWorkspaceSession | null>(
    initialWorkspaceLoad.session
  );
  const [workspaceResetVersion, setWorkspaceResetVersion] = useState(0);
  const [workspaceSaveStatus, setWorkspaceSaveStatus] = useState<{
    ok: boolean;
    savedAt: string;
    corruptedWarning?: string | null;
  }>(() => ({
    ok: initialWorkspaceLoad.status !== 'unavailable',
    savedAt: initialWorkspaceLoad.session?.savedAt || '',
    corruptedWarning:
      initialWorkspaceLoad.status === 'corrupted'
        ? initialWorkspaceLoad.errorMessage ||
          'Saved workspace data was corrupted or unreadable, so the board was reset safely.'
        : null,
  }));

  const [activeTab, setActiveTab] = useState<AppTab>(
    initialLoad.progress.lastActiveTab || 'dashboard'
  );
  const [activeMission, setActiveMission] = useState<Mission | null>(() => {
    const savedTab = initialLoad.progress.lastActiveTab;
    const savedMissionId = initialWorkspaceLoad.session?.activeMissionId;
    if (savedTab === 'workshop' && savedMissionId) {
      return MISSIONS_CONFIG.find((m) => m.id === savedMissionId) || null;
    }
    return null;
  });
  const [academyTopicId, setAcademyTopicId] = useState<string | null>(null);
  const [initialQuizId, setInitialQuizId] = useState<string | null>(null);
  const [teacherDemoMode, setTeacherDemoMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(() => {
    if (initialLoad.corrupted) {
      return 'Previous local progress data was corrupted or unreadable, so progress was safely reset.';
    }
    if (initialWorkspaceLoad.status === 'corrupted') {
      return (
        initialWorkspaceLoad.errorMessage ||
        'Previous saved workspace data was corrupted or invalid, so a new workspace was started.'
      );
    }
    return null;
  });

  useEffect(() => {
    const res = saveProgress(progress);
    if (!res.ok) {
      setSaveNotice('Local storage is unavailable in this browser mode.');
    }
  }, [progress]);

  const levelInfo = calculateLevelFromXp(progress.xp);

  const navigateTo = (tab: AppTab) => {
    setActiveTab(tab);
    setProgress((prev) => ({ ...prev, lastActiveTab: tab }));
    setMobileMenuOpen(false);
    if (tab !== 'workshop') {
      setActiveMission(null);
    } else if (workspaceSession?.activeMissionId) {
      const resumedMission =
        MISSIONS_CONFIG.find((m) => m.id === workspaceSession.activeMissionId) || null;
      setActiveMission(resumedMission);
    }
    if (tab !== 'assessment') {
      setInitialQuizId(null);
    }
  };

  const handleContinueWorkspace = () => {
    const resumedMission = workspaceSession?.activeMissionId
      ? MISSIONS_CONFIG.find((m) => m.id === workspaceSession.activeMissionId) || null
      : null;
    setActiveMission(resumedMission);
    setActiveTab('workshop');
    setProgress((prev) => ({ ...prev, lastActiveTab: 'workshop' }));
    setMobileMenuOpen(false);
  };

  const handleWorkspaceSessionChange = (draft: WorkspaceSessionDraft) => {
    const res = saveWorkspaceSession(draft);
    setWorkspaceSession(res.session);
    setWorkspaceSaveStatus({
      ok: res.ok,
      savedAt: res.savedAt,
      corruptedWarning: null,
    });
  };

  const handleResetWorkspaceSession = () => {
    clearWorkspaceSession();
    setWorkspaceSession(null);
    setActiveMission(null);
    setWorkspaceResetVersion((v) => v + 1);
    setWorkspaceSaveStatus({
      ok: storageAvailable,
      savedAt: '',
      corruptedWarning: null,
    });
    setSaveNotice(
      'New workspace is ready. Your XP, stars, badges, and completed missions remain saved.'
    );
  };

  const handleLaunchExitTicket = () => {
    setInitialQuizId('exit_ticket');
    setActiveTab('assessment');
    setProgress((prev) => ({ ...prev, lastActiveTab: 'assessment' }));
    setMobileMenuOpen(false);
  };

  const handleStartMission = (mission: Mission) => {
    setActiveMission(mission);
    setActiveTab('workshop');
    setProgress((prev) => ({ ...prev, lastActiveTab: 'workshop' }));
    setMobileMenuOpen(false);
  };

  const handleOpenTopicByLevel = (levelId: string) => {
    const matchingTopic = TOPICS_CONFIG.find((t) => t.levelId === levelId);
    if (matchingTopic) {
      setAcademyTopicId(matchingTopic.id);
    }
    setActiveTab('academy');
    setProgress((prev) => ({ ...prev, lastActiveTab: 'academy' }));
    setMobileMenuOpen(false);
  };

  const handleSaveReasoning = (
    source: ReasoningEntry['source'],
    id: string,
    title: string,
    reasonText: string
  ) => {
    setProgress((prev) => {
      const filtered = prev.reasoningNotes.filter(
        (n) => !(n.source === source && n.id === id)
      );
      const nextEntry: ReasoningEntry = {
        id,
        source,
        title,
        reasonText,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        reasoningNotes: [nextEntry, ...filtered].slice(0, 40),
      };
    });
  };

  const handleCompleteCtlActivity = (activity: CtlActivityConfig, reasonText: string) => {
    setProgress((prev) => {
      const alreadyDone = prev.completedCtlActivities.includes(activity.id);
      const earnedXp = alreadyDone ? 0 : activity.rewardXp;
      const nextCtl = alreadyDone
        ? prev.completedCtlActivities
        : [...prev.completedCtlActivities, activity.id];

      const filteredNotes = prev.reasoningNotes.filter(
        (n) => !(n.source === 'ctl' && n.id === activity.id)
      );
      const nextNotes: ReasoningEntry[] = [
        {
          id: activity.id,
          source: 'ctl',
          title: activity.title,
          reasonText,
          updatedAt: new Date().toISOString(),
        },
        ...filteredNotes,
      ];
      const slicedNotes = nextNotes.slice(0, 40);

      let updated: Progress = {
        ...prev,
        xp: prev.xp + earnedXp,
        completedCtlActivities: nextCtl,
        reasoningNotes: slicedNotes,
      };
      updated = appendProgressLog(updated, {
        activityType: 'ctl',
        title: activity.title,
        topic: 'Core Story Missions',
        detail: alreadyDone
          ? 'Updated mission reasoning note'
          : 'Completed mission & reasoning note',
        xpEarned: earnedXp,
      });
      updated.badgeIds = evaluateUnlockedBadges(updated);
      updated.level = calculateLevelFromXp(updated.xp).level;
      return updated;
    });
  };

  const handleCompleteOpLabExercise = (
    exerciseId: string,
    opTitle: string,
    problemLabel: string,
    reasonText?: string
  ) => {
    setProgress((prev) => {
      const alreadyDone = prev.completedOpLabIds.includes(exerciseId);
      const earnedXp = alreadyDone ? 0 : 40;
      const nextIds = alreadyDone
        ? prev.completedOpLabIds
        : [...prev.completedOpLabIds, exerciseId];

      let nextNotes = prev.reasoningNotes;
      if (reasonText) {
        const filtered = prev.reasoningNotes.filter(
          (n) => !(n.source === 'oplab' && n.id === exerciseId)
        );
        const addedNotes: ReasoningEntry[] = [
          {
            id: exerciseId,
            source: 'oplab',
            title: `${opTitle}: ${problemLabel}`,
            reasonText,
            updatedAt: new Date().toISOString(),
          },
          ...filtered,
        ];
        nextNotes = addedNotes.slice(0, 40);
      }

      let updated: Progress = {
        ...prev,
        xp: prev.xp + earnedXp,
        completedOpLabIds: nextIds,
        reasoningNotes: nextNotes,
      };
      updated = appendProgressLog(updated, {
        activityType: 'oplab',
        title: `${opTitle}: ${problemLabel}`,
        topic: 'Operation Lab',
        detail: alreadyDone ? 'Repeated operation practice' : 'Completed operation practice',
        xpEarned: earnedXp,
      });
      updated.badgeIds = evaluateUnlockedBadges(updated);
      updated.level = calculateLevelFromXp(updated.xp).level;
      return updated;
    });
  };

  const handleCompleteLesson = (
    lessonId: string,
    lessonTitle: string,
    topicTitle: string
  ) => {
    setProgress((prev) => {
      const alreadyDone = prev.completedLessons.includes(lessonId);
      const earnedXp = alreadyDone ? 0 : 30;
      const nextLessons = alreadyDone
        ? prev.completedLessons
        : [...prev.completedLessons, lessonId];

      let updated: Progress = {
        ...prev,
        xp: prev.xp + earnedXp,
        completedLessons: nextLessons,
      };
      updated = appendProgressLog(updated, {
        activityType: 'academy',
        title: `Lesson: ${lessonTitle}`,
        topic: topicTitle,
        detail: alreadyDone ? 'Reviewed concept check' : 'Completed concept check',
        xpEarned: earnedXp,
      });
      updated.badgeIds = evaluateUnlockedBadges(updated);
      updated.level = calculateLevelFromXp(updated.xp).level;
      return updated;
    });
  };

  const handleMissionSuccess = (
    mission: Mission,
    attempts: number,
    hintsUsed: number
  ) => {
    setProgress((prev) => {
      const existing = prev.completedMissions[mission.id];
      const stars = calculateMissionStars(attempts, hintsUsed);
      const earnedXp = existing ? 0 : mission.rewardXp;
      const bestStars = existing ? (Math.max(existing.stars, stars) as 1 | 2 | 3) : stars;

      let updated: Progress = {
        ...prev,
        xp: prev.xp + earnedXp,
        completedMissions: {
          ...prev.completedMissions,
          [mission.id]: {
            missionId: mission.id,
            stars: bestStars,
            attempts,
            hintsUsed,
            completedAt: new Date().toISOString(),
          },
        },
        lastMissionId: mission.id,
      };

      updated = appendProgressLog(updated, {
        activityType: 'mission',
        title: `Mission Completed: ${mission.title}`,
        topic: mission.topic,
        detail: `${stars} star(s) (${attempts} attempt(s))`,
        xpEarned: earnedXp,
      });
      updated.badgeIds = evaluateUnlockedBadges(updated);
      updated.level = calculateLevelFromXp(updated.xp).level;
      return updated;
    });
  };

  const handleFinishQuiz = (entry: {
    quizId: string;
    quizTitle: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    weakTopics: string[];
  }) => {
    const earnedXp = entry.score * 25;
    setProgress((prev) => {
      let updated: Progress = {
        ...prev,
        xp: prev.xp + earnedXp,
        assessmentHistory: [
          {
            ...entry,
            id: `quiz-${Date.now()}`,
            completedAt: new Date().toISOString(),
          },
          ...prev.assessmentHistory,
        ].slice(0, 25),
      };
      updated = appendProgressLog(updated, {
        activityType: 'assessment',
        title: entry.quizTitle,
        topic: 'Assessment',
        detail: `Score ${entry.score}/${entry.totalQuestions} (${entry.percentage}%)`,
        xpEarned: earnedXp,
      });
      updated.badgeIds = evaluateUnlockedBadges(updated);
      updated.level = calculateLevelFromXp(updated.xp).level;
      return updated;
    });
  };

  const handleSaveReflection = (reflection: Omit<ReflectionEntry, 'updatedAt'>) => {
    setProgress((prev) => {
      let updated: Progress = {
        ...prev,
        reflection: {
          ...reflection,
          updatedAt: new Date().toISOString(),
        },
      };
      updated = appendProgressLog(updated, {
        activityType: 'reflection',
        title: 'Student Learning Reflection',
        topic: 'Learning Reflection',
        detail: reflection.understandingSummary.slice(0, 80),
        xpEarned: 0,
      });
      return updated;
    });
  };

  const incrementStat = (key: keyof Progress['stats'], amount = 1) => {
    setProgress((prev) => {
      const updated: Progress = {
        ...prev,
        stats: {
          ...prev.stats,
          [key]: prev.stats[key] + amount,
        },
      };
      updated.badgeIds = evaluateUnlockedBadges(updated);
      return updated;
    });
  };

  const handleResetProgress = () => {
    const fresh = resetProgress();
    setProgress(fresh);
    setActiveMission(null);
    setSaveNotice('Local progress has been reset to its initial state.');
  };

  const activeMissionSavedReason = activeMission
    ? progress.reasoningNotes.find(
        (n) => n.source === 'mission' && n.id === activeMission.id
      )?.reasonText || ''
    : '';

  if (activeTab === 'workshop') {
    return (
      <AlgebraWorkshop
        activeMission={activeMission}
        savedReason={activeMissionSavedReason}
        initialWorkspaceSession={workspaceSession}
        workspaceResetVersion={workspaceResetVersion}
        workspaceStorageStatus={workspaceSaveStatus}
        onWorkspaceSessionChange={handleWorkspaceSessionChange}
        onStartNewWorkspace={handleResetWorkspaceSession}
        onBackToApp={() => {
          setActiveMission(null);
          navigateTo('dashboard');
        }}
        onExitMission={() => {
          setActiveMission(null);
          navigateTo('challenge');
        }}
        onMissionSuccess={handleMissionSuccess}
        onSaveReasoning={(mission, reasonText) =>
          handleSaveReasoning('mission', mission.id, mission.title, reasonText)
        }
        onZeroPairsCleared={(count) => incrementStat('zeroPairsCleared', count)}
        onLikeTermsCombined={() => incrementStat('likeTermsCombined', 1)}
        onEquationSolved={() => incrementStat('equationsSolved', 1)}
        onMisconceptionGuided={() => incrementStat('misconceptionsGuided', 1)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5FC] text-[#1E163B]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#39286F] text-white shadow-sm">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('dashboard');
              }}
              className="font-display text-lg font-extrabold tracking-tight text-white whitespace-nowrap sm:text-xl"
            >
              ALGEBRA QUEST
            </a>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 rounded-xl bg-white/12 px-3 py-1.5 text-xs font-semibold tabular-nums">
              <Star className="h-3.5 w-3.5 fill-[#F4C95D] text-[#F4C95D]" />
              <span>{progress.xp} XP</span>
              <span aria-hidden="true" className="text-white/40">
                |
              </span>
              <span>Level {String(levelInfo.level).padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="border-b border-[#E5E0F3] bg-white px-4 py-3 lg:hidden"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#5943A8] text-white'
                      : 'bg-[#F7F5FC] text-[#39286F] hover:bg-[#EAE3F9]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Main Content Layout */}
      <div className="mx-auto flex max-w-[1380px] gap-6 px-4 py-5 sm:px-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav
            aria-label="Main Navigation"
            className="sticky top-20 flex flex-col gap-1.5 rounded-2xl border border-[#E5E0F3] bg-white p-3"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#EFEAFD] text-[#39286F]'
                      : 'text-slate-600 hover:bg-[#F7F5FC] hover:text-[#39286F]'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-[#5943A8]' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="mt-3 border-t border-[#F0ECF9] px-2 pt-3 text-[11px] leading-relaxed text-slate-500">
              Explore · Manipulate · Reason · Master Algebra
            </div>
          </nav>
        </aside>

        {/* Active Module Stage */}
        <main className="min-w-0 flex-1">
          {saveNotice && (
            <div
              role={
                saveNotice.includes('corrupted') ||
                saveNotice.includes('unavailable') ||
                saveNotice.includes('invalid') ||
                saveNotice.includes('Unrecognized')
                  ? 'alert'
                  : 'status'
              }
              className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs ${
                saveNotice.includes('corrupted') ||
                saveNotice.includes('unavailable') ||
                saveNotice.includes('invalid') ||
                saveNotice.includes('Unrecognized')
                  ? 'border-[#EF8748] bg-[#FFF8F3] text-[#8F3E10]'
                  : 'border-[#E5E0F3] bg-white text-slate-700'
              }`}
            >
              <span>{saveNotice}</span>
              <button
                type="button"
                onClick={() => {
                  setSaveNotice(null);
                  setWorkspaceSaveStatus((prev) => ({ ...prev, corruptedWarning: null }));
                }}
                className="shrink-0 font-semibold text-[#5943A8] underline"
              >
                Close
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              progress={progress}
              teacherDemoMode={teacherDemoMode}
              savedWorkspace={workspaceSession}
              onContinueWorkspace={handleContinueWorkspace}
              onResetWorkspaceSession={handleResetWorkspaceSession}
              onUpdateNickname={(nickname) =>
                setProgress((prev) => ({ ...prev, nickname }))
              }
              onNavigate={navigateTo}
              onStartMission={handleStartMission}
              onOpenTopicByLevel={handleOpenTopicByLevel}
            />
          )}

          {activeTab === 'academy' && (
            <LearningAcademy
              completedLessonIds={progress.completedLessons}
              initialTopicId={academyTopicId}
              onCompleteLesson={handleCompleteLesson}
              onGoToWorkshop={() => navigateTo('workshop')}
            />
          )}

          {activeTab === 'story' && (
            <StoryMission
              progress={progress}
              onCompleteActivity={handleCompleteCtlActivity}
              onSaveReasoning={handleSaveReasoning}
              onGoToWorkshop={() => navigateTo('workshop')}
              onGoToExitTicket={handleLaunchExitTicket}
            />
          )}

          {activeTab === 'oplab' && (
            <OperationLab
              progress={progress}
              onCompleteExercise={handleCompleteOpLabExercise}
              onSaveReasoning={handleSaveReasoning}
            />
          )}

          {activeTab === 'challenge' && (
            <ChallengeArena
              progress={progress}
              teacherDemoMode={teacherDemoMode}
              onStartMission={handleStartMission}
            />
          )}

          {activeTab === 'assessment' && (
            <Assessment
              history={progress.assessmentHistory}
              savedReflection={progress.reflection}
              initialQuizId={initialQuizId}
              onFinishQuiz={handleFinishQuiz}
              onSaveReflection={handleSaveReflection}
              onReviewTopic={(topicId) => {
                setAcademyTopicId(topicId);
                navigateTo('academy');
              }}
            />
          )}

          {activeTab === 'achievements' && (
            <AchievementProgress
              progress={progress}
              storageAvailable={storageAvailable}
              onResetProgress={handleResetProgress}
            />
          )}

          {activeTab === 'teacher' && (
            <TeacherMode
              progress={progress}
              teacherDemoMode={teacherDemoMode}
              onToggleDemoMode={() => setTeacherDemoMode((v) => !v)}
              onLaunchMission={handleStartMission}
              onLaunchTopic={(topicId) => {
                setAcademyTopicId(topicId);
                navigateTo('academy');
              }}
              onLaunchExitTicket={handleLaunchExitTicket}
              onNavigate={navigateTo}
              onResetWorkspaceSession={handleResetWorkspaceSession}
            />
          )}
        </main>
      </div>
    </div>
  );
}
