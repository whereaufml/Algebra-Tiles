import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Divide,
  Lightbulb,
  MessageSquareText,
  Redo2,
  RotateCcw,
  Sparkles,
  Undo2,
  Wand2,
} from 'lucide-react';
import {
  OperationExercise,
  OperationType,
  Progress,
  ReasoningEntry,
  TileSign,
  TileType,
} from '../types/algebra';
import { OPERATION_LAB_CONFIG } from '../data/curriculumConfig';
import {
  areSymbolicInputsEquivalent,
  buildDistributiveMultiplication,
  buildDivisionSteps,
} from '../engine/OperationEngine';
import { TileVisual } from './Tile';

interface OperationLabProps {
  progress: Progress;
  onCompleteExercise: (
    exerciseId: string,
    opTitle: string,
    problemLabel: string,
    reasonText?: string
  ) => void;
  onSaveReasoning: (
    source: ReasoningEntry['source'],
    id: string,
    title: string,
    reasonText: string
  ) => void;
}

const renderMiniTiles = (specs: Array<{ type: TileType; sign: TileSign; count: number }>) => {
  const nodes: React.ReactNode[] = [];
  specs.forEach((spec, idx) => {
    for (let i = 0; i < spec.count; i += 1) {
      nodes.push(
        <TileVisual
          key={`${idx}-${spec.type}-${spec.sign}-${i}`}
          type={spec.type}
          sign={spec.sign}
          compact
        />
      );
    }
  });
  return nodes;
};

export const OperationLab: React.FC<OperationLabProps> = ({
  progress,
  onCompleteExercise,
  onSaveReasoning,
}) => {
  const [selectedOp, setSelectedOp] = useState<OperationType>('addition');
  const [revealedStepsByEx, setRevealedStepsByEx] = useState<Record<string, number>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reasonInputs, setReasonInputs] = useState<Record<string, string>>({});
  const [shownHints, setShownHints] = useState<Record<string, boolean>>({});
  const [shownExplanations, setShownExplanations] = useState<Record<string, boolean>>({});
  const [exerciseFeedback, setExerciseFeedback] = useState<
    Record<string, { valid: boolean; text: string }>
  >({});

  // Interactive multiplication preset (including advanced negative multiplier challenge)
  const [mulPreset, setMulPreset] = useState<'2x3' | '3x2' | 'neg2x3'>('2x3');

  // Interactive non-zero divisor & symbolic fraction tester on Division tab
  const [divDividendKey, setDivDividendKey] = useState<'6x9' | '5x'>('6x9');
  const [testDivisor, setTestDivisor] = useState<number>(3);

  // Interactive Simulation 2 (Zero Subtraction: Direct Take-Away vs Adding Opposite Zero Pair)
  const [subZeroModel, setSubZeroModel] = useState<'direct' | 'opposite'>('opposite');
  const [subZeroStep, setSubZeroStep] = useState<number>(0);

  const subZeroMaxStep = subZeroModel === 'direct' ? 1 : 2;
  const clampedSubStep = Math.min(subZeroMaxStep, subZeroStep);

  const activeModule =
    OPERATION_LAB_CONFIG.find((op) => op.id === selectedOp) || OPERATION_LAB_CONFIG[0];

  const handleRevealNextStep = (exId: string, maxSteps: number) => {
    setRevealedStepsByEx((prev) => ({
      ...prev,
      [exId]: Math.min(maxSteps, (prev[exId] ?? 1) + 1),
    }));
  };

  const appendChip = (exerciseId: string, token: string) => {
    setAnswers((prev) => ({
      ...prev,
      [exerciseId]: `${prev[exerciseId] || ''}${token}`,
    }));
  };

  const handleCheckExercise = (ex: OperationExercise) => {
    const userRaw = answers[ex.id] || '';
    const check = areSymbolicInputsEquivalent(userRaw, ex.expectedTarget);
    setExerciseFeedback((prev) => ({
      ...prev,
      [ex.id]: { valid: check.valid, text: check.feedback },
    }));
    setShownExplanations((prev) => ({ ...prev, [ex.id]: true }));

    if (check.valid) {
      const reason = (reasonInputs[ex.id] || '').trim();
      if (reason) {
        onSaveReasoning('oplab', ex.id, `${activeModule.shortTitle}: ${ex.problemLabel}`, reason);
      }
      onCompleteExercise(ex.id, activeModule.shortTitle, ex.problemLabel, reason || undefined);
    }
  };

  const mulConfig =
    mulPreset === '2x3'
      ? { k: 2, xCoeff: 1, constant: 3 }
      : mulPreset === '3x2'
      ? { k: 3, xCoeff: 1, constant: 2 }
      : { k: -2, xCoeff: 1, constant: 3 };
  const mulPlan = buildDistributiveMultiplication(mulConfig.k, mulConfig.xCoeff, mulConfig.constant);

  const divDividend =
    divDividendKey === '6x9' ? { xCoeff: 6, constCoeff: 9 } : { xCoeff: 5, constCoeff: 0 };
  const divTestResult = buildDivisionSteps(divDividend.xCoeff, divDividend.constCoeff, testDivisor);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5E0F3] bg-white px-6 py-4">
        <div>
          <p className="text-xs font-semibold text-[#5943A8]">
            INTERACTIVE PRACTICE · OPERATION LAB
          </p>
          <h1 className="text-xl font-extrabold text-[#39286F]">
            Four Algebraic Operations Lab
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            Explore addition, subtraction, scalar-by-group multiplication, and division by a non-zero number with step-by-step tile models, hints, and worked solutions.
          </p>
        </div>

        <span className="rounded-xl bg-[#EFEAFD] px-3.5 py-1.5 font-math text-xs font-bold text-[#39286F] tabular-nums">
          {progress.completedOpLabIds.length} / 8 Exercises Completed
        </span>
      </section>

      {/* Operation Tabs */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {OPERATION_LAB_CONFIG.map((op) => {
          const active = op.id === activeModule.id;
          const opDoneCount = op.exercises.filter((ex) =>
            progress.completedOpLabIds.includes(ex.id)
          ).length;

          return (
            <button
              key={op.id}
              type="button"
              onClick={() => setSelectedOp(op.id)}
              className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition-colors ${
                active
                  ? 'border-[#5943A8] bg-[#5943A8] text-white'
                  : 'border-[#E5E0F3] bg-white text-[#39286F] hover:border-[#5943A8]'
              }`}
            >
              <span className="text-sm font-bold">{op.shortTitle}</span>
              <span
                className={`mt-0.5 text-[11px] ${
                  active ? 'text-white/85' : 'text-slate-500'
                }`}
              >
                {opDoneCount}/{op.exercises.length} completed
              </span>
            </button>
          );
        })}
      </div>

      {/* 1. Concept Guide Section */}
      <section className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#5943A8]">
              <BookOpen className="h-4 w-4" />
              <span>CONCEPT GUIDE</span>
            </div>
            <h2 className="mt-1 text-lg font-extrabold text-[#39286F]">
              {activeModule.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">{activeModule.subtitle}</p>
          </div>

          <div className="rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] px-4 py-2.5">
            <p className="text-[11px] font-bold text-[#5943A8]">KEY RULE</p>
            <p className="font-math text-sm font-bold text-[#39286F]">
              {activeModule.ruleSummary}
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-2 text-xs leading-relaxed text-slate-700">
          {activeModule.materiPoints.map((pt, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#27A89A]" />
              <span>{pt}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#3A86D8]/30 bg-[#EEF5FD] px-3.5 py-2.5 text-xs text-[#184376]">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#2B72C4]" />
          <span>
            <strong>Scope Note:</strong> {activeModule.scopeBoundaryNote}
          </span>
        </div>

        {/* Interactive Two-Model Zero Subtraction Simulator (Direct Take-Away vs Adding the Opposite) */}
        {activeModule.id === 'subtraction' && (
          <div
            data-testid="subtraction-zero-simulator"
            className="mt-4 rounded-2xl border border-[#E5E0F3] bg-[#F7F5FC] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[#39286F]">
                  Explore Two Models of Zero Subtraction: x − x = 0
                </p>
                <p className="text-[11px] text-slate-600">
                  Switch between labeled models to compare taking a tile away directly versus pairing with its opposite tile.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSubZeroModel('direct');
                    setSubZeroStep(0);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    subZeroModel === 'direct'
                      ? 'bg-[#5943A8] text-white'
                      : 'border border-[#D6CEF0] bg-white text-[#39286F]'
                  }`}
                >
                  Model 1: Direct Subtraction (Take Away)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubZeroModel('opposite');
                    setSubZeroStep(0);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    subZeroModel === 'opposite'
                      ? 'bg-[#5943A8] text-white'
                      : 'border border-[#D6CEF0] bg-white text-[#39286F]'
                  }`}
                >
                  Model 2: Subtracting by Adding Opposite (Zero Pair)
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-[#D6CEF0] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-lg bg-[#EFEAFD] px-2.5 py-1 font-math text-xs font-bold text-[#39286F]">
                  {subZeroModel === 'direct'
                    ? 'Direct Model: x − x = 0'
                    : 'Opposite-Addition Model: x + (−x) = 0'}
                </span>
                <span
                  data-testid="sub-zero-active-expr"
                  className="font-math text-sm font-bold text-[#1E8E82]"
                >
                  Active Expression:{' '}
                  {subZeroModel === 'direct'
                    ? clampedSubStep === 0
                      ? 'x'
                      : '0 (empty board)'
                    : clampedSubStep === 0
                    ? 'x'
                    : clampedSubStep === 1
                    ? 'x − x (net 0, 2 active tiles)'
                    : '0 (2 faded cancelled tiles)'}
                </span>
              </div>

              <div className="mt-3 flex min-h-[76px] flex-wrap items-center gap-3 rounded-xl border border-dashed border-[#D6CEF0] bg-[#FCFBFF] px-4 py-3">
                {subZeroModel === 'direct' ? (
                  clampedSubStep === 0 ? (
                    <TileVisual type="x" sign={1} status="active" />
                  ) : (
                    <span className="text-xs font-medium text-slate-500">
                      Board is empty (0) — the +x tile was taken away directly.
                    </span>
                  )
                ) : (
                  <>
                    <TileVisual
                      type="x"
                      sign={1}
                      status={clampedSubStep >= 2 ? 'cancelled' : 'active'}
                    />
                    {clampedSubStep >= 1 && (
                      <TileVisual
                        type="x"
                        sign={-1}
                        status={clampedSubStep >= 2 ? 'cancelled' : 'active'}
                      />
                    )}
                  </>
                )}
              </div>

              <p className="mt-2.5 text-xs text-slate-700">
                {subZeroModel === 'direct'
                  ? clampedSubStep === 0
                    ? 'Step 1: Start with 1 solid +x tile.'
                    : 'Step 2: Take away 1 +x tile to perform −x. Nothing remains on the board (x − x = 0).'
                  : clampedSubStep === 0
                  ? 'Step 1: Start with 1 solid +x tile.'
                  : clampedSubStep === 1
                  ? 'Step 2: Represent −x as its opposite −x tile placed side by side. Both tiles stay active and visible before cancellation.'
                  : 'Step 3: After Match Zero Pairs, both +x and −x remain visible in faded dashed form as visual proof of x + (−x) = 0.'}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {subZeroModel === 'direct' ? (
                  <button
                    type="button"
                    disabled={clampedSubStep >= 1}
                    onClick={() => setSubZeroStep(1)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#5943A8] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#39286F] disabled:opacity-45"
                  >
                    Take Away +x Tile (−x)
                  </button>
                ) : clampedSubStep === 0 ? (
                  <button
                    type="button"
                    onClick={() => setSubZeroStep(1)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#5943A8] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#39286F]"
                  >
                    Add Opposite Tile (−x)
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={clampedSubStep >= 2}
                    onClick={() => setSubZeroStep(2)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#EF8748] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#D96A27] disabled:opacity-45"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    Match Zero Pairs
                  </button>
                )}

                <button
                  type="button"
                  disabled={clampedSubStep === 0}
                  onClick={() => setSubZeroStep((s) => Math.max(0, s - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#E5E0F3] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Undo
                </button>

                <button
                  type="button"
                  disabled={clampedSubStep >= subZeroMaxStep}
                  onClick={() => setSubZeroStep((s) => Math.min(subZeroMaxStep, s + 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#E5E0F3] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                  Redo
                </button>

                <button
                  type="button"
                  onClick={() => setSubZeroStep(0)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#E5E0F3] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Distributive Multiplication & Negative Multiplier Challenge */}
        {activeModule.id === 'multiplication' && (
          <div className="mt-4 rounded-2xl border border-[#E5E0F3] bg-[#F7F5FC] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-[#39286F]">
                Explore Repeated Groups &amp; Intermediate Distributive Step
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: '2x3', label: '2(x + 3)' },
                    { id: '3x2', label: '3(x + 2)' },
                    { id: 'neg2x3', label: 'Challenge: −2(x + 3)' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMulPreset(opt.id)}
                    className={`rounded-lg px-3 py-1 font-math text-xs font-bold transition-colors ${
                      mulPreset === opt.id
                        ? opt.id === 'neg2x3'
                          ? 'bg-[#EF8748] text-white'
                          : 'bg-[#5943A8] text-white'
                        : 'border border-[#D6CEF0] bg-white text-[#39286F]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-[#D6CEF0] bg-white p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-math text-sm font-bold text-[#39286F]">
                  {mulPlan.originalNotation} ={' '}
                  <span className="text-[#5943A8]">{mulPlan.intermediateNotation}</span> ={' '}
                  <span data-testid="mul-sim-result" className="text-[#1E8E82]">
                    {mulPlan.finalExpression}
                  </span>
                </div>
                {mulPlan.isNegativeMultiplier && (
                  <span className="rounded-lg bg-[#FFF3EB] px-2.5 py-0.5 text-[11px] font-bold text-[#A84E17]">
                    Advanced Challenge · Negative Multiplier
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: Math.abs(mulConfig.k) }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#E5E0F3] bg-[#FCFBFF] p-2.5"
                  >
                    <p className="mb-1.5 text-[10px] font-bold text-[#5943A8]">
                      {mulPlan.isNegativeMultiplier
                        ? `Opposite Group ${idx + 1} (−x − 3)`
                        : `Group ${idx + 1} (x + ${mulConfig.constant})`}
                    </p>
                    <div className="flex flex-wrap items-center gap-1">
                      {renderMiniTiles([
                        {
                          type: 'x',
                          sign: mulPlan.isNegativeMultiplier ? -1 : 1,
                          count: mulConfig.xCoeff,
                        },
                        {
                          type: '1',
                          sign: mulPlan.isNegativeMultiplier ? -1 : 1,
                          count: mulConfig.constant,
                        },
                      ])}
                    </div>
                  </div>
                ))}
              </div>

              <ul className="mt-2.5 space-y-1 text-xs text-slate-700">
                {mulPlan.steps.map((s, idx) => (
                  <li key={idx}>• {s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Interactive Non-Zero Divisor & Symbolic Fraction Tester for Division */}
        {activeModule.id === 'division' && (
          <div className="mt-4 rounded-2xl border border-[#E5E0F3] bg-[#F7F5FC] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Divide className="h-4 w-4 text-[#5943A8]" />
                <p className="text-xs font-bold text-[#39286F]">
                  Non-Zero Divisor &amp; Tile Limit Tester:
                </p>
                <div className="inline-flex rounded-lg border border-[#D6CEF0] bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setDivDividendKey('6x9')}
                    className={`rounded-md px-2.5 py-1 font-math text-xs font-bold ${
                      divDividendKey === '6x9'
                        ? 'bg-[#5943A8] text-white'
                        : 'text-[#39286F]'
                    }`}
                  >
                    (6x + 9) ÷ k
                  </button>
                  <button
                    type="button"
                    onClick={() => setDivDividendKey('5x')}
                    className={`rounded-md px-2.5 py-1 font-math text-xs font-bold ${
                      divDividendKey === '5x'
                        ? 'bg-[#5943A8] text-white'
                        : 'text-[#39286F]'
                    }`}
                  >
                    5x ÷ k
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[0, 1, 2, 3].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTestDivisor(k)}
                    className={`rounded-lg px-3 py-1 font-math text-xs font-bold ${
                      testDivisor === k
                        ? k === 0
                          ? 'bg-[#C94438] text-white'
                          : 'bg-[#5943A8] text-white'
                        : 'border border-[#D6CEF0] bg-white text-[#39286F]'
                    }`}
                  >
                    k = {k}
                  </button>
                ))}
              </div>
            </div>

            <div
              data-testid="division-sim-result"
              className={`mt-3 flex flex-col gap-2.5 rounded-xl border px-3.5 py-3 text-xs ${
                testDivisor === 0
                  ? 'border-[#C94438] bg-[#FFF2F0] text-[#8F241B]'
                  : divTestResult.canUseTiles
                  ? 'border-[#27A89A] bg-[#EAF7F5] text-[#14554E]'
                  : 'border-[#3A86D8] bg-[#EEF5FD] text-[#184376]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {testDivisor === 0 && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                  <div>
                    <p className="font-bold">
                      {divDividendKey === '6x9' ? '(6x + 9)' : '5x'} ÷ {testDivisor}:{' '}
                      {divTestResult.valid
                        ? divTestResult.symbolicResult
                        : 'Undefined'}
                    </p>
                    <p className="mt-0.5">{divTestResult.reason}</p>
                  </div>
                </div>
                {divTestResult.valid && (
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      divTestResult.canUseTiles
                        ? 'bg-[#27A89A] text-white'
                        : 'bg-[#2B72C4] text-white'
                    }`}
                  >
                    {divTestResult.canUseTiles
                      ? 'Whole-Tile Equal Groups Mode'
                      : 'Symbolic Fraction Mode (No Partial Tiles)'}
                  </span>
                )}
              </div>

              {divTestResult.valid && divTestResult.stepNotation && (
                <p className="rounded-lg bg-white/80 px-3 py-1.5 font-math font-bold text-[#39286F]">
                  {divTestResult.stepNotation}
                </p>
              )}

              {divTestResult.valid && divTestResult.canUseTiles && divTestResult.quotient && (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: testDivisor }).map((_, gIdx) => (
                    <div
                      key={gIdx}
                      className="rounded-xl border border-[#D6CEF0] bg-white p-2"
                    >
                      <p className="mb-1 text-[10px] font-bold text-[#5943A8]">
                        Group {gIdx + 1} ({divTestResult.symbolicResult})
                      </p>
                      <div className="flex flex-wrap items-center gap-1">
                        {renderMiniTiles([
                          ...(divTestResult.quotient!.x > 0
                            ? [{ type: 'x' as const, sign: 1 as const, count: divTestResult.quotient!.x }]
                            : []),
                          ...(divTestResult.quotient!.constant > 0
                            ? [{ type: '1' as const, sign: 1 as const, count: divTestResult.quotient!.constant }]
                            : []),
                        ])}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 2. Worked Examples Section */}
      <section className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
        <h2 className="text-base font-extrabold text-[#39286F]">
          Worked Examples ({activeModule.shortTitle})
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {activeModule.workedExamples.map((ex) => {
            const visibleSteps = revealedStepsByEx[ex.id] ?? ex.steps.length;
            return (
              <div
                key={ex.id}
                className="flex flex-col justify-between rounded-2xl border border-[#E5E0F3] bg-[#FCFBFF] p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#39286F]">{ex.title}</h3>
                    <span className="rounded-lg bg-[#EFEAFD] px-2.5 py-1 font-math text-xs font-bold text-[#39286F]">
                      {ex.problem}
                    </span>
                  </div>

                  {ex.visualGroups && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ex.visualGroups.map((vg, gIdx) => (
                        <div
                          key={gIdx}
                          className="rounded-xl border border-[#D6CEF0] bg-white p-2.5"
                        >
                          <p className="mb-1.5 text-[10px] font-bold text-[#5943A8]">
                            {vg.groupLabel}
                          </p>
                          <div className="flex flex-wrap items-center gap-1">
                            {renderMiniTiles(vg.tiles)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <ol className="mt-3 space-y-1.5 text-xs text-slate-700">
                    {ex.steps.slice(0, visibleSteps).map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#5943A8] text-[10px] font-bold text-white">
                          {sIdx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#F0ECF9] pt-3">
                  <span className="font-math text-xs font-bold text-[#1E8E82]">
                    Result: {ex.finalExpression}
                  </span>
                  {visibleSteps < ex.steps.length ? (
                    <button
                      type="button"
                      onClick={() => handleRevealNextStep(ex.id, ex.steps.length)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#5943A8]"
                    >
                      Next Step <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedStepsByEx((prev) => ({ ...prev, [ex.id]: 1 }))
                      }
                      className="text-[11px] font-semibold text-slate-500 hover:text-[#39286F]"
                    >
                      Step Through Again
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Interactive Practice Section */}
      <section className="rounded-2xl border border-[#E5E0F3] bg-white p-6">
        <h2 className="text-base font-extrabold text-[#39286F]">
          Interactive Practice, Hints &amp; Explanations
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {activeModule.exercises.map((ex, idx) => {
            const done = progress.completedOpLabIds.includes(ex.id);
            const fb = exerciseFeedback[ex.id];
            const showHint = Boolean(shownHints[ex.id]);
            const showExp = Boolean(shownExplanations[ex.id]);

            return (
              <div
                key={ex.id}
                className="flex flex-col gap-3 rounded-2xl border border-[#E5E0F3] bg-[#FCFBFF] p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-[#5943A8]">
                      PRACTICE {idx + 1} · {ex.problemLabel}
                    </span>
                    <p className="mt-0.5 text-sm font-bold text-[#39286F]">{ex.prompt}</p>
                  </div>
                  {done && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#EAF7F5] px-2.5 py-1 text-[11px] font-bold text-[#14554E]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </span>
                  )}
                </div>

                {/* Visual Model for Exercise */}
                {ex.visualPresetTiles && (
                  <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-white p-3">
                    {renderMiniTiles(ex.visualPresetTiles)}
                  </div>
                )}

                {ex.groupVisualConfig && (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: ex.groupVisualConfig.groupsCount }).map((_, gIdx) => (
                      <div
                        key={gIdx}
                        className="rounded-xl border border-[#D6CEF0] bg-white p-2.5"
                      >
                        <p className="mb-1 text-[10px] font-bold text-[#5943A8]">
                          Group {gIdx + 1}
                        </p>
                        <div className="flex flex-wrap items-center gap-1">
                          {renderMiniTiles(ex.groupVisualConfig!.perGroup)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick symbol chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {['x', ' + ', ' − ', '2', '3', '5', '8'].map((tok) => (
                    <button
                      key={tok}
                      type="button"
                      onClick={() => appendChip(ex.id, tok)}
                      className="rounded-lg border border-[#E5E0F3] bg-white px-2.5 py-1 font-math text-xs font-bold text-[#39286F] hover:border-[#5943A8]"
                    >
                      {tok.trim()}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={answers[ex.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [ex.id]: e.target.value })}
                  placeholder={ex.placeholder}
                  aria-label={`Answer for ${ex.problemLabel}`}
                  className="rounded-xl border border-[#D6CEF0] bg-white px-3.5 py-2 font-math text-sm font-bold text-[#39286F] focus:border-[#5943A8] focus:outline-none"
                />

                <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1">
                    <MessageSquareText className="h-3.5 w-3.5 text-[#5943A8]" />
                    Short explanation (optional, saved to your learning notes)
                  </span>
                  <input
                    type="text"
                    value={reasonInputs[ex.id] || ''}
                    onChange={(e) =>
                      setReasonInputs({ ...reasonInputs, [ex.id]: e.target.value })
                    }
                    placeholder="Why does this simplify to that result?"
                    className="rounded-xl border border-[#E5E0F3] bg-white px-3 py-1.5 text-xs font-normal text-[#1E163B]"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCheckExercise(ex)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#27A89A] px-4 py-2 text-xs font-bold text-white hover:bg-[#1E8E82]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Check Answer
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShownHints((prev) => ({ ...prev, [ex.id]: !prev[ex.id] }))
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#F4C95D]/30 px-3 py-2 text-xs font-semibold text-[#6F4E07] hover:bg-[#F4C95D]/50"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    {showHint ? 'Hide Hint' : 'Hint'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShownExplanations((prev) => ({ ...prev, [ex.id]: !prev[ex.id] }))
                    }
                    className="rounded-xl border border-[#E5E0F3] bg-white px-3 py-2 text-xs font-semibold text-[#39286F] hover:bg-[#F7F5FC]"
                  >
                    {showExp ? 'Hide Explanation' : 'Explanation'}
                  </button>
                </div>

                {showHint && (
                  <p className="rounded-xl border border-[#F4C95D] bg-[#FFFBEB] px-3 py-2 text-xs text-[#78530A]">
                    <strong>Hint:</strong> {ex.hint}
                  </p>
                )}

                {fb && (
                  <p
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                      fb.valid
                        ? 'border-[#27A89A] bg-[#EAF7F5] text-[#14554E]'
                        : 'border-[#EF8748] bg-[#FFF5EE] text-[#8F3E10]'
                    }`}
                  >
                    {fb.text}
                  </p>
                )}

                {showExp && (
                  <p className="rounded-xl border border-[#3A86D8]/30 bg-[#EEF5FD] px-3 py-2 text-xs text-[#184376]">
                    <strong>Explanation:</strong> {ex.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
