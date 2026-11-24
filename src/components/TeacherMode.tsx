import React, { useState } from 'react';
import {
  BookOpen,
  Calculator,
  ClipboardCheck,
  Download,
  GraduationCap,
  Info,
  Map,
  Presentation,
  RotateCcw,
  Shapes,
  Unlock,
} from 'lucide-react';
import { AppTab, Mission, Progress } from '../types/algebra';
import {
  CTL_ACTIVITIES_CONFIG,
  CURRICULUM_META,
  MISSIONS_CONFIG,
  TOPICS_CONFIG,
} from '../data/curriculumConfig';

interface TeacherModeProps {
  progress: Progress;
  teacherDemoMode: boolean;
  onToggleDemoMode: () => void;
  onLaunchMission: (mission: Mission) => void;
  onLaunchTopic: (topicId: string) => void;
  onLaunchExitTicket: () => void;
  onNavigate: (tab: AppTab) => void;
  onResetWorkspaceSession?: () => void;
}

export const TeacherMode: React.FC<TeacherModeProps> = ({
  progress,
  teacherDemoMode,
  onToggleDemoMode,
  onLaunchMission,
  onLaunchTopic,
  onLaunchExitTicket,
  onNavigate,
  onResetWorkspaceSession,
}) => {
  const [confirmResetWorkspace, setConfirmResetWorkspace] = useState(false);
  const handleDownloadLocalReport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: 'Local activity summary on this device/browser (no multi-student cross-device tracking).',
      nickname: progress.nickname,
      xp: progress.xp,
      level: progress.level,
      completedCtlActivities: progress.completedCtlActivities,
      completedOpLabIds: progress.completedOpLabIds,
      completedMissions: progress.completedMissions,
      completedLessons: progress.completedLessons,
      reasoningNotes: progress.reasoningNotes,
      reflection: progress.reflection || null,
      assessmentHistory: progress.assessmentHistory,
      stats: progress.stats,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algebra-quest-summary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5E0F3] bg-white px-6 py-4">
        <div>
          <p className="text-xs font-semibold text-[#5943A8]">TEACHER MODE (LOCAL)</p>
          <h1 className="text-xl font-extrabold text-[#39286F]">
            Classroom Demonstration &amp; Session Summary
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            Designed for live projector demonstrations and reviewing reasoning notes and session outcomes on this device.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onResetWorkspaceSession && (
            <button
              type="button"
              onClick={() => setConfirmResetWorkspace(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#39286F] hover:bg-[#F7F5FC] whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Workspace Session
            </button>
          )}

          <button
            type="button"
            onClick={onToggleDemoMode}
            aria-pressed={teacherDemoMode}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors whitespace-nowrap ${
              teacherDemoMode
                ? 'bg-[#27A89A] text-white'
                : 'bg-[#5943A8] text-white hover:bg-[#39286F]'
            }`}
          >
            <Unlock className="h-4 w-4" />
            {teacherDemoMode ? 'Demo Unlock Mode: ACTIVE' : 'Enable Demo Mode (Unlock All Levels)'}
          </button>
        </div>
      </div>

      {confirmResetWorkspace && onResetWorkspaceSession && (
        <div
          role="alertdialog"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EF8748] bg-[#FFF8F3] px-5 py-3 text-xs text-[#39286F]"
        >
          <span>
            Reset the workspace board and Undo/Redo history for a fresh demonstration? Learner XP, badges, and completed missions remain saved.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmResetWorkspace(false)}
              className="rounded-lg border border-[#E5E0F3] bg-white px-3 py-1.5 font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onResetWorkspaceSession();
                setConfirmResetWorkspace(false);
              }}
              className="rounded-lg bg-[#C94438] px-3 py-1.5 font-bold text-white"
            >
              Yes, Reset Workspace Session
            </button>
          </div>
        </div>
      )}

      {/* Scope Transparency Note */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#3A86D8]/35 bg-[#EEF5FD] p-4 text-xs leading-relaxed text-[#184376]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2B72C4]" />
        <div>
          <p className="font-bold">Scope &amp; Local Storage Note</p>
          <p className="mt-0.5">
            {CURRICULUM_META.note} This application stores progress, reasoning notes, and reflections locally in the browser on the same device (there is no real-time multi-device class synchronization without a backend).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Quick Demonstration Launcher */}
        <section className="rounded-2xl border border-[#E5E0F3] bg-white p-5">
          <div className="flex items-center gap-2">
            <Presentation className="h-5 w-5 text-[#5943A8]" />
            <h2 className="text-base font-bold text-[#39286F]">
              Classroom Demonstration Launcher
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Open core story missions, Operation Lab, Exit Ticket, or manipulative challenges directly for live demonstrations.
          </p>

          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => onNavigate('story')}
                className="flex items-center justify-between rounded-xl border border-[#27A89A]/40 bg-[#F5FCFA] px-3 py-2.5 text-left text-xs font-bold text-[#14554E] hover:border-[#27A89A]"
              >
                <span className="flex items-center gap-1.5">
                  <Map className="h-4 w-4" />
                  Story Missions (1–4)
                </span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('oplab')}
                className="flex items-center justify-between rounded-xl border border-[#5943A8]/30 bg-[#F7F5FC] px-3 py-2.5 text-left text-xs font-bold text-[#39286F] hover:border-[#5943A8]"
              >
                <span className="flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-[#5943A8]" />
                  Operation Lab
                </span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={onLaunchExitTicket}
                className="flex items-center justify-between rounded-xl border border-[#3A86D8]/35 bg-[#EEF5FD] px-3 py-2.5 text-left text-xs font-bold text-[#184376] hover:border-[#3A86D8]"
              >
                <span className="flex items-center gap-1.5">
                  <ClipboardCheck className="h-4 w-4 text-[#2B72C4]" />
                  Exit Ticket
                </span>
                <span>→</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('workshop')}
              className="flex w-full items-center justify-between rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] px-4 py-3 text-left text-xs font-bold text-[#39286F] hover:border-[#5943A8]"
            >
              <span className="flex items-center gap-2">
                <Shapes className="h-4 w-4 text-[#27A89A]" />
                Open Blank Algebra Workshop Board (Free Demo)
              </span>
              <span>Open →</span>
            </button>

            <p className="pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Learning Academy Topics
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TOPICS_CONFIG.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onLaunchTopic(t.id)}
                  className="flex items-center gap-2 rounded-xl border border-[#E5E0F3] bg-white px-3 py-2 text-left text-xs font-semibold text-[#39286F] hover:bg-[#F7F5FC]"
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#3A86D8]" />
                  <span className="truncate">{t.title}</span>
                </button>
              ))}
            </div>

            <p className="pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Missions &amp; Guiding Prompts
            </p>
            <div className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1">
              {MISSIONS_CONFIG.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onLaunchMission(m)}
                  className="flex w-full flex-col rounded-xl border border-[#E5E0F3] bg-white px-3.5 py-2.5 text-left hover:border-[#5943A8]"
                >
                  <span className="text-xs font-bold text-[#39286F]">
                    Mission {m.order}: {m.title}
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-600">
                    Prompt: {m.lkpdPrompt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Local Session Summary */}
        <section className="flex flex-col justify-between rounded-2xl border border-[#E5E0F3] bg-white p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#5943A8]" />
                <h2 className="text-base font-bold text-[#39286F]">
                  Session Summary on This Device
                </h2>
              </div>
              <button
                type="button"
                onClick={handleDownloadLocalReport}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-white px-3 py-1.5 text-xs font-semibold text-[#39286F] hover:bg-[#F7F5FC]"
              >
                <Download className="h-3.5 w-3.5" />
                Download JSON
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[#F7F5FC] p-3">
                <p className="text-[11px] text-slate-600">Active Explorer</p>
                <p className="mt-0.5 truncate text-sm font-bold text-[#39286F]">
                  {progress.nickname}
                </p>
              </div>
              <div className="rounded-xl bg-[#F7F5FC] p-3">
                <p className="text-[11px] text-slate-600">Story Missions (1–4)</p>
                <p className="mt-0.5 font-math text-sm font-bold text-[#27A89A] tabular-nums">
                  {progress.completedCtlActivities.length} / {CTL_ACTIVITIES_CONFIG.length}
                </p>
              </div>
              <div className="rounded-xl bg-[#F7F5FC] p-3">
                <p className="text-[11px] text-slate-600">Operation Lab</p>
                <p className="mt-0.5 font-math text-sm font-bold text-[#5943A8] tabular-nums">
                  {progress.completedOpLabIds.length} / 8
                </p>
              </div>
              <div className="rounded-xl bg-[#F7F5FC] p-3">
                <p className="text-[11px] text-slate-600">Challenge Missions</p>
                <p className="mt-0.5 font-math text-sm font-bold text-[#39286F] tabular-nums">
                  {Object.keys(progress.completedMissions).length} / {MISSIONS_CONFIG.length}
                </p>
              </div>
              <div className="rounded-xl bg-[#F7F5FC] p-3">
                <p className="text-[11px] text-slate-600">Zero Pairs</p>
                <p className="mt-0.5 font-math text-sm font-bold text-[#EF8748] tabular-nums">
                  {progress.stats.zeroPairsCleared}×
                </p>
              </div>
              <div className="rounded-xl bg-[#F7F5FC] p-3">
                <p className="text-[11px] text-slate-600">Equations</p>
                <p className="mt-0.5 font-math text-sm font-bold text-[#27A89A] tabular-nums">
                  {progress.stats.equationsSolved}×
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Latest Reasoning Notes &amp; Reflection
              </h3>
              {progress.reasoningNotes.length === 0 && !progress.reflection ? (
                <p className="mt-2 text-xs text-slate-500">
                  No reasoning notes or reflections recorded on this device yet.
                </p>
              ) : (
                <div className="mt-2 space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {progress.reflection && (
                    <div className="rounded-xl border border-[#27A89A]/30 bg-[#F5FCFA] px-3 py-2 text-xs">
                      <p className="font-bold text-[#14554E]">Student Reflection</p>
                      <p className="text-slate-700">{progress.reflection.understandingSummary}</p>
                    </div>
                  )}
                  {progress.reasoningNotes.slice(0, 3).map((r) => (
                    <div
                      key={`${r.source}-${r.id}`}
                      className="rounded-xl border border-[#E5E0F3] px-3 py-2 text-xs"
                    >
                      <p className="font-semibold text-[#39286F]">{r.title}</p>
                      <p className="text-slate-600">{r.reasonText}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Local Quiz History
              </h3>
              {progress.assessmentHistory.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  No quizzes completed on this device yet.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {progress.assessmentHistory.slice(0, 4).map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between rounded-xl border border-[#E5E0F3] px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-[#39286F]">{h.quizTitle}</span>
                      <span className="font-math font-bold text-[#27A89A] tabular-nums">
                        {h.score}/{h.totalQuestions} ({h.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[#E5E0F3] bg-[#FCFBFF] p-3 text-[11px] text-slate-600">
            <strong>Classroom Facilitation Note:</strong> This platform acts as an interactive manipulative and feedback environment where learners construct visual tile models, verify symbolic expressions, and document their reasoning.
          </div>
        </section>
      </div>
    </div>
  );
};
