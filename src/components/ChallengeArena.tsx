import React from 'react';
import { ArrowRight, CheckCircle2, Flag, Lock, Star } from 'lucide-react';
import { LevelConfig, Mission, Progress } from '../types/algebra';
import { LEVELS_CONFIG, MISSIONS_CONFIG } from '../data/curriculumConfig';

interface ChallengeArenaProps {
  progress: Progress;
  teacherDemoMode: boolean;
  onStartMission: (mission: Mission) => void;
}

export const ChallengeArena: React.FC<ChallengeArenaProps> = ({
  progress,
  teacherDemoMode,
  onStartMission,
}) => {
  const isLevelUnlocked = (lvl: LevelConfig): boolean => {
    if (teacherDemoMode || !lvl.prerequisiteLevelId) return true;
    const prereqMissions = MISSIONS_CONFIG.filter(
      (m) => m.levelId === lvl.prerequisiteLevelId
    );
    return prereqMissions.some((m) => Boolean(progress.completedMissions[m.id]));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E0F3] bg-white px-6 py-4">
        <div>
          <p className="text-xs font-semibold text-[#5943A8]">CHALLENGE ARENA</p>
          <h1 className="text-xl font-extrabold text-[#39286F]">
            Arena Misi Algebra Quest
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            Selesaikan misi bertahap dari dasar ubin hingga keseimbangan persamaan. Ketepatan dan pemahaman lebih diutamakan daripada kecepatan.
          </p>
        </div>

        <div className="text-right">
          <p className="font-math text-lg font-bold text-[#39286F] tabular-nums">
            {Object.keys(progress.completedMissions).length} / {MISSIONS_CONFIG.length}
          </p>
          <p className="text-xs text-slate-500">Misi Diselesaikan</p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {LEVELS_CONFIG.map((lvl) => {
          const unlocked = isLevelUnlocked(lvl);
          const missions = MISSIONS_CONFIG.filter((m) => m.levelId === lvl.id);

          return (
            <section
              key={lvl.id}
              className="rounded-2xl border border-[#E5E0F3] bg-white p-5"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#F0ECF9] pb-3">
                <div className="flex items-center gap-3">
                  <span
                    style={{ backgroundColor: unlocked ? lvl.color : '#94A3B8' }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl font-math text-sm font-bold text-white"
                  >
                    {lvl.number}
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-[#39286F]">
                      {lvl.title}
                    </h2>
                    <p className="text-xs text-slate-600">{lvl.description}</p>
                  </div>
                </div>
                {!unlocked && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <Lock className="h-3.5 w-3.5" />
                    Selesaikan minimal 1 misi pada level sebelumnya
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {missions.map((mission) => {
                  const completion = progress.completedMissions[mission.id];
                  return (
                    <div
                      key={mission.id}
                      className={`flex flex-col justify-between rounded-xl border p-4 ${
                        completion
                          ? 'border-[#27A89A]/50 bg-[#F7FCFB]'
                          : 'border-[#E5E0F3] bg-[#FCFBFF]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#5943A8]">
                            <Flag className="h-3.5 w-3.5" />
                            Misi {mission.order} · {mission.mode === 'equation' ? 'Persamaan' : 'Ekspresi'}
                          </span>
                          <span className="font-math text-xs font-bold text-[#39286F]">
                            +{mission.rewardXp} XP
                          </span>
                        </div>

                        <h3 className="mt-1.5 text-sm font-bold text-[#39286F]">
                          {mission.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          {mission.instructions}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#ECE7F8] pt-3">
                        {completion ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-[#27A89A]" />
                            <div className="flex items-center gap-0.5" aria-label={`${completion.stars} dari 3 bintang`}>
                              {[1, 2, 3].map((starIdx) => (
                                <Star
                                  key={starIdx}
                                  className={`h-3.5 w-3.5 ${
                                    starIdx <= completion.stars
                                      ? 'fill-[#F4C95D] text-[#D97706]'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Belum selesai</span>
                        )}

                        <button
                          type="button"
                          disabled={!unlocked}
                          onClick={() => onStartMission(mission)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#5943A8] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#39286F] disabled:bg-slate-300 whitespace-nowrap"
                        >
                          {completion ? 'Coba Ulang' : 'Mulai Misi'}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
