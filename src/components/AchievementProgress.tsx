import React, { useState } from 'react';
import { Award, CheckCircle2, History, RotateCcw, Star } from 'lucide-react';
import { Progress } from '../types/algebra';
import { BADGE_DEFINITIONS, calculateLevelFromXp, countTotalStars } from '../engine/GameSystem';
import { MISSIONS_CONFIG } from '../data/curriculumConfig';

interface AchievementProgressProps {
  progress: Progress;
  storageAvailable: boolean;
  onResetProgress: () => void;
}

export const AchievementProgress: React.FC<AchievementProgressProps> = ({
  progress,
  storageAvailable,
  onResetProgress,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const levelInfo = calculateLevelFromXp(progress.xp);
  const totalStars = countTotalStars(progress);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E0F3] bg-white px-6 py-4">
        <div>
          <p className="text-xs font-semibold text-[#5943A8]">ACHIEVEMENT & PROGRESS</p>
          <h1 className="text-xl font-extrabold text-[#39286F]">
            Pencapaian & Riwayat Belajar
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            Status penyimpanan:{' '}
            {storageAvailable
              ? 'Tersimpan otomatis secara lokal di browser ini (LocalStorage).'
              : 'LocalStorage tidak tersedia di sesi browser ini.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#C94438]/35 bg-white px-3.5 py-2 text-xs font-semibold text-[#9B2F25] hover:bg-[#FFF2F0]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Progres Lokal
        </button>
      </div>

      {confirmReset && (
        <div
          role="alertdialog"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#C94438] bg-[#FFF2F0] px-5 py-3.5 text-sm text-[#8F241B]"
        >
          <span>
            Yakin ingin menghapus seluruh XP, misi selesai, badge, dan riwayat kuis di perangkat ini?
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="rounded-xl border border-[#E5E0F3] bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onResetProgress();
                setConfirmReset(false);
              }}
              className="rounded-xl bg-[#C94438] px-3.5 py-1.5 text-xs font-bold text-white"
            >
              Ya, Hapus Semua Progres
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#E5E0F3] bg-white p-4">
          <p className="text-xs text-slate-500">Level Saat Ini</p>
          <p className="mt-1 font-math text-2xl font-extrabold text-[#39286F] tabular-nums">
            Level {String(levelInfo.level).padStart(2, '0')}
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#ECE7F8]">
            <div
              style={{ width: `${Math.max(4, levelInfo.progressPercent)}%` }}
              className="h-full rounded-full bg-[#5943A8]"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
            {levelInfo.currentLevelXp} / {levelInfo.nextLevelThreshold} XP ke level berikutnya
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5E0F3] bg-white p-4">
          <p className="text-xs text-slate-500">Total XP</p>
          <p className="mt-1 font-math text-2xl font-extrabold text-[#5943A8] tabular-nums">
            {progress.xp} XP
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Dari misi, kuis & pemahaman
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5E0F3] bg-white p-4">
          <p className="text-xs text-slate-500">Total Bintang</p>
          <p className="mt-1 flex items-center gap-1.5 font-math text-2xl font-extrabold text-[#D97706] tabular-nums">
            <Star className="h-5 w-5 fill-[#F4C95D] text-[#D97706]" />
            {totalStars} / {MISSIONS_CONFIG.length * 3}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Berdasarkan ketepatan langkah
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5E0F3] bg-white p-4">
          <p className="text-xs text-slate-500">Konsep Dikuasai</p>
          <p className="mt-1 font-math text-2xl font-extrabold text-[#27A89A] tabular-nums">
            {progress.badgeIds.length} / {BADGE_DEFINITIONS.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Badge terbuka</p>
        </div>
      </div>

      {/* Badges Grid */}
      <section className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
        <h2 className="text-lg font-bold text-[#39286F]">Koleksi Badge Penguasaan Konsep</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BADGE_DEFINITIONS.map((badge) => {
            const earned = progress.badgeIds.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`flex items-start gap-3.5 rounded-2xl border p-4 ${
                  earned
                    ? 'border-[#E5E0F3] bg-[#FCFBFF]'
                    : 'border-dashed border-[#E5E0F3] bg-slate-50/60 opacity-70'
                }`}
              >
                <div
                  style={{ backgroundColor: earned ? badge.accentColor : '#94A3B8' }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                >
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-[#39286F]">{badge.title}</h3>
                    {earned && <CheckCircle2 className="h-4 w-4 text-[#27A89A]" />}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{badge.description}</p>
                  <p className="mt-1.5 text-[11px] font-medium text-[#5943A8]">
                    Syarat: {badge.criteriaText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Progress Log */}
      <section className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[#5943A8]" />
          <h2 className="text-lg font-bold text-[#39286F]">Riwayat Aktivitas (Progress Log)</h2>
        </div>

        {progress.progressLog.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Belum ada riwayat aktivitas. Selesaikan submateri, misi, atau kuis untuk mencatat progresmu!
          </p>
        ) : (
          <div className="mt-4 divide-y divide-[#F0ECF9]">
            {progress.progressLog.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs"
              >
                <div>
                  <p className="font-bold text-[#39286F]">{entry.title}</p>
                  <p className="text-slate-600">
                    {entry.topic} · {entry.detail}
                  </p>
                </div>
                <div className="text-right">
                  {entry.xpEarned > 0 && (
                    <p className="font-math font-bold text-[#27A89A]">
                      +{entry.xpEarned} XP
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500">
                    {new Date(entry.timestamp).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
