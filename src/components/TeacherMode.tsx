import React from 'react';
import {
  BookOpen,
  Download,
  GraduationCap,
  Info,
  Presentation,
  Shapes,
  Unlock,
} from 'lucide-react';
import { AppTab, Mission, Progress } from '../types/algebra';
import {
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
  onNavigate: (tab: AppTab) => void;
}

export const TeacherMode: React.FC<TeacherModeProps> = ({
  progress,
  teacherDemoMode,
  onToggleDemoMode,
  onLaunchMission,
  onLaunchTopic,
  onNavigate,
}) => {
  const handleDownloadLocalReport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: 'Ringkasan aktivitas lokal pada perangkat/browser ini (versi awal tanpa backend).',
      nickname: progress.nickname,
      xp: progress.xp,
      level: progress.level,
      completedMissions: progress.completedMissions,
      completedLessons: progress.completedLessons,
      assessmentHistory: progress.assessmentHistory,
      stats: progress.stats,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algebra-quest-ringkasan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5E0F3] bg-white px-6 py-4">
        <div>
          <p className="text-xs font-semibold text-[#5943A8]">TEACHER MODE (LOKAL)</p>
          <h1 className="text-xl font-extrabold text-[#39286F]">
            Mode Demonstrasi Kelas & Ringkasan Sesi
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            Dirancang untuk demonstrasi layar proyektor bersama LKPD dan meninjau hasil sesi pada perangkat ini.
          </p>
        </div>

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
          {teacherDemoMode ? 'Mode Demo Terbuka: AKTIF' : 'Aktifkan Mode Demo (Buka Semua Level)'}
        </button>
      </div>

      {/* Scope Transparency Note per Spec 3.7 & 13 */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#3A86D8]/35 bg-[#EEF5FD] p-4 text-xs leading-relaxed text-[#184376]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2B72C4]" />
        <div>
          <p className="font-bold">Catatan Cakupan & Penyimpanan Lokal</p>
          <p className="mt-0.5">
            {CURRICULUM_META.note} Versi awal ini menyimpan progres secara lokal di browser pada perangkat yang sama, dan tidak melakukan pelacakan multi-siswa secara real-time antar perangkat tanpa backend.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Quick Demonstration Launcher */}
        <section className="rounded-2xl border border-[#E5E0F3] bg-white p-5">
          <div className="flex items-center gap-2">
            <Presentation className="h-5 w-5 text-[#5943A8]" />
            <h2 className="text-base font-bold text-[#39286F]">
              Peluncur Demonstrasi Kelas
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Pilih langsung topik atau misi untuk didemonstrasikan di depan kelas.
          </p>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => onNavigate('workshop')}
              className="flex w-full items-center justify-between rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] px-4 py-3 text-left text-xs font-bold text-[#39286F] hover:border-[#5943A8]"
            >
              <span className="flex items-center gap-2">
                <Shapes className="h-4 w-4 text-[#27A89A]" />
                Buka Papan Algebra Workshop Kosong (Demo Bebas)
              </span>
              <span>Buka →</span>
            </button>

            <p className="pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Topik Learning Academy
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
              Misi & Pertanyaan Pemantik LKPD
            </p>
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {MISSIONS_CONFIG.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onLaunchMission(m)}
                  className="flex w-full flex-col rounded-xl border border-[#E5E0F3] bg-white px-3.5 py-2.5 text-left hover:border-[#5943A8]"
                >
                  <span className="text-xs font-bold text-[#39286F]">
                    Misi {m.order}: {m.title}
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-600">
                    LKPD: {m.lkpdPrompt}
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
                  Ringkasan Aktivitas Perangkat Ini
                </h2>
              </div>
              <button
                type="button"
                onClick={handleDownloadLocalReport}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-white px-3 py-1.5 text-xs font-semibold text-[#39286F] hover:bg-[#F7F5FC]"
              >
                <Download className="h-3.5 w-3.5" />
                Unduh JSON
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F5FC] p-3.5">
                <p className="text-[11px] text-slate-600">Pengguna Aktif</p>
                <p className="mt-0.5 text-sm font-bold text-[#39286F]">{progress.nickname}</p>
              </div>
              <div className="rounded-xl bg-[#F7F5FC] p-3.5">
                <p className="text-[11px] text-slate-600">Misi Selesai</p>
                <p className="mt-0.5 font-math text-sm font-bold text-[#39286F] tabular-nums">
                  {Object.keys(progress.completedMissions).length} / {MISSIONS_CONFIG.length}
                </p>
              </div>
              <div className="rounded-xl bg-[#F7F5FC] p-3.5">
                <p className="text-[11px] text-slate-600">Zero Pair Disederhanakan</p>
                <p className="mt-0.5 font-math text-sm font-bold text-[#EF8748] tabular-nums">
                  {progress.stats.zeroPairsCleared} kali
                </p>
              </div>
              <div className="rounded-xl bg-[#F7F5FC] p-3.5">
                <p className="text-[11px] text-slate-600">Persamaan Diselesaikan</p>
                <p className="mt-0.5 font-math text-sm font-bold text-[#27A89A] tabular-nums">
                  {progress.stats.equationsSolved} kali
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Riwayat Kuis Lokal
              </h3>
              {progress.assessmentHistory.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  Belum ada kuis yang diselesaikan pada perangkat ini.
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
            <strong>Integrasi LKPD:</strong> Gunakan aplikasi ini sebagai alat manipulatif visual untuk memfasilitasi diskusi kelas mengapa suku sejenis dapat digabung dan bagaimana zero pairs menjaga kesetaraan.
          </div>
        </section>
      </div>
    </div>
  );
};
