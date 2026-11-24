import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  FilePlus2,
  HelpCircle,
  Layers,
  Lightbulb,
  Maximize2,
  Minimize2,
  MoreVertical,
  Redo2,
  Sparkles,
  Trash2,
  Undo2,
  Unlink,
  X,
} from 'lucide-react';
import { EquationState, Mission, Tile, TileSign, TileType, WorkspaceMode } from '../types/algebra';
import {
  areExpressionsEquivalent,
  countTileStatuses,
  createTile,
  createTilesFromSpec,
  explainWorkspace,
  findNextAvailableTilePosition,
  findZeroPairs,
  formatExpression,
  formatRawExpression,
  getTermLabel,
  isTileActive,
} from '../engine/MathEngine';
import {
  computeTileGroups,
  detectDropTarget,
  snapTilesIntoGroup,
  stackZeroPair,
  ungroupTiles,
} from '../engine/SnapStackEngine';
import { createInitialEquationState } from '../engine/EquationSolver';
import {
  MAX_WORKSPACE_HISTORY_STEPS,
  PersistedWorkspaceSession,
  computeWorkspaceHasRecoverableWork,
  pushBoundedHistory,
} from '../storage/WorkspaceStorage';
import { ActivePaletteDrag, TilePalette } from './TilePalette';
import { Workspace } from './Workspace';
import { TileVisual, getTileDimensions, getTileLabel } from './Tile';
import { EquationBalanceBoard, PRESET_EQUATIONS } from './EquationBalanceBoard';
import { AreaModelPreview } from './AreaModelPreview';

export type WorkspaceSessionDraft = Omit<
  PersistedWorkspaceSession,
  'version' | 'savedAt' | 'symbolicExpression' | 'equationExpression'
>;

interface AlgebraWorkshopProps {
  activeMission?: Mission | null;
  savedReason?: string;
  initialWorkspaceSession?: PersistedWorkspaceSession | null;
  workspaceResetVersion?: number;
  workspaceStorageStatus?: {
    ok: boolean;
    savedAt: string;
    corruptedWarning?: string | null;
  };
  onWorkspaceSessionChange?: (draft: WorkspaceSessionDraft) => void;
  onStartNewWorkspace?: () => void;
  onExitMission?: () => void;
  onBackToApp?: () => void;
  onMissionSuccess?: (mission: Mission, attempts: number, hintsUsed: number) => void;
  onSaveReasoning?: (mission: Mission, reasonText: string) => void;
  onZeroPairsCleared?: (count: number) => void;
  onLikeTermsCombined?: () => void;
  onEquationSolved?: () => void;
  onMisconceptionGuided?: () => void;
}

const TILE_RATIO_META: Record<TileType, { family: string; ratio: string }> = {
  x2: { family: 'X Family', ratio: '5 × 5 square (x²)' },
  x: { family: 'X Family', ratio: '5 × 2 bar (x)' },
  '1': { family: 'X Family', ratio: '2 × 2 unit (1)' },
  y: { family: 'Y Family', ratio: '7 × 2 bar (y)' },
  xy: { family: 'Y Family', ratio: '5 × 7 rectangle (xy)' },
  y2: { family: 'Y Family', ratio: '7 × 7 square (y²)' },
};

export const AlgebraWorkshop: React.FC<AlgebraWorkshopProps> = ({
  activeMission = null,
  savedReason = '',
  initialWorkspaceSession = null,
  workspaceResetVersion = 0,
  workspaceStorageStatus,
  onWorkspaceSessionChange,
  onStartNewWorkspace,
  onExitMission,
  onBackToApp,
  onMissionSuccess,
  onSaveReasoning: _onSaveReasoning,
  onZeroPairsCleared,
  onLikeTermsCombined,
  onEquationSolved,
  onMisconceptionGuided,
}) => {
  const labRootRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const canRestoreOnMount = Boolean(
    initialWorkspaceSession &&
      (initialWorkspaceSession.activeMissionId ?? null) === (activeMission?.id ?? null)
  );
  const restoredWithWork = Boolean(
    canRestoreOnMount &&
      initialWorkspaceSession &&
      computeWorkspaceHasRecoverableWork(initialWorkspaceSession)
  );

  const getInitialExploreTiles = (mission: Mission | null): Tile[] => {
    if (!mission || mission.mode === 'equation' || !mission.initialTiles) return [];
    const cols = typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5;
    return createTilesFromSpec(mission.initialTiles, 20, 24, cols);
  };

  const getInitialEqState = (mission: Mission | null, presetIndex = 0): EquationState => {
    if (mission?.mode === 'equation' && mission.initialEquation) {
      return createInitialEquationState(
        mission.initialEquation.left,
        mission.initialEquation.right
      );
    }
    const preset = PRESET_EQUATIONS[presetIndex] || PRESET_EQUATIONS[0];
    return createInitialEquationState(preset.left, preset.right);
  };

  const [mode, setMode] = useState<WorkspaceMode>(() => {
    if (canRestoreOnMount && initialWorkspaceSession) {
      return initialWorkspaceSession.mode;
    }
    return activeMission?.mode === 'equation' ? 'equation' : 'explore';
  });
  const [history, setHistory] = useState<Tile[][]>(() => {
    if (canRestoreOnMount && initialWorkspaceSession) {
      return initialWorkspaceSession.exploreHistory;
    }
    return [getInitialExploreTiles(activeMission)];
  });
  const [historyIdx, setHistoryIdx] = useState<number>(() => {
    if (canRestoreOnMount && initialWorkspaceSession) {
      return initialWorkspaceSession.exploreHistoryIdx;
    }
    return 0;
  });

  const [selectedPaletteTile, setSelectedPaletteTile] = useState<{
    type: TileType;
    sign: TileSign;
  } | null>(null);
  const [activePaletteDrag, setActivePaletteDrag] = useState<ActivePaletteDrag | null>(null);

  // Lab layout UI state
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(Boolean(activeMission));
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Canvas view & selection state shared with Right Inspector
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const [attempts, setAttempts] = useState(0);
  const [revealedHints, setRevealedHints] = useState(0);
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'info' | 'warning';
    text: string;
  } | null>(() =>
    restoredWithWork
      ? {
          tone: 'info',
          text: 'Last work restored from local storage. Your tile layout, faded tiles, and Undo/Redo history are ready.',
        }
      : null
  );
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [, setReasonDraft] = useState(savedReason);
  const [confirmNewWorkspaceOpen, setConfirmNewWorkspaceOpen] = useState(false);
  const [showRestoredBanner, setShowRestoredBanner] = useState(restoredWithWork);

  const [presetIdx, setPresetIdx] = useState<number>(() => {
    if (canRestoreOnMount && initialWorkspaceSession) {
      return Math.min(PRESET_EQUATIONS.length - 1, initialWorkspaceSession.presetIdx);
    }
    return 0;
  });
  const [eqHistory, setEqHistory] = useState<EquationState[]>(() => {
    if (canRestoreOnMount && initialWorkspaceSession) {
      return initialWorkspaceSession.equationHistory;
    }
    return [getInitialEqState(activeMission, 0)];
  });
  const [eqHistoryIdx, setEqHistoryIdx] = useState<number>(() => {
    if (canRestoreOnMount && initialWorkspaceSession) {
      return initialWorkspaceSession.equationHistoryIdx;
    }
    return 0;
  });
  const equationState = eqHistory[eqHistoryIdx] || eqHistory[0];

  const [commitTick, setCommitTick] = useState(0);
  const mountedMissionKeyRef = useRef<string>(
    `${activeMission?.id ?? 'free'}::${workspaceResetVersion}`
  );

  const bumpCommit = () => setCommitTick((c) => c + 1);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await (labRootRef.current || document.documentElement).requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore gracefully when iframe or browser blocks fullscreen
    }
  };

  const resetEquationHistory = (initial: EquationState, persist = true) => {
    setEqHistory([initial]);
    setEqHistoryIdx(0);
    if (persist) bumpCommit();
  };

  const updateEquationState = (next: EquationState) => {
    const bounded = pushBoundedHistory(
      eqHistory,
      eqHistoryIdx,
      next,
      MAX_WORKSPACE_HISTORY_STEPS
    );
    setEqHistory(bounded.stack);
    setEqHistoryIdx(bounded.index);
    bumpCommit();
  };

  const handleUndoEquation = () => {
    if (eqHistoryIdx > 0) {
      setEqHistoryIdx(eqHistoryIdx - 1);
      setFeedback({ tone: 'info', text: 'Previous equation step restored (Undo).' });
      bumpCommit();
    }
  };

  const handleRedoEquation = () => {
    if (eqHistoryIdx < eqHistory.length - 1) {
      setEqHistoryIdx(eqHistoryIdx + 1);
      setFeedback({ tone: 'info', text: 'Equation step reapplied (Redo).' });
      bumpCommit();
    }
  };

  useEffect(() => {
    const nextKey = `${activeMission?.id ?? 'free'}::${workspaceResetVersion}`;
    if (mountedMissionKeyRef.current === nextKey) {
      return;
    }
    mountedMissionKeyRef.current = nextKey;

    setFeedback(null);
    setExplanationText(null);
    setAttempts(0);
    setRevealedHints(0);
    setReasonDraft(savedReason);
    setShowRestoredBanner(false);
    setConfirmNewWorkspaceOpen(false);
    setSelectedIds([]);
    setActiveGroupId(null);
    setGuideExpanded(Boolean(activeMission));

    if (activeMission) {
      if (activeMission.mode === 'equation' && activeMission.initialEquation) {
        setMode('equation');
        resetEquationHistory(
          createInitialEquationState(
            activeMission.initialEquation.left,
            activeMission.initialEquation.right
          ),
          true
        );
      } else {
        setMode('explore');
        setHistory([getInitialExploreTiles(activeMission)]);
        setHistoryIdx(0);
        bumpCommit();
      }
    } else {
      setMode('explore');
      setPresetIdx(0);
      setHistory([[]]);
      setHistoryIdx(0);
      resetEquationHistory(getInitialEqState(null, 0), false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMission, workspaceResetVersion]);

  useEffect(() => {
    if (commitTick === 0 || !onWorkspaceSessionChange) return;
    onWorkspaceSessionChange({
      mode,
      activeMissionId: activeMission?.id ?? null,
      presetIdx,
      exploreHistory: history,
      exploreHistoryIdx: historyIdx,
      equationHistory: eqHistory,
      equationHistoryIdx: eqHistoryIdx,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitTick]);

  const currentTiles = history[historyIdx] || [];
  const groups = useMemo(() => computeTileGroups(currentTiles), [currentTiles]);
  const zeroPairs = useMemo(() => findZeroPairs(currentTiles), [currentTiles]);
  const { activeCount, cancelledCount } = useMemo(
    () => countTileStatuses(currentTiles),
    [currentTiles]
  );
  const rawExpr = useMemo(() => formatRawExpression(currentTiles), [currentTiles]);
  const simplifiedExpr = useMemo(() => formatExpression(currentTiles, true), [currentTiles]);

  const selectedTiles = useMemo(
    () => currentTiles.filter((t) => selectedIds.includes(t.id)),
    [currentTiles, selectedIds]
  );
  const primarySelectedTile = selectedTiles[0] || null;
  const activeGroup = useMemo(
    () => groups.find((g) => g.groupId === activeGroupId) || null,
    [groups, activeGroupId]
  );

  const updateTiles = (nextTiles: Tile[], recordHistory = true) => {
    if (!recordHistory) {
      setHistory((prev) => {
        const copy = [...prev];
        copy[historyIdx] = nextTiles;
        return copy;
      });
      return;
    }
    const bounded = pushBoundedHistory(
      history,
      historyIdx,
      nextTiles,
      MAX_WORKSPACE_HISTORY_STEPS
    );
    setHistory(bounded.stack);
    setHistoryIdx(bounded.index);
    bumpCommit();
  };

  const commitPreDragState = (preDragTiles: Tile[], finalTiles: Tile[]) => {
    const tempStack = history.slice(0, historyIdx + 1);
    tempStack[tempStack.length - 1] = preDragTiles;
    const bounded = pushBoundedHistory(
      tempStack,
      tempStack.length - 1,
      finalTiles,
      MAX_WORKSPACE_HISTORY_STEPS
    );
    setHistory(bounded.stack);
    setHistoryIdx(bounded.index);
    bumpCommit();
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

    const logicalBoardW = Math.max(320, rect.width / zoom);
    const logicalBoardH = Math.max(260, rect.height / zoom);
    const { width, height } = getTileDimensions(drag.type);
    let x = (pointerX - rect.left) / zoom - panOffset.x - width / 2;
    let y = (pointerY - rect.top) / zoom - panOffset.y - height / 2;
    x = Math.max(8, Math.min(Math.max(8, logicalBoardW - width - 8), x));
    y = Math.max(24, Math.min(Math.max(24, logicalBoardH - height - 8), y));
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
        const stacked = stackZeroPair(
          withNew,
          newTile.id,
          hit.targetTile.id,
          logicalBoardW,
          logicalBoardH
        );
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
          logicalBoardW,
          logicalBoardH
        );
        if (snapped.count > 0) {
          updateTiles(snapped.tiles, true);
          onLikeTermsCombined?.();
          setFeedback({
            tone: 'success',
            text: `${snapped.count} like tiles snapped together to form group ${snapped.label}.`,
          });
          return;
        }
      }

      if (hit.kind === 'mismatch') {
        const targetW = getTileDimensions(hit.targetTile.type).width;
        const safeX =
          hit.targetTile.position.x + targetW + 18 + width < logicalBoardW
            ? hit.targetTile.position.x + targetW + 18
            : Math.max(8, hit.targetTile.position.x - width - 18);
        const placedTile: Tile = { ...newTile, position: { x: safeX, y } };
        updateTiles([...currentTiles, placedTile], true);
        onMisconceptionGuided?.();
        setFeedback({
          tone: 'warning',
          text: `Unlike terms cannot be grouped! ${getTermLabel(drag.type)} and ${getTermLabel(
            hit.targetTile.type
          )} were placed separately.`,
        });
        return;
      }
    }

    updateTiles([...currentTiles, newTile], true);
    setFeedback({
      tone: 'info',
      text: `Placed ${getTileLabel(drag.type, drag.sign)} tile in workspace.`,
    });
  };

  const handleQuickAdd = (type: TileType, sign: TileSign) => {
    const boardW = Math.max(320, (boardRef.current?.clientWidth || 540) / zoom);
    const pos = findNextAvailableTilePosition(currentTiles, type, boardW);
    const next = createTile(type, sign, pos);
    updateTiles([...currentTiles, next], true);
    setFeedback({
      tone: 'info',
      text: `Added ${getTileLabel(type, sign)} tile.`,
    });
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setSelectedIds([]);
      setActiveGroupId(null);
      setFeedback({ tone: 'info', text: 'Previous step restored (Undo).' });
      bumpCommit();
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setSelectedIds([]);
      setActiveGroupId(null);
      setFeedback({ tone: 'info', text: 'Step reapplied (Redo).' });
      bumpCommit();
    }
  };

  const handleDuplicateSelectedTile = () => {
    if (!primarySelectedTile || !isTileActive(primarySelectedTile)) return;
    const boardW = Math.max(320, (boardRef.current?.clientWidth || 540) / zoom);
    const pos = findNextAvailableTilePosition(currentTiles, primarySelectedTile.type, boardW);
    const copyTile = createTile(primarySelectedTile.type, primarySelectedTile.sign, pos);
    updateTiles([...currentTiles, copyTile], true);
    setSelectedIds([copyTile.id]);
    setActiveGroupId(null);
    setFeedback({
      tone: 'info',
      text: `Duplicated ${getTileLabel(primarySelectedTile.type, primarySelectedTile.sign)} tile.`,
    });
  };

  const handleDeleteSelectedFromInspector = () => {
    if (selectedIds.length === 0) return;
    updateTiles(
      currentTiles.filter((t) => !selectedIds.includes(t.id)),
      true
    );
    setSelectedIds([]);
    setActiveGroupId(null);
    setFeedback({
      tone: 'info',
      text: `Removed ${selectedIds.length} selected tile(s).`,
    });
  };

  const handleUngroupFromInspector = (groupId: string) => {
    const boardW = Math.max(320, (boardRef.current?.clientWidth || 540) / zoom);
    const boardH = Math.max(280, (boardRef.current?.clientHeight || 380) / zoom);
    const res = ungroupTiles(currentTiles, groupId, boardW, boardH);
    setActiveGroupId(null);
    updateTiles(res.tiles, true);
    setFeedback({
      tone: 'info',
      text: `Ungrouped into ${res.count} individual tiles.`,
    });
  };

  const handleCheckMission = () => {
    if (!activeMission) {
      const summaryText = explainWorkspace(currentTiles);
      setExplanationText(summaryText);
      setFeedback({
        tone: 'success',
        text: `Active expression on board: ${formatExpression(currentTiles, true)}.`,
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
        text: `${check.reason} Do not worry—you can try again or use a hint without losing progress.`,
      });
    }
  };

  const handleShowHint = () => {
    if (!activeMission) {
      setFeedback({
        tone: 'info',
        text: 'Exploration Hint: Drag like tiles together to snap them into a group, or stack + and − of the same type to form a Zero Pair.',
      });
      return;
    }
    const nextHint = Math.min(activeMission.hints.length, revealedHints + 1);
    setRevealedHints(nextHint);
    setGuideExpanded(true);
  };

  const handleExplain = () => {
    if (mode === 'equation') {
      setExplanationText(equationState.lastActionNote);
    } else {
      setExplanationText(explainWorkspace(currentTiles));
    }
    setGuideExpanded(true);
  };

  const dragGhostSize = activePaletteDrag ? getTileDimensions(activePaletteDrag.type) : null;
  const formattedSaveTime = workspaceStorageStatus?.savedAt
    ? new Date(workspaceStorageStatus.savedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;
  const activeStepCount =
    mode === 'equation'
      ? `${eqHistoryIdx}/${Math.max(0, eqHistory.length - 1)}`
      : `${historyIdx}/${Math.max(0, history.length - 1)}`;

  const activeCanUndo = mode === 'equation' ? eqHistoryIdx > 0 : historyIdx > 0;
  const activeCanRedo =
    mode === 'equation'
      ? eqHistoryIdx < eqHistory.length - 1
      : historyIdx < history.length - 1;

  const handleBackNavigation = () => {
    if (activeMission && onExitMission) {
      onExitMission();
    } else if (onBackToApp) {
      onBackToApp();
    }
  };

  return (
    <div
      ref={labRootRef}
      data-testid="algebra-tiles-lab"
      className="flex min-h-[100dvh] flex-col bg-[#F4F2FA] text-[#1E163B] lg:h-[100dvh] lg:overflow-hidden"
    >
      {/* Floating Drag Ghost for Palette -> Canvas Drag */}
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
            zIndex: 80,
            pointerEvents: 'none',
          }}
          className="scale-110 drop-shadow-xl opacity-95"
        >
          <TileVisual type={activePaletteDrag.type} sign={activePaletteDrag.sign} />
        </div>
      )}

      {/* Compact Dedicated Top Lab Header */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-[#4B3791]/25 bg-[#39286F] text-white shadow-xs">
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4">
          {/* Left: Back Button + Lab Title */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {(onBackToApp || (activeMission && onExitMission)) && (
              <button
                type="button"
                onClick={handleBackNavigation}
                data-testid="lab-back-button"
                aria-label={activeMission ? 'Back to Missions' : 'Back to Algebra Quest'}
                className="inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-xl bg-white/12 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/22"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {activeMission ? (
                  <span>Missions</span>
                ) : (
                  <>
                    <span className="sm:hidden">Quest</span>
                    <span className="hidden sm:inline">Algebra Quest</span>
                  </>
                )}
              </button>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-[13px] font-extrabold tracking-tight text-white sm:text-base">
                  {activeMission ? `Mission ${activeMission.order}: ${activeMission.title}` : 'ALGEBRA TILES LAB'}
                </h1>
                <span className="hidden rounded-md bg-white/12 px-1.5 py-0.5 text-[10px] font-semibold text-white/90 md:inline-block">
                  {activeMission ? activeMission.topic : 'Interactive Workspace'}
                </span>
              </div>
              <div className="hidden items-center gap-2 text-[11px] text-white/75 sm:flex">
                <span
                  data-testid="workspace-save-indicator"
                  className="inline-flex items-center gap-1"
                >
                  <Clock className="h-3 w-3 text-[#4ADE80]" />
                  {workspaceStorageStatus && !workspaceStorageStatus.ok
                    ? 'Local storage unavailable'
                    : formattedSaveTime
                    ? `Last auto-saved: ${formattedSaveTime}`
                    : 'Auto-save ready (LocalStorage)'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">History: {activeStepCount}</span>
              </div>
            </div>
          </div>

          {/* Center (Desktop): Mode Switcher */}
          {!activeMission && (
            <div className="hidden items-center rounded-xl bg-white/10 p-0.5 md:inline-flex">
              {(
                [
                  { id: 'explore', label: 'Expression' },
                  { id: 'equation', label: 'Equation Balance' },
                  { id: 'area', label: 'Area Model' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMode(tab.id);
                    setFeedback(null);
                    setExplanationText(null);
                    bumpCommit();
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                    mode === tab.id
                      ? 'bg-white text-[#39286F] shadow-xs'
                      : 'text-white/85 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Right: Undo/Redo + New Workspace + Fullscreen + Mobile Menu */}
          <div className="flex shrink-0 items-center gap-1.5">
            {mode !== 'area' && (
              <>
                <button
                  type="button"
                  onClick={mode === 'equation' ? handleUndoEquation : handleUndo}
                  disabled={!activeCanUndo}
                  aria-label="Header Undo"
                  title="Undo"
                  className="inline-flex h-8 items-center gap-1 rounded-xl bg-white/12 px-2.5 text-xs font-semibold text-white hover:bg-white/22 disabled:opacity-40"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">Undo</span>
                </button>

                <button
                  type="button"
                  onClick={mode === 'equation' ? handleRedoEquation : handleRedo}
                  disabled={!activeCanRedo}
                  aria-label="Header Redo"
                  title="Redo"
                  className="inline-flex h-8 items-center gap-1 rounded-xl bg-white/12 px-2.5 text-xs font-semibold text-white hover:bg-white/22 disabled:opacity-40"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">Redo</span>
                </button>
              </>
            )}

            {onStartNewWorkspace && (
              <button
                type="button"
                onClick={() => setConfirmNewWorkspaceOpen(true)}
                className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-xl bg-white px-2.5 text-xs font-bold text-[#39286F] hover:bg-[#EFEAFD] whitespace-nowrap"
              >
                <FilePlus2 className="h-3.5 w-3.5 text-[#5943A8]" />
                <span>Start New Workspace</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/12 text-white hover:bg-white/22"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Lab options menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/12 text-white hover:bg-white/22 md:hidden"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Secondary Dropdown Menu (Mode Switcher, Autosave status, New Workspace) */}
        {mobileMenuOpen && (
          <div className="border-t border-white/15 bg-[#2E1F5C] px-3 py-2.5 md:hidden">
            {!activeMission && (
              <div className="mb-2 grid grid-cols-3 gap-1 rounded-xl bg-white/10 p-1">
                {(
                  [
                    { id: 'explore', label: 'Expression' },
                    { id: 'equation', label: 'Equation' },
                    { id: 'area', label: 'Area Model' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setMode(tab.id);
                      setMobileMenuOpen(false);
                      setFeedback(null);
                      setExplanationText(null);
                      bumpCommit();
                    }}
                    className={`rounded-lg py-1.5 text-xs font-semibold ${
                      mode === tab.id ? 'bg-white text-[#39286F]' : 'text-white/85'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/85">
              <span>
                {formattedSaveTime ? `Saved at ${formattedSaveTime}` : 'Auto-save ready'} · Steps {activeStepCount}
              </span>
              {onStartNewWorkspace && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setConfirmNewWorkspaceOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-[#39286F]"
                >
                  <FilePlus2 className="h-3.5 w-3.5" />
                  Start New Workspace
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Banners (Restored / Confirm New Workspace) */}
      {(showRestoredBanner || (confirmNewWorkspaceOpen && onStartNewWorkspace)) && (
        <div className="shrink-0 space-y-2 px-3 pt-2.5 sm:px-4">
          {showRestoredBanner && (
            <div
              data-testid="workspace-restored-banner"
              role="status"
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#0CA789]/40 bg-[#EAF7F5] px-3.5 py-2 text-xs text-[#075E4E]"
            >
              <span>
                <strong>Last work restored</strong>
                {formattedSaveTime ? ` (saved at ${formattedSaveTime})` : ''}. Tile layout, faded status, and Undo/Redo history are ready.
              </span>
              <button
                type="button"
                onClick={() => setShowRestoredBanner(false)}
                className="font-bold underline"
              >
                Close
              </button>
            </div>
          )}

          {confirmNewWorkspaceOpen && onStartNewWorkspace && (
            <div
              role="alertdialog"
              aria-label="Confirm starting a new workspace"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EF8748] bg-[#FFF8F3] px-4 py-2.5 text-xs text-[#39286F]"
            >
              <span>
                Start a new workspace? Current tile layout, equation board, and Undo/Redo history will clear. <strong>XP, stars, badges, and completed missions stay safe.</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmNewWorkspaceOpen(false)}
                  className="rounded-lg border border-[#E5E0F3] bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmNewWorkspaceOpen(false);
                    setShowRestoredBanner(false);
                    onStartNewWorkspace();
                  }}
                  className="rounded-lg bg-[#C94438] px-3 py-1.5 font-bold text-white hover:bg-[#9B2F25]"
                >
                  Yes, Start New Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Lab Workspace Body */}
      {mode === 'explore' && (
        <div
          className={`flex-1 p-2.5 sm:p-3 lg:min-h-0 lg:overflow-hidden ${
            paletteCollapsed
              ? 'flex flex-col gap-2.5 lg:grid lg:grid-cols-[54px_minmax(0,1fr)_300px] xl:lg:grid-cols-[54px_minmax(0,1fr)_320px] lg:gap-3'
              : 'flex flex-col gap-2.5 lg:grid lg:grid-cols-[248px_minmax(0,1fr)_300px] xl:grid-cols-[260px_minmax(0,1fr)_320px] lg:gap-3'
          } pb-20 lg:pb-3`}
        >
          {/* COLUMN 1 (Desktop Left): Tile Palette */}
          <div className="hidden lg:block lg:h-full lg:min-h-0">
            <TilePalette
              variant="sidebar"
              collapsed={paletteCollapsed}
              onToggleCollapse={() => setPaletteCollapsed((v) => !v)}
              selectedSpec={selectedPaletteTile}
              onSelectSpec={setSelectedPaletteTile}
              onQuickAdd={handleQuickAdd}
              onPaletteDragStart={setActivePaletteDrag}
              onPaletteDragMove={setActivePaletteDrag}
              onPaletteDragEnd={handlePaletteDragEnd}
            />
          </div>

          {/* COLUMN 2 (Desktop Center / Mobile order-1 & order-3): Manipulation Canvas + Feedback + Toolbar */}
          <div className="contents lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-2">
            {/* Feedback bar (Desktop top of center; Mobile order-3 just under Symbolic strip) */}
            <div
              role="status"
              className={`order-3 lg:order-0 flex min-h-[38px] shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${
                feedback?.tone === 'success'
                  ? 'border-[#0CA789] bg-[#EAF7F5] text-[#075E4E]'
                  : feedback?.tone === 'warning'
                  ? 'border-[#EF8748] bg-[#FFF5EE] text-[#8F3E10]'
                  : feedback
                  ? 'border-[#5943A8]/30 bg-[#F4F0FC] text-[#39286F]'
                  : 'border-[#E5E0F3] bg-white text-slate-600'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#5943A8]" />
              <span className="line-clamp-2">
                {feedback
                  ? feedback.text
                  : 'Drag tiles onto the canvas, bring like tiles close to Snap, or stack + and − for a Zero Pair.'}
              </span>
            </div>

            <Workspace
              labMode
              hideSymbolicPanel
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
              zoom={zoom}
              panOffset={panOffset}
              onZoomChange={setZoom}
              onPanChange={setPanOffset}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              activeGroupId={activeGroupId}
              onActiveGroupIdChange={setActiveGroupId}
            />
          </div>

          {/* COLUMN 3 (Desktop Right / Mobile order-2,4,5): Symbolic Readout, Tile Inspector, Guide */}
          <div className="contents lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-2.5 lg:overflow-y-auto lg:pr-0.5">
            {/* 1. Symbolic Expression & Status Panel (Mobile order-2 directly under Canvas) */}
            <section
              aria-label="Symbolic Expression Panel"
              className="order-2 lg:order-1 shrink-0 rounded-2xl border border-[#E5E0F3] bg-white p-3.5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#5943A8]">
                    Symbolic Expression
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
                    <span
                      data-testid="symbolic-expression"
                      className="font-math text-2xl font-extrabold text-[#39286F] tabular-nums"
                    >
                      {simplifiedExpr}
                    </span>
                    {rawExpr !== simplifiedExpr && (
                      <span className="font-math text-xs text-slate-500 tabular-nums">
                        (raw: {rawExpr})
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckMission}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#0CA789] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#077D66]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {activeMission ? 'Check Answer' : 'Check'}
                </button>
              </div>

              {/* Counts row */}
              <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-[#F0ECF9] pt-2 text-[11px] text-slate-600">
                <span data-testid="active-tile-count" className="font-bold text-[#39286F]">
                  Active Tiles: {activeCount}
                </span>
                <span aria-hidden="true">·</span>
                <span data-testid="cancelled-tile-count" className="font-medium text-slate-500">
                  Faded Tiles: {cancelledCount}
                </span>
                <span aria-hidden="true">·</span>
                <span>Zero pairs: {zeroPairs.length}</span>
                {groups.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#5943A8]">{groups.length} groups</span>
                  </>
                )}
              </div>

              {/* Redesigned Tile Family Color Key */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[#F0ECF9] pt-2 text-[10px] text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#2D6DF6]" aria-hidden="true" />
                  x²
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#0CA789]" aria-hidden="true" />
                  x
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#F6C431] border border-[#C99708]" aria-hidden="true" />
                  1
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#6C4CF6]" aria-hidden="true" />
                  y
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#EC3B93]" aria-hidden="true" />
                  xy
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#F98E13]" aria-hidden="true" />
                  y²
                </span>
                <span className="inline-flex items-center gap-1">
                  <span
                    className="h-2.5 w-3.5 rounded-xs border border-[#D64545] bg-[#D4F3EC]"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(45deg, rgba(220,38,38,0.34) 0 2px, transparent 2px 5px)',
                    }}
                    aria-hidden="true"
                  />
                  Negative
                </span>
                <span className="inline-flex items-center gap-1">
                  <span
                    className="h-2.5 w-3.5 rounded-xs border border-dashed border-slate-400 bg-slate-200/45"
                    aria-hidden="true"
                  />
                  Faded (=0)
                </span>
              </div>
            </section>

            {/* 2. Tile Inspector Panel (Always visible on desktop; collapsible on mobile when a tile/group is selected) */}
            {(primarySelectedTile || activeGroup) ? (
              <section
                data-testid="tile-inspector"
                aria-label="Tile Inspector"
                className="order-4 lg:order-2 shrink-0 rounded-2xl border border-[#5943A8]/30 bg-white p-3.5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#39286F]">
                    Tile Inspector
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setInspectorCollapsed((v) => !v)}
                      aria-label={inspectorCollapsed ? 'Expand Tile Inspector' : 'Collapse Tile Inspector'}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-[#F7F5FC]"
                    >
                      {inspectorCollapsed ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronUp className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIds([]);
                        setActiveGroupId(null);
                      }}
                      aria-label="Clear tile selection"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-[#F7F5FC]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {!inspectorCollapsed && (
                  <div className="mt-2.5 space-y-2.5">
                    {primarySelectedTile && (
                      <div className="flex items-center gap-3 rounded-xl bg-[#F7F5FC] p-2.5">
                        <TileVisual
                          type={primarySelectedTile.type}
                          sign={primarySelectedTile.sign}
                          status={primarySelectedTile.status || 'active'}
                          compact
                        />
                        <div className="min-w-0 flex-1 text-xs">
                          <p className="font-math text-sm font-bold text-[#39286F]">
                            {getTileLabel(primarySelectedTile.type, primarySelectedTile.sign)}
                            {selectedTiles.length > 1 ? ` (+${selectedTiles.length - 1} more)` : ''}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            {TILE_RATIO_META[primarySelectedTile.type].family} ·{' '}
                            {TILE_RATIO_META[primarySelectedTile.type].ratio}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Status:{' '}
                            <strong
                              className={
                                isTileActive(primarySelectedTile)
                                  ? 'text-[#077D66]'
                                  : 'text-slate-600'
                              }
                            >
                              {isTileActive(primarySelectedTile) ? 'Active (counted)' : 'Faded (cancelled)'}
                            </strong>
                          </p>
                        </div>
                      </div>
                    )}

                    {activeGroup && (
                      <div className="flex items-center justify-between rounded-xl border border-[#5943A8]/20 bg-[#FAF8FF] px-3 py-2 text-xs">
                        <span className="font-semibold text-[#39286F]">
                          Group <strong className="font-math">{activeGroup.label}</strong> ({activeGroup.count} tiles)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUngroupFromInspector(activeGroup.groupId)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E5E0F3] bg-white px-2 py-1 text-[11px] font-semibold text-[#5943A8] hover:border-[#5943A8]"
                        >
                          <Unlink className="h-3 w-3" />
                          Ungroup
                        </button>
                      </div>
                    )}

                    {primarySelectedTile && isTileActive(primarySelectedTile) && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleDuplicateSelectedTile}
                          className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#39286F] hover:border-[#5943A8] hover:bg-[#F7F5FC]"
                        >
                          <Copy className="h-3.5 w-3.5 text-[#5943A8]" />
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteSelectedFromInspector}
                          className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-xl border border-[#C94438]/30 bg-[#FFF2F0] px-2.5 py-1.5 text-xs font-semibold text-[#9B2F25] hover:bg-[#FFE3DF]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            ) : (
              <section
                data-testid="tile-inspector-empty"
                aria-label="Tile Inspector"
                className="hidden lg:block shrink-0 rounded-2xl border border-[#E5E0F3] bg-white p-3.5 text-xs text-slate-600 shadow-xs"
              >
                <div className="flex items-center gap-2 font-extrabold uppercase tracking-wider text-[#39286F]">
                  <Layers className="h-3.5 w-3.5 text-[#5943A8]" />
                  Tile Inspector
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                  Select any tile or snapped group on the canvas to inspect its term family, dimensions, status, duplicate it, or ungroup.
                </p>
              </section>
            )}

            {/* 3. Mission / Exploration Guide + Hints + Math Explanation */}
            <section
              aria-label="Guide and Hints"
              className="order-5 lg:order-3 shrink-0 rounded-2xl border border-[#E5E0F3] bg-white p-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setGuideExpanded((v) => !v)}
                  className="flex flex-1 items-center justify-between text-left"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#39286F]">
                    <BookOpen className="h-3.5 w-3.5 text-[#5943A8]" />
                    {activeMission ? 'Mission Guide' : 'Exploration Guide'}
                  </span>
                  {guideExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </button>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={handleShowHint}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#F4C95D]/30 px-2.5 py-1.5 text-[11px] font-semibold text-[#6F4E07] hover:bg-[#F4C95D]/50"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Hint
                </button>
                <button
                  type="button"
                  onClick={handleExplain}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#E5E0F3] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#39286F] hover:bg-[#F7F5FC]"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Explain Result
                </button>
              </div>

              {guideExpanded && (
                <div className="mt-2.5 space-y-2 text-xs text-slate-700">
                  <p className="leading-relaxed">
                    {activeMission
                      ? activeMission.instructions
                      : 'Explore both X Family (x², x, 1) and Y Family (y, xy, y²) tiles. Unlike terms like x and y stay distinct, while + and − tiles of the exact same type form Zero Pairs.'}
                  </p>
                  {activeMission?.lkpdPrompt && (
                    <p className="rounded-xl bg-[#F7F5FC] px-3 py-2 text-[11px] text-[#39286F]">
                      <strong>Observation Note:</strong> {activeMission.lkpdPrompt}
                    </p>
                  )}
                  {revealedHints > 0 && activeMission && (
                    <div className="space-y-1 rounded-xl border border-[#F4C95D] bg-[#FFFBEB] p-2.5 text-[11px] text-[#78530A]">
                      {activeMission.hints.slice(0, revealedHints).map((hint, idx) => (
                        <p key={idx}>
                          <strong>Hint {idx + 1}:</strong> {hint}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {explanationText && (
                <div className="mt-2.5 rounded-xl border border-[#2D6DF6]/30 bg-[#EEF4FC] px-3 py-2 text-[11px] leading-relaxed text-[#1E3A8A]">
                  <strong>Explanation:</strong> {explanationText}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Mobile / Tablet Bottom Sheet Tile Palette Drawer (only in Expression mode < lg) */}
      {mode === 'explore' && (
        <div className="lg:hidden">
          {/* Sticky Bottom Trigger */}
          {!mobileDrawerOpen && (
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D6CEF0] bg-white/95 px-3 py-2 shadow-[0_-4px_16px_rgba(57,40,111,0.1)] backdrop-blur-xs">
              <button
                type="button"
                data-testid="open-mobile-palette"
                onClick={() => setMobileDrawerOpen(true)}
                className="flex w-full min-h-[42px] items-center justify-between rounded-xl bg-[#5943A8] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#39286F]"
              >
                <span className="inline-flex items-center gap-2">
                  <span>Open Tile Palette</span>
                  {selectedPaletteTile && (
                    <span className="rounded-md bg-white/20 px-1.5 py-0.5 font-math text-[11px]">
                      Tap: {getTileLabel(selectedPaletteTile.type, selectedPaletteTile.sign)}
                    </span>
                  )}
                </span>
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Expandable Bottom Sheet Drawer */}
          {mobileDrawerOpen && (
            <div
              data-testid="mobile-palette-drawer"
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[52dvh] flex-col rounded-t-2xl border-t-2 border-[#5943A8]/35 bg-white px-3 pb-3 pt-2 shadow-[0_-8px_28px_rgba(30,22,59,0.2)]"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#39286F]">
                  Tile Palette (X &amp; Y Families)
                </span>
                <button
                  type="button"
                  data-testid="close-mobile-palette"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="inline-flex min-h-[30px] items-center gap-1 rounded-lg border border-[#E5E0F3] bg-[#F7F5FC] px-2.5 py-1 text-xs font-semibold text-[#39286F]"
                >
                  <span>Hide</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <TilePalette
                  variant="drawer"
                  defaultFamilyTab="x"
                  selectedSpec={selectedPaletteTile}
                  onSelectSpec={setSelectedPaletteTile}
                  onQuickAdd={handleQuickAdd}
                  onPaletteDragStart={(drag) => {
                    setActivePaletteDrag(drag);
                  }}
                  onPaletteDragMove={setActivePaletteDrag}
                  onPaletteDragEnd={handlePaletteDragEnd}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Equation Balance Mode */}
      {mode === 'equation' && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-3">
            {activeMission && (
              <div className="rounded-2xl border border-[#E5E0F3] bg-white px-4 py-3 text-xs text-slate-700">
                <strong className="text-[#39286F]">Mission Goal:</strong> {activeMission.instructions}
              </div>
            )}

            {!activeMission && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E5E0F3] bg-white px-4 py-3">
                <span className="text-xs font-semibold text-slate-600">
                  Choose a sample equation:
                </span>
                {PRESET_EQUATIONS.map((preset, idx) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setPresetIdx(idx);
                      resetEquationHistory(createInitialEquationState(preset.left, preset.right));
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
              onChangeEquation={updateEquationState}
              canUndo={eqHistoryIdx > 0}
              canRedo={eqHistoryIdx < eqHistory.length - 1}
              onUndo={handleUndoEquation}
              onRedo={handleRedoEquation}
              onResetEquation={() => {
                if (activeMission?.initialEquation) {
                  resetEquationHistory(
                    createInitialEquationState(
                      activeMission.initialEquation.left,
                      activeMission.initialEquation.right
                    )
                  );
                } else {
                  const preset = PRESET_EQUATIONS[presetIdx];
                  resetEquationHistory(createInitialEquationState(preset.left, preset.right));
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
        </div>
      )}

      {/* Area Model Mode */}
      {mode === 'area' && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="mx-auto max-w-[1200px]">
            <AreaModelPreview />
          </div>
        </div>
      )}
    </div>
  );
};
