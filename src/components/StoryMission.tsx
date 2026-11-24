import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Lightbulb,
  MessageSquareText,
  Shapes,
  Sparkles,
} from 'lucide-react';
import {
  CtlActivityConfig,
  Progress,
  ReasoningEntry,
  TileSign,
  TileType,
} from '../types/algebra';
import {
  CTL_ACTIVITIES_CONFIG,
  CTL_CHALLENGE_OPTIONS,
} from '../data/curriculumConfig';
import {
  areSymbolicInputsEquivalent,
  evaluateSubstitution,
} from '../engine/OperationEngine';
import { TileVisual } from './Tile';

interface StoryMissionProps {
  progress: Progress;
  onCompleteActivity: (activity: CtlActivityConfig, reasonText: string) => void;
  onSaveReasoning: (
    source: ReasoningEntry['source'],
    id: string,
    title: string,
    reasonText: string
  ) => void;
  onGoToWorkshop: () => void;
  onGoToExitTicket: () => void;
}

const renderTileSet = (
  specs: Array<{ type: TileType; sign: TileSign; count: number }>,
  compact = false
) => {
  const nodes: React.ReactNode[] = [];
  specs.forEach((spec, specIdx) => {
    for (let i = 0; i < spec.count; i += 1) {
      nodes.push(
        <TileVisual
          key={`${specIdx}-${spec.type}-${spec.sign}-${i}`}
          type={spec.type}
          sign={spec.sign}
          compact={compact}
        />
      );
    }
  });
  return nodes;
};

export const StoryMission: React.FC<StoryMissionProps> = ({
  progress,
  onCompleteActivity,
  onSaveReasoning,
  onGoToWorkshop,
  onGoToExitTicket,
}) => {
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    CTL_ACTIVITIES_CONFIG[0].id
  );

  // Activity 1 interactive states (Toko Alat Tulis)
  const [act1Stage, setAct1Stage] = useState<1 | 2 | 3>(1);
  const [act1Inputs, setAct1Inputs] = useState<Record<number, string>>({
    1: '',
    2: '',
    3: '',
  });
  const [act1StageFeedback, setAct1StageFeedback] = useState<
    Record<number, { valid: boolean; text: string }>
  >({});

  // Activity 2 interactive states (Komutatif & Asosiatif)
  const [commSwapped, setCommSwapped] = useState(false);
  const [assocRegrouped, setAssocRegrouped] = useState(false);
  const [act2ChangedChoice, setAct2ChangedChoice] = useState<string>('');
  const [act2FixedChoice, setAct2FixedChoice] = useState<string>('');
  const [act2Feedback, setAct2Feedback] = useState<string | null>(null);

  // Activity 3 interactive states (2(x+3) = 2x+6 & x = 4)
  const [act3Combined, setAct3Combined] = useState(false);
  const [subXValue, setSubXValue] = useState(4);
  const [act3ExpandInput, setAct3ExpandInput] = useState('');
  const [act3ExpandFeedback, setAct3ExpandFeedback] = useState<{
    valid: boolean;
    text: string;
  } | null>(null);

  // Activity 4 interactive states (Challenge A, B, or C)
  const [selectedChallengeId, setSelectedChallengeId] = useState<'A' | 'B' | 'C'>('A');
  const [act4Checked, setAct4Checked] = useState(false);

  // Reasoning drafts per activity
  const [reasoningDrafts, setReasoningDrafts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    progress.reasoningNotes.forEach((note) => {
      if (note.source === 'ctl') {
        initial[note.id] = note.reasonText;
      }
    });
    return initial;
  });
  const [completionNotice, setCompletionNotice] = useState<string | null>(null);

  const activeActivity =
    CTL_ACTIVITIES_CONFIG.find((a) => a.id === selectedActivityId) ||
    CTL_ACTIVITIES_CONFIG[0];

  const isCompleted = progress.completedCtlActivities.includes(activeActivity.id);
  const currentReason = reasoningDrafts[activeActivity.id] || '';

  const act1Targets = useMemo(
    () => ({
      1: {
        label: '1 notebook (x) + 1 pencil (2)',
        target: { x2: 0, x: 1, constant: 2 },
        sample: 'x + 2',
      },
      2: {
        label: 'Add 1 eraser (1) → x + 2 + 1',
        target: { x2: 0, x: 1, constant: 3 },
        sample: 'x + 3',
      },
      3: {
        label: 'Buy 2 identical bundles → 2(x + 3)',
        target: { x2: 0, x: 2, constant: 6 },
        sample: '2(x + 3) or 2x + 6',
      },
    }),
    []
  );

  const handleCheckAct1Stage = (stage: 1 | 2 | 3) => {
    const spec = act1Targets[stage];
    const res = areSymbolicInputsEquivalent(act1Inputs[stage] || '', spec.target);
    setAct1StageFeedback((prev) => ({
      ...prev,
      [stage]: {
        valid: res.valid,
        text: res.valid
          ? `Great! Step ${stage} simplifies to ${res.targetExpr}.`
          : `${res.feedback} (Hint: try ${spec.sample})`,
      },
    }));
    if (res.valid && stage < 3) {
      setAct1Stage((stage + 1) as 1 | 2 | 3);
    }
  };

  const handleCheckAct2Observation = () => {
    if (act2ChangedChoice === 'urutan_kurung' && act2FixedChoice === 'jumlah_nilai') {
      setAct2Feedback(
        'Correct! In the commutative and associative properties, the tile order or grouping parentheses change, while the count of each tile type and total value stay the same.'
      );
    } else {
      setAct2Feedback(
        'Check again: do the counts of +x and +1 tiles change when you reorder or regroup them? Only the order or parentheses change—the tile counts and value remain equal!'
      );
    }
  };

  const handleCheckAct3Expansion = () => {
    const res = areSymbolicInputsEquivalent(act3ExpandInput, {
      x2: 0,
      x: 2,
      constant: 6,
    });
    setAct3ExpandFeedback({
      valid: res.valid,
      text: res.valid
        ? 'Correct! 2 bundles of (x + 3) contain 2 +x tiles and 6 +1 tiles, so 2(x + 3) = 2x + 6.'
        : `${res.feedback} Remember there are 2 bundles, each with 1 +x tile and 3 +1 tiles.`,
    });
  };

  const handleSubmitActivityCompletion = () => {
    const trimmed = currentReason.trim();
    if (trimmed.length < 8) {
      setCompletionNotice(
        'Write a brief explanation first (at least 8 characters) to record your reasoning.'
      );
      return;
    }

    onSaveReasoning('ctl', activeActivity.id, activeActivity.title, trimmed);
    onCompleteActivity(activeActivity, trimmed);
    setCompletionNotice(
      isCompleted
        ? `Updated notes for ${activeActivity.title}.`
        : `${activeActivity.title} completed! (+${activeActivity.rewardXp} XP earned)`
    );
  };

  const activeChallenge =
    CTL_CHALLENGE_OPTIONS.find((c) => c.id === selectedChallengeId) ||
    CTL_CHALLENGE_OPTIONS[0];

  const leftValAct3 = 2 * (subXValue + 3);
  const rightValAct3 = evaluateSubstitution({ x2: 0, x: 2, constant: 6 }, subXValue);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5E0F3] bg-white px-6 py-4">
        <div>
          <p className="text-xs font-semibold text-[#5943A8]">
            STORY MISSIONS · CONTEXTUAL ALGEBRA
          </p>
          <h1 className="text-xl font-extrabold text-[#39286F]">
            Interactive Exploration: From the Stationery Shop to Equivalent Expressions
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            Complete Missions 1–4 step by step. Observe each tile model, test properties, and explain why expressions stay equivalent.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl bg-[#EAF7F5] px-3 py-1.5 font-math text-xs font-bold text-[#14554E] tabular-nums">
            {progress.completedCtlActivities.length} / {CTL_ACTIVITIES_CONFIG.length} Missions Completed
          </span>
          <button
            type="button"
            onClick={onGoToWorkshop}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#39286F] hover:bg-[#F7F5FC]"
          >
            <Shapes className="h-3.5 w-3.5 text-[#27A89A]" />
            Open Tile Workshop
          </button>
        </div>
      </section>

      {/* Activity Switcher Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CTL_ACTIVITIES_CONFIG.map((act) => {
          const active = act.id === activeActivity.id;
          const done = progress.completedCtlActivities.includes(act.id);
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => {
                setSelectedActivityId(act.id);
                setCompletionNotice(null);
              }}
              className={`flex flex-col items-start justify-between rounded-2xl border p-4 text-left transition-colors ${
                active
                  ? 'border-[#5943A8] bg-[#EFEAFD]/60'
                  : 'border-[#E5E0F3] bg-white hover:border-[#5943A8]'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#5943A8]">
                  MISSION {act.order}
                </span>
                {done && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E8E82]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Done
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm font-bold text-[#39286F] leading-snug">
                {act.title.replace(/^(?:Activity|Mission) \d+ — /, '')}
              </p>
              <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                {act.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Active Story Mission Stage */}
      <div className="flex flex-col gap-5 rounded-2xl border border-[#E5E0F3] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F0ECF9] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#5943A8]">
                {activeActivity.title}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-medium text-slate-500">
                Skills: {activeActivity.ctlPillars.join(', ')}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {activeActivity.contextStory}
            </p>
          </div>
          <span className="rounded-xl bg-[#F7F5FC] px-3 py-1.5 font-math text-xs font-bold text-[#5943A8]">
            +{activeActivity.rewardXp} XP
          </span>
        </div>

        {/* MISSION 1: STATIONERY SHOP */}
        {activeActivity.id === 'ctl-activity-1' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Step 1 */}
              <div
                className={`rounded-2xl border p-4 ${
                  act1Stage === 1
                    ? 'border-[#5943A8] bg-[#FCFBFF]'
                    : 'border-[#E5E0F3] bg-white'
                }`}
              >
                <p className="text-xs font-bold text-[#5943A8]">Step 1 · Notebook + Pencil</p>
                <p className="mt-1 text-xs text-slate-600">
                  1 notebook costs <strong className="font-math">x</strong> and 1 pencil costs <strong className="font-math">2</strong>.
                </p>
                <div className="my-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] p-2.5">
                  {renderTileSet(
                    [
                      { type: 'x', sign: 1, count: 1 },
                      { type: '1', sign: 1, count: 2 },
                    ],
                    true
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={act1Inputs[1] || ''}
                    onChange={(e) =>
                      setAct1Inputs({ ...act1Inputs, 1: e.target.value })
                    }
                    placeholder="e.g. x + 2"
                    aria-label="Step 1 expression"
                    className="min-w-0 flex-1 rounded-xl border border-[#D6CEF0] px-3 py-1.5 font-math text-xs font-bold text-[#39286F]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckAct1Stage(1)}
                    className="rounded-xl bg-[#5943A8] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#39286F]"
                  >
                    Check
                  </button>
                </div>
                {act1StageFeedback[1] && (
                  <p
                    className={`mt-2 text-xs font-medium ${
                      act1StageFeedback[1].valid ? 'text-[#1E8E82]' : 'text-[#9F3A0D]'
                    }`}
                  >
                    {act1StageFeedback[1].text}
                  </p>
                )}
              </div>

              {/* Step 2 */}
              <div
                className={`rounded-2xl border p-4 ${
                  act1Stage === 2
                    ? 'border-[#5943A8] bg-[#FCFBFF]'
                    : 'border-[#E5E0F3] bg-white'
                }`}
              >
                <p className="text-xs font-bold text-[#5943A8]">Step 2 · Add an Eraser</p>
                <p className="mt-1 text-xs text-slate-600">
                  Add 1 eraser costing <strong className="font-math">1</strong>, giving <strong className="font-math">x + 2 + 1</strong>.
                </p>
                <div className="my-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] p-2.5">
                  {renderTileSet(
                    [
                      { type: 'x', sign: 1, count: 1 },
                      { type: '1', sign: 1, count: 3 },
                    ],
                    true
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={act1Inputs[2] || ''}
                    onChange={(e) =>
                      setAct1Inputs({ ...act1Inputs, 2: e.target.value })
                    }
                    placeholder="e.g. x + 3"
                    aria-label="Step 2 expression"
                    className="min-w-0 flex-1 rounded-xl border border-[#D6CEF0] px-3 py-1.5 font-math text-xs font-bold text-[#39286F]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckAct1Stage(2)}
                    className="rounded-xl bg-[#5943A8] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#39286F]"
                  >
                    Check
                  </button>
                </div>
                {act1StageFeedback[2] && (
                  <p
                    className={`mt-2 text-xs font-medium ${
                      act1StageFeedback[2].valid ? 'text-[#1E8E82]' : 'text-[#9F3A0D]'
                    }`}
                  >
                    {act1StageFeedback[2].text}
                  </p>
                )}
              </div>

              {/* Step 3 */}
              <div
                className={`rounded-2xl border p-4 ${
                  act1Stage === 3
                    ? 'border-[#5943A8] bg-[#FCFBFF]'
                    : 'border-[#E5E0F3] bg-white'
                }`}
              >
                <p className="text-xs font-bold text-[#5943A8]">Step 3 · Two Identical Bundles</p>
                <p className="mt-1 text-xs text-slate-600">
                  Buying 2 bundles, each containing <strong className="font-math">(x + 3)</strong>.
                </p>
                <div className="my-3 flex flex-col gap-1.5 rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] p-2.5">
                  <div className="flex flex-wrap items-center gap-1">
                    {renderTileSet(
                      [
                        { type: 'x', sign: 1, count: 1 },
                        { type: '1', sign: 1, count: 3 },
                      ],
                      true
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {renderTileSet(
                      [
                        { type: 'x', sign: 1, count: 1 },
                        { type: '1', sign: 1, count: 3 },
                      ],
                      true
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={act1Inputs[3] || ''}
                    onChange={(e) =>
                      setAct1Inputs({ ...act1Inputs, 3: e.target.value })
                    }
                    placeholder="e.g. 2(x + 3)"
                    aria-label="Step 3 expression"
                    className="min-w-0 flex-1 rounded-xl border border-[#D6CEF0] px-3 py-1.5 font-math text-xs font-bold text-[#39286F]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckAct1Stage(3)}
                    className="rounded-xl bg-[#5943A8] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#39286F]"
                  >
                    Check
                  </button>
                </div>
                {act1StageFeedback[3] && (
                  <p
                    className={`mt-2 text-xs font-medium ${
                      act1StageFeedback[3].valid ? 'text-[#1E8E82]' : 'text-[#9F3A0D]'
                    }`}
                  >
                    {act1StageFeedback[3].text}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MISSION 2: COMMUTATIVE & ASSOCIATIVE PROPERTIES */}
        {activeActivity.id === 'ctl-activity-2' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Commutative Comparison */}
              <div className="rounded-2xl border border-[#E5E0F3] bg-[#FCFBFF] p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#39286F]">
                    1. Commutative Property: <span className="font-math">x + 3</span> vs{' '}
                    <span className="font-math">3 + x</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCommSwapped((v) => !v)}
                    className="rounded-xl bg-[#5943A8] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#39286F]"
                  >
                    {commSwapped ? 'Reset to x + 3' : 'Swap Order → 3 + x'}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#D6CEF0] bg-white p-3.5">
                  {commSwapped ? (
                    <>
                      {renderTileSet([{ type: '1', sign: 1, count: 3 }])}
                      <span className="px-1 font-math text-base font-bold text-slate-400">+</span>
                      {renderTileSet([{ type: 'x', sign: 1, count: 1 }])}
                    </>
                  ) : (
                    <>
                      {renderTileSet([{ type: 'x', sign: 1, count: 1 }])}
                      <span className="px-1 font-math text-base font-bold text-slate-400">+</span>
                      {renderTileSet([{ type: '1', sign: 1, count: 3 }])}
                    </>
                  )}
                </div>
                <p className="mt-2 font-math text-xs font-bold text-[#39286F]">
                  Active layout: {commSwapped ? '3 + x' : 'x + 3'} (Still contains 1 +x tile and 3 +1 tiles)
                </p>
              </div>

              {/* Associative Comparison */}
              <div className="rounded-2xl border border-[#E5E0F3] bg-[#FCFBFF] p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#39286F]">
                    2. Associative Property: <span className="font-math">(x + 2) + 1</span> vs{' '}
                    <span className="font-math">x + (2 + 1)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setAssocRegrouped((v) => !v)}
                    className="rounded-xl bg-[#27A89A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1E8E82]"
                  >
                    {assocRegrouped ? 'Group as (x + 2) + 1' : 'Regroup → x + (2 + 1)'}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#D6CEF0] bg-white p-3.5">
                  {!assocRegrouped ? (
                    <>
                      <div className="flex items-center gap-1.5 rounded-xl border-2 border-[#5943A8] bg-[#F7F5FC] p-2">
                        {renderTileSet([
                          { type: 'x', sign: 1, count: 1 },
                          { type: '1', sign: 1, count: 2 },
                        ])}
                      </div>
                      <span className="font-math text-base font-bold text-slate-400">+</span>
                      <div className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 p-2">
                        {renderTileSet([{ type: '1', sign: 1, count: 1 }])}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 p-2">
                        {renderTileSet([{ type: 'x', sign: 1, count: 1 }])}
                      </div>
                      <span className="font-math text-base font-bold text-slate-400">+</span>
                      <div className="flex items-center gap-1.5 rounded-xl border-2 border-[#27A89A] bg-[#EAF7F5] p-2">
                        {renderTileSet([{ type: '1', sign: 1, count: 3 }])}
                      </div>
                    </>
                  )}
                </div>
                <p className="mt-2 font-math text-xs font-bold text-[#39286F]">
                  Active grouping: {assocRegrouped ? 'x + (2 + 1)' : '(x + 2) + 1'} (Total stays x + 3)
                </p>
              </div>
            </div>

            {/* Observation Question */}
            <div className="rounded-2xl border border-[#E5E0F3] bg-[#F7F5FC] p-4">
              <p className="text-xs font-bold text-[#39286F]">
                Observation Check: Identify what changes and what stays the same
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                  <span>What CHANGES is...</span>
                  <select
                    value={act2ChangedChoice}
                    onChange={(e) => setAct2ChangedChoice(e.target.value)}
                    className="rounded-xl border border-[#D6CEF0] bg-white px-3 py-2 text-xs text-[#39286F]"
                  >
                    <option value="">-- Choose observation --</option>
                    <option value="urutan_kurung">The order of tiles or grouping parentheses</option>
                    <option value="jenis_ubin">The x tile changes into an x² tile</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                  <span>What STAYS THE SAME is...</span>
                  <select
                    value={act2FixedChoice}
                    onChange={(e) => setAct2FixedChoice(e.target.value)}
                    className="rounded-xl border border-[#D6CEF0] bg-white px-3 py-2 text-xs text-[#39286F]"
                  >
                    <option value="">-- Choose observation --</option>
                    <option value="jumlah_nilai">The number of each tile type and the total value stay equal</option>
                    <option value="hilang_konstanta">Constant tiles disappear when swapped</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                onClick={handleCheckAct2Observation}
                className="mt-3 rounded-xl bg-[#5943A8] px-4 py-2 text-xs font-bold text-white hover:bg-[#39286F]"
              >
                Check Observation
              </button>
              {act2Feedback && (
                <p className="mt-2 text-xs font-medium text-[#39286F]">{act2Feedback}</p>
              )}
            </div>
          </div>
        )}

        {/* MISSION 3: TWO EQUAL GROUPS (DISTRIBUTIVE & SUBSTITUTION x = 4) */}
        {activeActivity.id === 'ctl-activity-3' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#E5E0F3] bg-[#FCFBFF] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#39286F]">
                    Two-Bundle Model: <span className="font-math">2(x + 3)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setAct3Combined((v) => !v)}
                    className="rounded-xl bg-[#5943A8] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#39286F]"
                  >
                    {act3Combined ? 'Show Separate Bundles' : 'Group Like Terms'}
                  </button>
                </div>

                {!act3Combined ? (
                  <div className="mt-3 space-y-2">
                    {[1, 2].map((pkg) => (
                      <div
                        key={pkg}
                        className="rounded-xl border border-[#D6CEF0] bg-white p-3"
                      >
                        <p className="mb-2 text-[11px] font-bold text-[#5943A8]">
                          Bundle {pkg}: (x + 3)
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {renderTileSet([
                            { type: 'x', sign: 1, count: 1 },
                            { type: '1', sign: 1, count: 3 },
                          ])}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-[#27A89A] bg-[#EAF7F5] p-3">
                    <p className="mb-2 text-[11px] font-bold text-[#14554E]">
                      Combined Like Terms: 2x + 6
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {renderTileSet([
                        { type: 'x', sign: 1, count: 2 },
                        { type: '1', sign: 1, count: 6 },
                      ])}
                    </div>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={act3ExpandInput}
                    onChange={(e) => setAct3ExpandInput(e.target.value)}
                    placeholder="Write expanded form of 2(x + 3)"
                    aria-label="Expansion of 2(x + 3)"
                    className="min-w-[190px] flex-1 rounded-xl border border-[#D6CEF0] bg-white px-3 py-1.5 font-math text-xs font-bold text-[#39286F]"
                  />
                  <button
                    type="button"
                    onClick={handleCheckAct3Expansion}
                    className="rounded-xl bg-[#27A89A] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#1E8E82]"
                  >
                    Check Expansion
                  </button>
                </div>
                {act3ExpandFeedback && (
                  <p
                    className={`mt-2 text-xs font-medium ${
                      act3ExpandFeedback.valid ? 'text-[#1E8E82]' : 'text-[#9F3A0D]'
                    }`}
                  >
                    {act3ExpandFeedback.text}
                  </p>
                )}
              </div>

              {/* Substitution Test x = 4 */}
              <div className="rounded-2xl border border-[#E5E0F3] bg-[#F7F5FC] p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#39286F]">
                    Substitution Check: <span className="font-math">x = {subXValue}</span>
                  </h3>
                  <div className="flex items-center gap-1">
                    {[2, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSubXValue(val)}
                        className={`rounded-lg px-2.5 py-1 font-math text-xs font-bold ${
                          subXValue === val
                            ? 'bg-[#5943A8] text-white'
                            : 'bg-white text-[#39286F] border border-[#E5E0F3]'
                        }`}
                      >
                        x = {val}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  <span>Adjust value of x (benchmark test: x = 4)</span>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={subXValue}
                    onChange={(e) => setSubXValue(Number(e.target.value))}
                    className="accent-[#5943A8]"
                  />
                </label>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#E5E0F3] bg-white p-3">
                    <p className="text-[11px] font-bold text-[#5943A8]">Factored Form: 2(x + 3)</p>
                    <p className="mt-1 font-math text-sm font-bold text-[#39286F]">
                      2({subXValue} + 3) = 2 × {subXValue + 3} = {leftValAct3}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E5E0F3] bg-white p-3">
                    <p className="text-[11px] font-bold text-[#27A89A]">Expanded Form: 2x + 6</p>
                    <p className="mt-1 font-math text-sm font-bold text-[#39286F]">
                      2({subXValue}) + 6 = {2 * subXValue} + 6 = {rightValAct3}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#EAF7F5] px-3.5 py-2 text-xs font-semibold text-[#14554E]">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>
                    Confirmed equivalent at x = {subXValue}: both expressions evaluate to {leftValAct3}!
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MISSION 4: EQUIVALENT EXPRESSIONS CHALLENGE A, B, C */}
        {activeActivity.id === 'ctl-activity-4' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {CTL_CHALLENGE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedChallengeId(opt.id);
                    setAct4Checked(false);
                  }}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                    selectedChallengeId === opt.id
                      ? 'bg-[#5943A8] text-white'
                      : 'border border-[#E5E0F3] bg-[#F7F5FC] text-[#39286F] hover:bg-[#EAE3F9]'
                  }`}
                >
                  {opt.title}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#E5E0F3] bg-[#FCFBFF] p-4">
                <p className="text-xs font-bold text-[#5943A8]">Left Model</p>
                <p className="mt-0.5 font-math text-lg font-extrabold text-[#39286F]">
                  {activeChallenge.leftExpression}
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {activeChallenge.leftGroups && activeChallenge.leftGroups > 1 ? (
                    Array.from({ length: activeChallenge.leftGroups }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#D6CEF0] bg-white p-2.5"
                      >
                        {renderTileSet(
                          [
                            { type: 'x', sign: 1, count: 1 },
                            {
                              type: '1',
                              sign: 1,
                              count: Math.round(
                                activeChallenge.leftTarget.constant / activeChallenge.leftGroups!
                              ),
                            },
                          ],
                          true
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#D6CEF0] bg-white p-3">
                      {renderTileSet(
                        [
                          { type: 'x', sign: 1, count: activeChallenge.leftTarget.x },
                          { type: '1', sign: 1, count: activeChallenge.leftTarget.constant },
                        ],
                        true
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E0F3] bg-[#FCFBFF] p-4">
                <p className="text-xs font-bold text-[#27A89A]">Right Model (Equivalent)</p>
                <p className="mt-0.5 font-math text-lg font-extrabold text-[#39286F]">
                  {activeChallenge.rightExpression}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-[#D6CEF0] bg-white p-3">
                  {activeChallenge.id === 'A'
                    ? renderTileSet(
                        [
                          { type: '1', sign: 1, count: activeChallenge.rightTarget.constant },
                          { type: 'x', sign: 1, count: activeChallenge.rightTarget.x },
                        ],
                        true
                      )
                    : renderTileSet(
                        [
                          { type: 'x', sign: 1, count: activeChallenge.rightTarget.x },
                          { type: '1', sign: 1, count: activeChallenge.rightTarget.constant },
                        ],
                        true
                      )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] p-4 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" />
                <span>{activeChallenge.observationPrompt}</span>
              </div>
              <button
                type="button"
                onClick={() => setAct4Checked((v) => !v)}
                className="rounded-xl border border-[#5943A8]/30 bg-white px-3 py-1.5 font-semibold text-[#39286F] hover:bg-[#EFEAFD]"
              >
                {act4Checked ? 'Hide Sample Explanation' : 'View Sample Explanation'}
              </button>
            </div>

            {act4Checked && (
              <p className="rounded-xl bg-[#EAF7F5] px-4 py-2.5 text-xs text-[#14554E]">
                <strong>Sample Reasoning for Challenge {activeChallenge.id}:</strong>{' '}
                {activeChallenge.sampleReasoning}
              </p>
            )}
          </div>
        )}

        {/* Activity Guide & Student Reasoning Section */}
        <div className="rounded-2xl border border-[#E5E0F3] bg-[#F7F5FC] p-5">
          <div className="flex items-start gap-2.5 text-xs text-[#39286F]">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#5943A8]" />
            <div>
              <p className="font-bold">Activity Guide &amp; Study Notes</p>
              <p className="mt-0.5 text-slate-700">{activeActivity.lkpdInstruction}</p>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="ctl-reasoning-input"
              className="flex items-center gap-1.5 text-xs font-bold text-[#39286F]"
            >
              <MessageSquareText className="h-4 w-4 text-[#5943A8]" />
              <span>{activeActivity.reasoningPrompt}</span>
            </label>
            <textarea
              id="ctl-reasoning-input"
              rows={3}
              value={currentReason}
              onChange={(e) =>
                setReasoningDrafts({
                  ...reasoningDrafts,
                  [activeActivity.id]: e.target.value,
                })
              }
              placeholder="Write your explanation or conclusion in your own words..."
              className="mt-2 w-full rounded-xl border border-[#D6CEF0] bg-white px-3.5 py-2.5 text-xs leading-relaxed text-[#1E163B] focus:border-[#5943A8] focus:outline-none"
            />
          </div>

          {completionNotice && (
            <p className="mt-2 text-xs font-semibold text-[#5943A8]">{completionNotice}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSubmitActivityCompletion}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#27A89A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1E8E82]"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isCompleted
                ? 'Update Notes & Completed Status'
                : 'Save Notes & Complete Mission'}
            </button>

            <button
              type="button"
              onClick={onGoToExitTicket}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#5943A8]/30 bg-white px-4 py-2 text-xs font-semibold text-[#39286F] hover:bg-[#EFEAFD]"
            >
              <Compass className="h-3.5 w-3.5" />
              Proceed to Core Concept Check
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
