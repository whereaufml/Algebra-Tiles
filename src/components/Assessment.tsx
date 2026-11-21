import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { ASSESSMENT_ITEMS, QUIZ_SUITES, TOPICS_CONFIG } from '../data/curriculumConfig';
import { AssessmentHistoryEntry, AssessmentItem, Tile, TileSign, TileType } from '../types/algebra';
import {
  areExpressionsEquivalent,
  createTile,
  createTilesFromSpec,
  formatExpression,
} from '../engine/MathEngine';
import { TileVisual } from './Tile';

interface AssessmentProps {
  history: AssessmentHistoryEntry[];
  onFinishQuiz: (entry: Omit<AssessmentHistoryEntry, 'id' | 'completedAt'>) => void;
  onReviewTopic: (topicId: string) => void;
}

export const Assessment: React.FC<AssessmentProps> = ({
  history,
  onFinishQuiz,
  onReviewTopic,
}) => {
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>(QUIZ_SUITES[0].id);
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [choiceAnswers, setChoiceAnswers] = useState<Record<string, number>>({});
  const [tileAnswers, setTileAnswers] = useState<Record<string, Tile[]>>({});
  const [finished, setFinished] = useState(false);

  const activeSuite = QUIZ_SUITES.find((s) => s.id === selectedSuiteId) || QUIZ_SUITES[0];
  const questions: AssessmentItem[] = ASSESSMENT_ITEMS.filter((item) =>
    (activeSuite.units as readonly string[]).includes(item.unit)
  );
  const currentQ = questions[currentIdx];

  const startQuiz = (suiteId: string) => {
    setSelectedSuiteId(suiteId);
    setStarted(true);
    setCurrentIdx(0);
    setChoiceAnswers({});
    setTileAnswers({});
    setFinished(false);
  };

  const evaluateQuestion = (q: AssessmentItem): boolean => {
    if (q.type === 'build_tiles' && q.expectedTarget) {
      const userTiles = tileAnswers[q.id] || [];
      return areExpressionsEquivalent(
        userTiles,
        q.expectedTarget,
        q.expectedTarget.requireNoZeroPairs
      ).valid;
    }
    return choiceAnswers[q.id] === q.correctOptionIndex;
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    const weakSet = new Set<string>();
    for (const q of questions) {
      if (evaluateQuestion(q)) {
        score += 1;
      } else {
        weakSet.add(q.recommendedTopicId);
      }
    }
    const percentage = Math.round((score / Math.max(1, questions.length)) * 100);
    setFinished(true);
    onFinishQuiz({
      quizId: activeSuite.id,
      quizTitle: activeSuite.title,
      score,
      totalQuestions: questions.length,
      percentage,
      weakTopics: Array.from(weakSet),
    });
  };

  const addMiniTile = (qId: string, type: TileType, sign: TileSign) => {
    const existing = tileAnswers[qId] || [];
    setTileAnswers({
      ...tileAnswers,
      [qId]: [...existing, createTile(type, sign)],
    });
  };

  const removeLastMiniTile = (qId: string) => {
    const existing = tileAnswers[qId] || [];
    setTileAnswers({
      ...tileAnswers,
      [qId]: existing.slice(0, -1),
    });
  };

  if (!started) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-[#E5E0F3] bg-white px-6 py-4">
          <p className="text-xs font-semibold text-[#5943A8]">QUIZ & ASSESSMENT</p>
          <h1 className="text-xl font-extrabold text-[#39286F]">
            Kuis Formatif & Evaluasi Pemahaman
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Uji pemahamanmu melalui soal pilihan ganda, interpretasi model ubin, dan menyusun ekspresi ubin secara langsung.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {QUIZ_SUITES.map((suite) => {
            const count = ASSESSMENT_ITEMS.filter((item) =>
              (suite.units as readonly string[]).includes(item.unit)
            ).length;
            return (
              <div
                key={suite.id}
                className="flex flex-col justify-between rounded-2xl border border-[#E5E0F3] bg-white p-5"
              >
                <div>
                  <span className="text-xs font-semibold text-[#27A89A]">
                    {count} Soal · Tersedia
                  </span>
                  <h2 className="mt-1 text-base font-bold text-[#39286F]">
                    {suite.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {suite.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => startQuiz(suite.id)}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5943A8] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#39286F]"
                >
                  Mulai Kuis
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {history.length > 0 && (
          <section className="rounded-2xl border border-[#E5E0F3] bg-white p-5">
            <h2 className="text-base font-bold text-[#39286F]">Riwayat Evaluasi</h2>
            <div className="mt-3 divide-y divide-[#F0ECF9]">
              {history.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs"
                >
                  <div>
                    <p className="font-semibold text-[#39286F]">{item.quizTitle}</p>
                    <p className="text-slate-500">
                      {new Date(item.completedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className="font-math text-sm font-bold text-[#27A89A] tabular-nums">
                    {item.score}/{item.totalQuestions} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  if (finished) {
    const score = questions.filter(evaluateQuestion).length;
    const percentage = Math.round((score / Math.max(1, questions.length)) * 100);
    const weakTopicIds = Array.from(
      new Set(questions.filter((q) => !evaluateQuestion(q)).map((q) => q.recommendedTopicId))
    );

    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5E0F3] bg-white p-6">
          <div>
            <p className="text-xs font-semibold text-[#5943A8]">HASIL EVALUASI</p>
            <h1 className="mt-1 text-2xl font-extrabold text-[#39286F]">
              {activeSuite.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Skor kamu: <strong className="font-math text-[#39286F]">{score} dari {questions.length}</strong> ({percentage}%)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => startQuiz(activeSuite.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-white px-4 py-2 text-xs font-semibold text-[#39286F] hover:bg-[#F7F5FC]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={() => setStarted(false)}
              className="rounded-xl bg-[#5943A8] px-4 py-2 text-xs font-bold text-white hover:bg-[#39286F]"
            >
              Pilih Kuis Lain
            </button>
          </div>
        </div>

        {weakTopicIds.length > 0 && (
          <div className="rounded-2xl border border-[#F4C95D] bg-[#FFFBEB] p-5">
            <h2 className="text-sm font-bold text-[#78530A]">
              Saran Materi yang Perlu Diulang
            </h2>
            <p className="mt-1 text-xs text-[#78530A]">
              Berdasarkan jawabanmu, kamu disarankan meninjau kembali materi berikut di Learning Academy:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {weakTopicIds.map((topicId) => {
                const topic = TOPICS_CONFIG.find((t) => t.id === topicId);
                if (!topic) return null;
                return (
                  <button
                    key={topicId}
                    type="button"
                    onClick={() => onReviewTopic(topicId)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-[#39286F] border border-[#F4C95D] hover:bg-[#FEF3C7]"
                  >
                    Pelajari {topic.title}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pembahasan tiap soal */}
        <div className="flex flex-col gap-3">
          {questions.map((q, idx) => {
            const correct = evaluateQuestion(q);
            return (
              <div
                key={q.id}
                className="rounded-2xl border border-[#E5E0F3] bg-white p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Soal {idx + 1} · {q.topic}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold ${
                      correct ? 'text-[#1E8E82]' : 'text-[#C94438]'
                    }`}
                  >
                    {correct ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Benar
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" /> Perlu Tinjauan
                      </>
                    )}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-[#39286F]">
                  {q.prompt}
                </p>
                <p className="mt-2 rounded-xl bg-[#F7F5FC] px-3.5 py-2.5 text-xs leading-relaxed text-slate-700">
                  <strong>Pembahasan:</strong> {q.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Question View
  const currentTileList = tileAnswers[currentQ.id] || [];
  const visualTiles = currentQ.visualTiles
    ? createTilesFromSpec(currentQ.visualTiles)
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E0F3] bg-white px-6 py-4">
        <div>
          <p className="text-xs font-semibold text-[#5943A8]">{activeSuite.title}</p>
          <h2 className="text-base font-bold text-[#39286F]">
            Soal {currentIdx + 1} dari {questions.length} · {currentQ.topic}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setStarted(false)}
          className="rounded-xl border border-[#E5E0F3] px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-[#F7F5FC]"
        >
          Keluar Kuis
        </button>
      </div>

      <div className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
        <p className="text-base font-bold text-[#39286F]">{currentQ.prompt}</p>

        {/* Visual Tile Diagram if interpret_tiles */}
        {currentQ.type === 'interpret_tiles' && visualTiles.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-[#E5E0F3] bg-[#F7F5FC] p-4">
            {visualTiles.map((tile) => (
              <TileVisual key={tile.id} type={tile.type} sign={tile.sign} />
            ))}
          </div>
        )}

        {/* Multiple Choice / Interpret Options */}
        {currentQ.options && (
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {currentQ.options.map((opt, idx) => {
              const selected = choiceAnswers[currentQ.id] === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setChoiceAnswers({ ...choiceAnswers, [currentQ.id]: idx })
                  }
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    selected
                      ? 'border-[#5943A8] bg-[#F4F0FC] text-[#39286F] font-semibold'
                      : 'border-[#E5E0F3] bg-white text-slate-700 hover:border-[#5943A8]'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Interactive Mini Tile Builder if build_tiles */}
        {currentQ.type === 'build_tiles' && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { type: 'x2', sign: 1, label: '+x²' },
                  { type: 'x2', sign: -1, label: '−x²' },
                  { type: 'x', sign: 1, label: '+x' },
                  { type: 'x', sign: -1, label: '−x' },
                  { type: '1', sign: 1, label: '+1' },
                  { type: '1', sign: -1, label: '−1' },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => addMiniTile(currentQ.id, btn.type, btn.sign)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] px-3 py-2 font-math text-xs font-bold text-[#39286F] hover:border-[#5943A8]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {btn.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => removeLastMiniTile(currentQ.id)}
                disabled={currentTileList.length === 0}
                className="inline-flex items-center gap-1 rounded-xl border border-[#C94438]/30 bg-[#FFF2F0] px-3 py-2 text-xs font-semibold text-[#9B2F25] disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Terakhir
              </button>
            </div>

            <div className="min-h-[120px] rounded-2xl border-2 border-dashed border-[#D6CEF0] bg-[#FCFBFF] p-4">
              {currentTileList.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Klik tombol ubin di atas untuk menyusun jawabanmu.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {currentTileList.map((tile) => (
                    <TileVisual key={tile.id} type={tile.type} sign={tile.sign} />
                  ))}
                </div>
              )}
            </div>

            <p className="font-math text-sm font-bold text-[#39286F]">
              Ekspresi tersusun: {formatExpression(currentTileList, true)}
            </p>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-[#F0ECF9] pt-4">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(currentIdx - 1)}
            className="rounded-xl border border-[#E5E0F3] px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F7F5FC] disabled:opacity-40"
          >
            Sebelumnya
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIdx(currentIdx + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#5943A8] px-4 py-2 text-xs font-bold text-white hover:bg-[#39286F]"
            >
              Berikutnya
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitQuiz}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#27A89A] px-5 py-2 text-xs font-bold text-white hover:bg-[#1E8E82]"
            >
              <ClipboardCheck className="h-4 w-4" />
              Selesaikan & Lihat Hasil
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
