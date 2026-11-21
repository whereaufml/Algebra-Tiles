import React, { useState } from 'react';
import {
  ArrowRight,
  BookMarked,
  CheckCircle2,
  FastForward,
  RotateCcw,
} from 'lucide-react';
import { GLOSSARY_ITEMS, TOPICS_CONFIG } from '../data/curriculumConfig';
import { createTilesFromSpec } from '../engine/MathEngine';
import { TileVisual } from './Tile';
import { MiniTileDemo } from './MiniTileDemo';

interface LearningAcademyProps {
  completedLessonIds: string[];
  initialTopicId?: string | null;
  onCompleteLesson: (lessonId: string, lessonTitle: string, topicTitle: string) => void;
  onGoToWorkshop: () => void;
}

export const LearningAcademy: React.FC<LearningAcademyProps> = ({
  completedLessonIds,
  initialTopicId,
  onCompleteLesson,
  onGoToWorkshop,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    initialTopicId || TOPICS_CONFIG[0].id
  );
  const [lessonIndex, setLessonIndex] = useState(0);
  const [showGlossary, setShowGlossary] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submittedCheck, setSubmittedCheck] = useState(false);

  const activeTopic =
    TOPICS_CONFIG.find((t) => t.id === selectedTopicId) || TOPICS_CONFIG[0];
  const activeLesson = activeTopic.lessons[lessonIndex] || activeTopic.lessons[0];
  const isLessonDone = completedLessonIds.includes(activeLesson.id);

  const demoLeftTiles = createTilesFromSpec(activeLesson.visualDemo.tiles);
  const demoRightTiles = activeLesson.visualDemo.rightTiles
    ? createTilesFromSpec(activeLesson.visualDemo.rightTiles)
    : [];

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    setLessonIndex(0);
    setSelectedOption(null);
    setSubmittedCheck(false);
    setShowGlossary(false);
  };

  const handleNextLessonOrSkip = () => {
    setSelectedOption(null);
    setSubmittedCheck(false);
    if (lessonIndex < activeTopic.lessons.length - 1) {
      setLessonIndex(lessonIndex + 1);
    } else {
      const currentTopicIdx = TOPICS_CONFIG.findIndex((t) => t.id === activeTopic.id);
      const nextTopic = TOPICS_CONFIG[(currentTopicIdx + 1) % TOPICS_CONFIG.length];
      setSelectedTopicId(nextTopic.id);
      setLessonIndex(0);
    }
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setSubmittedCheck(true);
    if (selectedOption === activeLesson.checkQuestion.correctIndex) {
      onCompleteLesson(activeLesson.id, activeLesson.title, activeTopic.title);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E0F3] bg-white px-6 py-4">
        <div>
          <p className="text-xs font-semibold text-[#5943A8]">LEARNING ACADEMY</p>
          <h1 className="text-xl font-extrabold text-[#39286F]">
            Belajar Konsep Aljabar Secara Visual
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGlossary((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              showGlossary
                ? 'border-[#5943A8] bg-[#5943A8] text-white'
                : 'border-[#E5E0F3] bg-white text-[#39286F] hover:bg-[#F7F5FC]'
            }`}
          >
            <BookMarked className="h-4 w-4" />
            Glosarium Aljabar
          </button>
          <button
            type="button"
            onClick={onGoToWorkshop}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#27A89A] px-4 py-2 text-xs font-bold text-white hover:bg-[#1E8E82] whitespace-nowrap"
          >
            Coba di Workshop
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showGlossary ? (
        <section className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#39286F]">Glosarium Istilah Aljabar</h2>
              <p className="text-xs text-slate-600">
                Referensi singkat istilah penting selama menggunakan Algebra Tiles.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGlossary(false)}
              className="rounded-xl border border-[#E5E0F3] px-3 py-1.5 text-xs font-semibold text-[#39286F] hover:bg-[#F7F5FC]"
            >
              Tutup Glosarium
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {GLOSSARY_ITEMS.map((item) => (
              <div
                key={item.term}
                className="rounded-xl border border-[#E5E0F3] bg-[#FCFBFF] p-4"
              >
                <h3 className="text-sm font-bold text-[#39286F]">{item.term}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">
                  {item.definition}
                </p>
                <p className="mt-2 font-math text-xs font-medium text-[#5943A8]">
                  Contoh: {item.example}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
          {/* Topic Sidebar */}
          <aside className="flex flex-col gap-2 rounded-2xl border border-[#E5E0F3] bg-white p-4">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-[#5943A8]">
              Daftar Topik
            </h2>
            {TOPICS_CONFIG.map((topic) => {
              const active = topic.id === activeTopic.id;
              const allDone = topic.lessons.every((l) =>
                completedLessonIds.includes(l.id)
              );
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleSelectTopic(topic.id)}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? 'border-[#5943A8] bg-[#F7F5FC]'
                      : 'border-[#E5E0F3] bg-white hover:bg-[#FCFBFF]'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#39286F]">
                      {topic.title}
                    </span>
                    {allDone && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#27A89A]" />
                    )}
                  </div>
                  <span className="mt-1 text-[11px] text-slate-500">
                    {topic.lessons.length} submateri · ~{topic.estimatedMinutes} menit
                  </span>
                </button>
              );
            })}
          </aside>

          {/* Main Lesson Card */}
          <article className="flex flex-col gap-5 rounded-2xl border border-[#E5E0F3] bg-white p-6">
            {/* Sublesson Stepper */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0ECF9] pb-3">
              <div className="flex items-center gap-2">
                {activeTopic.lessons.map((l, idx) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setLessonIndex(idx);
                      setSelectedOption(null);
                      setSubmittedCheck(false);
                    }}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                      idx === lessonIndex
                        ? 'bg-[#5943A8] text-white'
                        : 'bg-[#F7F5FC] text-[#39286F] hover:bg-[#EAE3F9]'
                    }`}
                  >
                    Bagian {idx + 1}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {isLessonDone && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E8E82]">
                    <CheckCircle2 className="h-4 w-4" />
                    Sudah Dipahami
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleNextLessonOrSkip}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5E0F3] px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-[#F7F5FC]"
                >
                  <FastForward className="h-3.5 w-3.5" />
                  Lewati / Lanjut
                </button>
              </div>
            </div>

            {/* Objective & Explanation */}
            <div>
              <p className="text-xs font-semibold text-[#27A89A]">
                Tujuan: {activeLesson.objective}
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-[#39286F]">
                {activeLesson.title}
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-700">
                {activeLesson.explanation}
              </p>
            </div>

            {/* Interactive Mini Demo / Equation Preview */}
            {demoRightTiles.length === 0 ? (
              <MiniTileDemo
                initialTiles={activeLesson.visualDemo.tiles}
                allowNegative={activeTopic.id !== 'topic-dasar' || lessonIndex > 0}
                caption={activeLesson.visualDemo.caption}
                highlightNote={activeLesson.visualDemo.highlightNote}
                onTryInWorkshop={onGoToWorkshop}
              />
            ) : (
              <div className="rounded-2xl border border-[#E5E0F3] bg-[#F7F5FC] p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#39286F]">
                    {activeLesson.visualDemo.caption}
                  </span>
                  <span className="font-math text-sm font-bold text-[#5943A8]">
                    {activeLesson.visualDemo.symbolicResult}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 border border-[#E5E0F3]">
                  <div className="flex flex-wrap items-center gap-2">
                    {demoLeftTiles.map((tile) => (
                      <TileVisual key={tile.id} type={tile.type} sign={tile.sign} />
                    ))}
                  </div>
                  <span className="font-math text-xl font-bold text-[#39286F] px-2">
                    =
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {demoRightTiles.map((tile) => (
                      <TileVisual key={tile.id} type={tile.type} sign={tile.sign} />
                    ))}
                  </div>
                </div>

                {activeLesson.visualDemo.highlightNote && (
                  <p className="mt-2.5 text-xs text-slate-600">
                    {activeLesson.visualDemo.highlightNote}
                  </p>
                )}

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={onGoToWorkshop}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#27A89A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1E8E82]"
                  >
                    Coba di Algebra Workshop
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="rounded-xl bg-[#EAF7F5] px-4 py-3 text-xs font-medium text-[#14554E]">
              <strong>Rangkuman:</strong> {activeLesson.summary}
            </div>

            {/* Quick Check Understanding */}
            <div className="rounded-2xl border border-[#E5E0F3] bg-[#FCFBFF] p-5">
              <h3 className="text-sm font-bold text-[#39286F]">
                Cek Pemahaman Singkat
              </h3>
              <p className="mt-1.5 text-sm text-slate-800">
                {activeLesson.checkQuestion.prompt}
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {activeLesson.checkQuestion.options.map((opt, idx) => {
                  const isChosen = selectedOption === idx;
                  const isCorrect = idx === activeLesson.checkQuestion.correctIndex;
                  let borderCls = 'border-[#E5E0F3] bg-white text-slate-700 hover:border-[#5943A8]';
                  if (submittedCheck) {
                    if (isCorrect) {
                      borderCls = 'border-[#27A89A] bg-[#EAF7F5] text-[#14554E] font-semibold';
                    } else if (isChosen) {
                      borderCls = 'border-[#C94438] bg-[#FFF2F0] text-[#8F241B]';
                    }
                  } else if (isChosen) {
                    borderCls = 'border-[#5943A8] bg-[#F4F0FC] text-[#39286F] font-semibold';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedOption(idx);
                        setSubmittedCheck(false);
                      }}
                      className={`rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors ${borderCls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={selectedOption === null}
                  onClick={handleCheckAnswer}
                  className="rounded-xl bg-[#5943A8] px-4 py-2 text-xs font-bold text-white hover:bg-[#39286F] disabled:opacity-45"
                >
                  Periksa Jawaban
                </button>
                {submittedCheck && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOption(null);
                      setSubmittedCheck(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#E5E0F3] bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Ulangi Pertanyaan
                  </button>
                )}
              </div>

              {submittedCheck && (
                <div
                  role="status"
                  className={`mt-3 rounded-xl px-3.5 py-2.5 text-xs ${
                    selectedOption === activeLesson.checkQuestion.correctIndex
                      ? 'bg-[#EAF7F5] text-[#14554E]'
                      : 'bg-[#FFF5EE] text-[#8F3E10]'
                  }`}
                >
                  {selectedOption === activeLesson.checkQuestion.correctIndex
                    ? 'Tepat sekali! (+30 XP) '
                    : 'Belum tepat, mari lihat penjelasannya: '}
                  {activeLesson.checkQuestion.explanation}
                </div>
              )}
            </div>
          </article>
        </div>
      )}
    </div>
  );
};
