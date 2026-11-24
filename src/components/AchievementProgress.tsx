import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  HeartHandshake,
  History,
  MessageSquareText,
  RotateCcw,
  Star,
} from 'lucide-react';
import { Progress } from '../types/algebra';
import { BADGE_DEFINITIONS, calculateLevelFromXp, countTotalStars } from '../engine/GameSystem';
import { CTL_ACTIVITIES_CONFIG, MISSIONS_CONFIG } from '../data/curriculumConfig';

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
          <p className="text-xs font-semibold text-[#5943A8]">ACHIEVEMENTS &amp; PROGRESS</p>
          <h1 className="text-xl font-extrabold text-[#39286F]">
            Achievements, Reflections &amp; Learning History
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            Storage status:{' '}
            {storageAvailable
              ? 'Automatically saved locally in this browser (LocalStorage).'
              : 'LocalStorage is unavailable in this browser session.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#C94438]/35 bg-white px-3.5 py-2 text-xs font-semibold text-[#9B2F25] hover:bg-[#FFF2F0]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Local Progress
        </button>
      </div>

      {confirmReset && (
        <div
          role="alertdialog"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#C94438] bg-[#FFF2F0] px-5 py-3.5 text-sm text-[#8F241B]"
        >
          <span>
            Are you sure you want to clear all XP, completed missions, reasoning notes, reflections, badges, and quiz history on this device?
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="rounded-xl border border-[#E5E0F3] bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onResetProgress();
                setConfirmReset(false);
              }}
              className="rounded-xl bg-[#C94438] px-3.5 py-1.5 text-xs font-bold text-white"
            >
              Yes, Clear All Progress
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-[#E5E0F3] bg-white p-4">
          <p className="text-xs text-slate-500">Current Level</p>
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
            {levelInfo.currentLevelXp} / {levelInfo.nextLevelThreshold} XP
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5E0F3] bg-white p-4">
          <p className="text-xs text-slate-500">Total XP</p>
          <p className="mt-1 font-math text-2xl font-extrabold text-[#5943A8] tabular-nums">
            {progress.xp} XP
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Missions &amp; quizzes</p>
        </div>

        <div className="rounded-2xl border border-[#E5E0F3] bg-white p-4">
          <p className="text-xs text-slate-500">Total Stars</p>
          <p className="mt-1 flex items-center gap-1.5 font-math text-2xl font-extrabold text-[#D97706] tabular-nums">
            <Star className="h-5 w-5 fill-[#F4C95D] text-[#D97706]" />
            {totalStars} / {MISSIONS_CONFIG.length * 3}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Step accuracy</p>
        </div>

        <div className="rounded-2xl border border-[#E5E0F3] bg-white p-4">
          <p className="text-xs text-slate-500">Core Missions (1–4)</p>
          <p className="mt-1 font-math text-2xl font-extrabold text-[#27A89A] tabular-nums">
            {progress.completedCtlActivities.length} / {CTL_ACTIVITIES_CONFIG.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Story activities</p>
        </div>

        <div className="rounded-2xl border border-[#E5E0F3] bg-white p-4">
          <p className="text-xs text-slate-500">Operation Lab</p>
          <p className="mt-1 font-math text-2xl font-extrabold text-[#3A86D8] tabular-nums">
            {progress.completedOpLabIds.length} / 8
          </p>
          <p className="mt-1 text-[11px] text-slate-500">4 algebraic operations</p>
        </div>

        <div className="rounded-2xl border border-[#E5E0F3] bg-white p-4">
          <p className="text-xs text-slate-500">Badges Unlocked</p>
          <p className="mt-1 font-math text-2xl font-extrabold text-[#27A89A] tabular-nums">
            {progress.badgeIds.length} / {BADGE_DEFINITIONS.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Concept mastery</p>
        </div>
      </div>

      {/* Badges Grid */}
      <section className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
        <h2 className="text-lg font-bold text-[#39286F]">Concept Mastery Badges</h2>
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
                    Criteria: {badge.criteriaText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Reasoning Notes & Reflection */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-[#5943A8]" />
            <h2 className="text-base font-bold text-[#39286F]">
              Student Reasoning Notes ({progress.reasoningNotes.length})
            </h2>
          </div>
          {progress.reasoningNotes.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              No reasoning notes saved yet. Write your reasoning in Story Missions, Workshop, or Operation Lab!
            </p>
          ) : (
            <div className="mt-3 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {progress.reasoningNotes.map((note) => (
                <div
                  key={`${note.source}-${note.id}`}
                  className="rounded-xl border border-[#E5E0F3] bg-[#FCFBFF] p-3 text-xs"
                >
                  <p className="font-bold text-[#39286F]">{note.title}</p>
                  <p className="mt-1 text-slate-700 leading-relaxed">{note.reasonText}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-[#27A89A]" />
            <h2 className="text-base font-bold text-[#39286F]">Latest Learning Reflection</h2>
          </div>
          {!progress.reflection ? (
            <p className="mt-3 text-xs text-slate-500">
              No learning reflection filled out yet. You can complete it on the Quiz &amp; Assessment page.
            </p>
          ) : (
            <div className="mt-3 space-y-2 rounded-xl border border-[#E5E0F3] bg-[#F5FCFA] p-4 text-xs text-slate-700">
              <p>
                <strong className="text-[#39286F]">Key takeaway:</strong>{' '}
                {progress.reflection.understandingSummary}
              </p>
              <p>
                <strong className="text-[#39286F]">Most helpful activity:</strong>{' '}
                {progress.reflection.favoriteActivity}
              </p>
              <p>
                <strong className="text-[#39286F]">Still wondering about:</strong>{' '}
                {progress.reflection.remainingQuestion}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Progress Log */}
      <section className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[#5943A8]" />
          <h2 className="text-lg font-bold text-[#39286F]">Activity History (Progress Log)</h2>
        </div>

        {progress.progressLog.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No activity history yet. Complete lessons, story missions, operation practice, challenges, or quizzes to record your progress!
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
                    {new Date(entry.timestamp).toLocaleString('en-US')}
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
