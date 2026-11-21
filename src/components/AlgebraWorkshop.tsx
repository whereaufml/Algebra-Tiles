import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { EquationState, Mission, Tile, TileSign, TileType, WorkspaceMode } from '../types/algebra';
import {
  areExpressionsEquivalent,
  createTile,
  createTilesFromSpec,
  explainWorkspace,
  formatExpression,
  getTermLabel,
} from '../engine/MathEngine';
import {
  detectDropTarget,
  snapTilesIntoGroup,
  stackZeroPair,
} from '../engine/SnapStackEngine';
import { createInitialEquationState } from '../engine/EquationSolver';
import { ActivePaletteDrag, TilePalette } from './TilePalette';
import { Workspace } from './Workspace';
import { TileVisual, getTileDimensions, getTileLabel } from './Tile';
import { EquationBalanceBoard, PRESET_EQUATIONS } from './EquationBalanceBoard';
import { AreaModelPreview } from './AreaModelPreview';

interface AlgebraWorkshopProps {
  activeMission?: Mission | null;
  onExitMission?: () => void;
  onMissionSuccess?: (mission: Mission, attempts: number, hintsUsed: number) => void;
  onZeroPairsCleared?: (count: number) => void;
  onLikeTermsCombined?: () => void;
  onEquationSolved?: () => void;
  onMisconceptionGuided?: () => void;
}

export const AlgebraWorkshop: React.FC<AlgebraWorkshopProps> = ({
  activeMission = null,
  onExitMission,
  onMissionSuccess,
  onZeroPairsCleared,
  onLikeTermsCombined,
  onEquationSolved,
  onMisconceptionGuided,
}) => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<WorkspaceMode>(
    activeMission?.mode === 'equation' ? 'equation' : 'explore'
  );
  const [history, setHistory] = useState<Tile[][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [selectedPaletteTile, setSelectedPaletteTile] = useState<{
    type: TileType;
    sign: TileSign;
  } | null>(null);
  const [activePaletteDrag, setActivePaletteDrag] = useState<ActivePaletteDrag | null>(null);
  const [instructionCollapsed, setInstructionCollapsed] = useState(false);

  const [attempts, setAttempts] = useState(0);
  const [revealedHints, setRevealedHints] = useState(0);
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'info' | 'warning';
    text: string;
  } | null>(null);
  const [explanationText, setExplanationText] = useState<string | null>(null);

  const [presetIdx, setPresetIdx] = useState(0);
  const [equationState, setEquationState] = useState<EquationState>(() =>
    createInitialEquationState(PRESET_EQUATIONS[0].left, PRESET_EQUATIONS[0].right)
  );

  // Sync whenever activeMission changes
  useEffect(() => {
    setFeedback(null);
    setExplanationText(null);
    setAttempts(0);
    setRevealedHints(0);

    if (activeMission) {
      if (activeMission.mode === 'equation' && activeMission.initialEquation) {
        setMode('equation');
        setEquationState(
          createInitialEquationState(
            activeMission.initialEquation.left,
            activeMission.initialEquation.right
          )
        );
      } else {
        setMode('explore');
        const cols = typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5;
        const initial = activeMission.initialTiles
          ? createTilesFromSpec(activeMission.initialTiles, 20, 24, cols)
          : [];
        setHistory([initial]);
        setHistoryIdx(0);
      }
    } else {
      setHistory([[]]);
      setHistoryIdx(0);
    }
  }, [activeMission]);

  const currentTiles = history[historyIdx] || [];

  const updateTiles = (nextTiles: Tile[], recordHistory = true) => {
    if (!recordHistory) {
      setHistory((prev) => {
        const copy = [...prev];
        copy[historyIdx] = nextTiles;
        return copy;
      });
      return;
    }
    const sliced = history.slice(0, historyIdx + 1);
    setHistory([...sliced, nextTiles]);
    setHistoryIdx(sliced.length);
  };

  const commitPreDragState = (preDragTiles: Tile[], finalTiles: Tile[]) => {
    const sliced = history.slice(0, historyIdx + 1);
    sliced[sliced.length - 1] = preDragTiles;
    setHistory([...sliced, finalTiles]);
    setHistoryIdx(sliced.length);
  };

  const handlePaletteDragEnd = (drag: ActivePaletteDrag | null) => {
    setActivePaletteDrag(null);
    if (!drag || !boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const liftY = drag.isTouch ? 28 : 0;
    const pointerX = drag.clientX;
    const pointerY = drag.clientY - liftY;

    const insideBoard =
      pointerX >= rect.left &&
      pointerX <= rect.right &&
      pointerY >= rect.top &&
      pointerY <= rect.bottom;

    if (!insideBoard) return;

    const { width, height } = getTileDimensions(drag.type);
    let x = pointerX - rect.left - width / 2;
    let y = pointerY - rect.top - height / 2;
    x = Math.max(8, Math.min(Math.max(8, rect.width - width - 8), x));
    y = Math.max(30, Math.min(Math.max(30, rect.height - height - 8), y));
    x = Math.round(x / 12) * 12;
    y = Math.round(y / 12) * 12;

    const newTile = createTile(drag.type, drag.sign, { x, y });
    const hit = detectDropTarget(
      currentTiles,
      [],
      drag.type,
      drag.sign,
      { x, y, width, height },
      true
    );

    if (hit) {
      if (hit.kind === 'zeropair') {
        const withNew = [...currentTiles, newTile];
        const stacked = stackZeroPair(withNew, newTile.id, hit.targetTile.id, rect.width, rect.height);
        if (stacked.valid) {
          updateTiles(stacked.tiles, true);
          setFeedback({ tone: 'info', text: stacked.explanation });
          return;
        }
      }

      if (hit.kind === 'group') {
        const withNew = [...currentTiles, newTile];
        const snapped = snapTilesIntoGroup(
          withNew,
          [newTile.id],
          hit.targetTile.id,
          rect.width,
          rect.height
        );
        if (snapped.count > 0) {
          updateTiles(snapped.tiles, true);
          onLikeTermsCombined?.();
          setFeedback({
            tone: 'success',
            text: `${snapped.count} ubin sejenis menempel membentuk kelompok ${snapped.label}.`,
          });
          return;
        }
      }

      if (hit.kind === 'mismatch') {
        const targetW = getTileDimensions(hit.targetTile.type).width;
        const safeX =
          hit.targetTile.position.x + targetW + 18 + width < rect.width
            ? hit.targetTile.position.x + targetW + 18
            : Math.max(8, hit.targetTile.position.x - width - 18);
        const placedTile: Tile = { ...newTile, position: { x: safeX, y } };
        updateTiles([...currentTiles, placedTile], true);
        onMisconceptionGuided?.();
        setFeedback({
          tone: 'warning',
          text: `Suku berbeda tidak dapat dikelompokkan! ${getTermLabel(drag.type)} dan ${getTermLabel(
            hit.targetTile.type
          )} diletakkan terpisah.`,
        });
        return;
      }
    }

    updateTiles([...currentTiles, newTile], true);
    setFeedback({
      tone: 'info',
      text: `Ubin ${getTileLabel(drag.type, drag.sign)} ditempatkan ke workspace.`,
    });
  };

  const handleQuickAdd = (type: TileType, sign: TileSign) => {
    const idx = currentTiles.length;
    const boardW = boardRef.current?.clientWidth || 540;
    const cols = Math.max(3, Math.floor((boardW - 32) / 86));
    const x = 20 + (idx % cols) * 84;
    const y = 24 + Math.floor(idx / cols) * 90;
    const next = createTile(type, sign, { x, y });
    updateTiles([...currentTiles, next], true);
    setFeedback({
      tone: 'info',
      text: `Ubin ${getTileLabel(type, sign)} ditambahkan.`,
    });
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setFeedback({ tone: 'info', text: 'Langkah sebelumnya dipulihkan (Undo).' });
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setFeedback({ tone: 'info', text: 'Langkah diulang kembali (Redo).' });
    }
  };

  const handleCheckMission = () => {
    if (!activeMission) {
      const summaryText = explainWorkspace(currentTiles);
      setExplanationText(summaryText);
      setFeedback({
        tone: 'success',
        text: `Mode Eksplorasi Bebas: susunan ubinmu membentuk ${formatExpression(
          currentTiles,
          true
        )}.`,
      });
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    const check = areExpressionsEquivalent(
      currentTiles,
      activeMission.validationRule.target,
      activeMission.validationRule.requireNoZeroPairs
    );

    if (check.valid) {
      setFeedback({
        tone: 'success',
        text: `${check.reason} (+${activeMission.rewardXp} XP)`,
      });
      onMissionSuccess?.(activeMission, nextAttempts, revealedHints);
    } else {
      setFeedback({
        tone: 'warning',
        text: `${check.reason} Jangan khawatir—kamu dapat mencoba lagi atau gunakan petunjuk tanpa kehilangan progres.`,
      });
    }
  };

  const handleShowHint = () => {
    if (!activeMission) {
      setFeedback({
        tone: 'info',
        text: 'Petunjuk Eksplorasi: Geser ubin +x dan −x saling menumpuk untuk membentuk Zero Pair, atau geser 2 ubin +x berdekatan untuk mengelompokkannya.',
      });
      return;
    }
    const nextHint = Math.min(activeMission.hints.length, revealedHints + 1);
    setRevealedHints(nextHint);
  };

  const handleExplain = () => {
    if (mode === 'equation') {
      setExplanationText(equationState.lastActionNote);
    } else {
      setExplanationText(explainWorkspace(currentTiles));
    }
  };

  const dragGhostSize = activePaletteDrag ? getTileDimensions(activePaletteDrag.type) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Floating Drag Ghost for Palette -> Workspace Pointer Drag */}
      {activePaletteDrag && dragGhostSize && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: `${activePaletteDrag.clientX - dragGhostSize.width / 2}px`,
            top: `${
              activePaletteDrag.clientY -
              dragGhostSize.height / 2 -
              (activePaletteDrag.isTouch ? 28 : 0)
            }px`,
            zIndex: 60,
            pointerEvents: 'none',
          }}
          className="scale-110 drop-shadow-xl opacity-95"
        >
          <TileVisual type={activePaletteDrag.type} sign={activePaletteDrag.sign} />
        </div>
      )}

      {/* Top Mode & Mission Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E0F3] bg-white px-5 py-3.5">
        <div>
          <p className="text-xs font-semibold text-[#5943A8]">
            {activeMission
              ? `MISI ${activeMission.order} · ${activeMission.topic}`
              : 'ALGEBRA WORKSHOP · EKSPLORASI BEBAS'}
          </p>
          <h2 className="text-lg font-bold text-[#39286F]">
            {activeMission ? activeMission.title : 'Papan Manipulasi Algebra Tiles'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!activeMission && (
            <div className="inline-flex rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] p-1">
              {(
                [
                  { id: 'explore', label: 'Ekspresi' },
                  { id: 'equation', label: 'Papan Persamaan' },
                  { id: 'area', label: 'Model Luas' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMode(tab.id);
                    setFeedback(null);
                    setExplanationText(null);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    mode === tab.id
                      ? 'bg-[#5943A8] text-white'
                      : 'text-slate-700 hover:text-[#39286F]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {activeMission && onExitMission && (
            <button
              type="button"
              onClick={onExitMission}
              className="rounded-xl border border-[#E5E0F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#39286F] hover:bg-[#F7F5FC] whitespace-nowrap"
            >
              Kembali ke Daftar Misi
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Instruction & Action Bar */}
      <div className="rounded-2xl border border-[#E5E0F3] bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#5943A8]" />
            <span className="text-sm font-bold text-[#39286F]">
              {activeMission ? 'Instruksi Misi' : 'Panduan Eksplorasi Bebas (Tanpa Penalti)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setInstructionCollapsed((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-[#F7F5FC]"
          >
            {instructionCollapsed ? (
              <>
                Tampilkan <ChevronDown className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Minimalkan <ChevronUp className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

        {!instructionCollapsed && (
          <div className="mt-2.5 space-y-3">
            <p className="text-sm leading-relaxed text-slate-700">
              {activeMission
                ? activeMission.instructions
                : 'Susun dan geser ubin secara bebas tanpa penalti. Geser ubin sejenis saling berdekatan untuk mengelompokkan, atau tumpuk ubin berlawanan tanda untuk membentuk Zero Pair.'}
            </p>

            {activeMission?.lkpdPrompt && (
              <p className="rounded-xl bg-[#F7F5FC] px-3.5 py-2 text-xs text-[#39286F]">
                <strong>Catatan LKPD:</strong> {activeMission.lkpdPrompt}
              </p>
            )}

            {revealedHints > 0 && activeMission && (
              <div className="space-y-1.5 rounded-xl border border-[#F4C95D] bg-[#FFFBEB] p-3 text-xs text-[#78530A]">
                {activeMission.hints.slice(0, revealedHints).map((hint, idx) => (
                  <p key={idx}>
                    <strong>Petunjuk {idx + 1}:</strong> {hint}
                  </p>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {mode === 'explore' && (
                <button
                  type="button"
                  onClick={handleCheckMission}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#27A89A] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1E8E82] whitespace-nowrap"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {activeMission ? 'Periksa Jawaban' : 'Periksa Ekspresi'}
                </button>
              )}

              <button
                type="button"
                onClick={handleShowHint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F4C95D]/30 px-3.5 py-2 text-xs font-semibold text-[#6F4E07] hover:bg-[#F4C95D]/50 whitespace-nowrap"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Petunjuk
              </button>

              <button
                type="button"
                onClick={handleExplain}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#39286F] hover:bg-[#F7F5FC] whitespace-nowrap"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Jelaskan Hasil
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm ${
            feedback.tone === 'success'
              ? 'border-[#27A89A] bg-[#EAF7F5] text-[#14554E]'
              : feedback.tone === 'warning'
              ? 'border-[#EF8748] bg-[#FFF5EE] text-[#8F3E10]'
              : 'border-[#5943A8]/30 bg-[#F4F0FC] text-[#39286F]'
          }`}
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {explanationText && (
        <div className="rounded-2xl border border-[#3A86D8]/35 bg-[#EEF5FD] px-4 py-3 text-xs leading-relaxed text-[#184376]">
          <strong>Penjelasan Matematis:</strong> {explanationText}
        </div>
      )}

      {/* Mode Content */}
      {mode === 'explore' && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[240px_1fr]">
          <TilePalette
            selectedSpec={selectedPaletteTile}
            onSelectSpec={setSelectedPaletteTile}
            onQuickAdd={handleQuickAdd}
            onPaletteDragStart={setActivePaletteDrag}
            onPaletteDragMove={setActivePaletteDrag}
            onPaletteDragEnd={handlePaletteDragEnd}
          />
          <Workspace
            tiles={currentTiles}
            boardRef={boardRef}
            activePaletteDrag={activePaletteDrag}
            onChangeTiles={updateTiles}
            onCommitPreDragState={commitPreDragState}
            selectedPaletteTile={selectedPaletteTile}
            canUndo={historyIdx > 0}
            canRedo={historyIdx < history.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onZeroPairsCleared={onZeroPairsCleared}
            onLikeTermsCombined={onLikeTermsCombined}
            onMisconceptionGuided={onMisconceptionGuided}
            onFeedback={setFeedback}
          />
        </div>
      )}

      {mode === 'equation' && (
        <div className="flex flex-col gap-3">
          {!activeMission && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E5E0F3] bg-white px-4 py-3">
              <span className="text-xs font-semibold text-slate-600">
                Pilih contoh persamaan:
              </span>
              {PRESET_EQUATIONS.map((preset, idx) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setPresetIdx(idx);
                    setEquationState(createInitialEquationState(preset.left, preset.right));
                  }}
                  className={`rounded-lg px-3 py-1.5 font-math text-xs font-bold transition-colors ${
                    presetIdx === idx
                      ? 'bg-[#5943A8] text-white'
                      : 'bg-[#F7F5FC] text-[#39286F] hover:bg-[#EAE3F9]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          <EquationBalanceBoard
            equationState={equationState}
            onChangeEquation={setEquationState}
            onResetEquation={() => {
              if (activeMission?.initialEquation) {
                setEquationState(
                  createInitialEquationState(
                    activeMission.initialEquation.left,
                    activeMission.initialEquation.right
                  )
                );
              } else {
                const preset = PRESET_EQUATIONS[presetIdx];
                setEquationState(createInitialEquationState(preset.left, preset.right));
              }
            }}
            expectedSolution={
              activeMission?.validationRule.targetVariableValue ??
              PRESET_EQUATIONS[presetIdx].solution
            }
            onZeroPairsCleared={onZeroPairsCleared}
            onSolved={() => {
              onEquationSolved?.();
              if (activeMission) {
                const nextAttempts = attempts + 1;
                setAttempts(nextAttempts);
                onMissionSuccess?.(activeMission, nextAttempts, revealedHints);
              }
            }}
          />
        </div>
      )}

      {mode === 'area' && <AreaModelPreview />}
    </div>
  );
};
