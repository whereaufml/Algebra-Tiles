import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckSquare,
  Flag,
  GraduationCap,
  Home,
  Menu,
  Shapes,
  Star,
  X,
} from 'lucide-react';
import { AppTab, Mission, Progress } from './types/algebra';
import { TOPICS_CONFIG } from './data/curriculumConfig';
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
import { Dashboard } from './components/Dashboard';
import { LearningAcademy } from './components/LearningAcademy';
import { AlgebraWorkshop } from './components/AlgebraWorkshop';
import { ChallengeArena } from './components/ChallengeArena';
import { Assessment } from './components/Assessment';
import { AchievementProgress } from './components/AchievementProgress';
import { TeacherMode } from './components/TeacherMode';

const NAV_ITEMS: Array<{ id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Beranda', icon: Home },
  { id: 'academy', label: 'Belajar', icon: BookOpen },
  { id: 'workshop', label: 'Workshop', icon: Shapes },
  { id: 'challenge', label: 'Tantangan', icon: Flag },
  { id: 'assessment', label: 'Kuis', icon: CheckSquare },
  { id: 'achievements', label: 'Pencapaian', icon: Award },
  { id: 'teacher', label: 'Mode Guru', icon: GraduationCap },
];

export default function App() {
  const [initialLoad] = useState(() => loadProgress());
  const [progress, setProgress] = useState<Progress>(initialLoad.progress);
  const [storageAvailable] = useState<boolean>(initialLoad.storageAvailable);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [academyTopicId, setAcademyTopicId] = useState<string | null>(null);
  const [teacherDemoMode, setTeacherDemoMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    const res = saveProgress(progress);
    if (!res.ok) {
      setSaveNotice('Penyimpanan lokal tidak tersedia pada mode browser ini.');
    }
  }, [progress]);

  const levelInfo = calculateLevelFromXp(progress.xp);

  const navigateTo = (tab: AppTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (tab !== 'workshop') {
      setActiveMission(null);
    }
  };

  const handleStartMission = (mission: Mission) => {
    setActiveMission(mission);
    setActiveTab('workshop');
    setMobileMenuOpen(false);
  };

  const handleOpenTopicByLevel = (levelId: string) => {
    const matchingTopic = TOPICS_CONFIG.find((t) => t.levelId === levelId);
    if (matchingTopic) {
      setAcademyTopicId(matchingTopic.id);
    }
    setActiveTab('academy');
    setMobileMenuOpen(false);
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
        title: `Materi: ${lessonTitle}`,
        topic: topicTitle,
        detail: alreadyDone ? 'Mengulang cek pemahaman' : 'Menuntaskan cek pemahaman',
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
        title: `Misi Selesai: ${mission.title}`,
        topic: mission.topic,
        detail: `${stars} bintang (${attempts} percobaan)`,
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
        topic: 'Evaluasi',
        detail: `Skor ${entry.score}/${entry.totalQuestions} (${entry.percentage}%)`,
        xpEarned: earnedXp,
      });
      updated.badgeIds = evaluateUnlockedBadges(updated);
      updated.level = calculateLevelFromXp(updated.xp).level;
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
    setSaveNotice('Progres lokal telah direset ke kondisi awal.');
  };

  return (
    <div className="min-h-screen bg-[#F7F5FC] text-[#1E163B]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#39286F] text-white shadow-sm">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <a
              href="#beranda"
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
          aria-label="Navigasi Mobile"
          className="border-b border-[#E5E0F3] bg-white px-4 py-3 lg:hidden"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
            aria-label="Navigasi Utama"
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
              Explore · Manipulate · Solve · Master Algebra
            </div>
          </nav>
        </aside>

        {/* Active Module Stage */}
        <main className="min-w-0 flex-1">
          {saveNotice && (
            <div
              role="status"
              className="mb-4 flex items-center justify-between rounded-xl border border-[#E5E0F3] bg-white px-4 py-2.5 text-xs text-slate-700"
            >
              <span>{saveNotice}</span>
              <button
                type="button"
                onClick={() => setSaveNotice(null)}
                className="font-semibold text-[#5943A8]"
              >
                Tutup
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              progress={progress}
              teacherDemoMode={teacherDemoMode}
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

          {activeTab === 'workshop' && (
            <AlgebraWorkshop
              activeMission={activeMission}
              onExitMission={() => {
                setActiveMission(null);
                setActiveTab('challenge');
              }}
              onMissionSuccess={handleMissionSuccess}
              onZeroPairsCleared={(count) => incrementStat('zeroPairsCleared', count)}
              onLikeTermsCombined={() => incrementStat('likeTermsCombined', 1)}
              onEquationSolved={() => incrementStat('equationsSolved', 1)}
              onMisconceptionGuided={() => incrementStat('misconceptionsGuided', 1)}
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
              onFinishQuiz={handleFinishQuiz}
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
              onNavigate={navigateTo}
            />
          )}
        </main>
      </div>
    </div>
  );
}
