import {
  EquationState,
  ExpressionSummary,
  Tile,
  TileSign,
  TileStatus,
  TileType,
  WorkspaceMode,
} from '../types/algebra';
import { formatExpression, isTileActive, summarizeTiles } from '../engine/MathEngine';

export const WORKSPACE_STORAGE_KEY = 'algebra_quest_workspace_v1';
export const WORKSPACE_STORAGE_VERSION = 1;
export const MAX_WORKSPACE_HISTORY_STEPS = 30;

export interface PersistedWorkspaceSession {
  version: number;
  savedAt: string;
  mode: WorkspaceMode;
  activeMissionId: string | null;
  presetIdx: number;
  symbolicExpression: string;
  equationExpression: string;
  exploreHistory: Tile[][];
  exploreHistoryIdx: number;
  equationHistory: EquationState[];
  equationHistoryIdx: number;
}

export interface WorkspaceLoadResult {
  session: PersistedWorkspaceSession | null;
  status: 'ok' | 'empty' | 'corrupted' | 'unavailable';
  hasRecoverableWork: boolean;
  errorMessage?: string;
}

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

function getSafeStorage(customStorage?: StorageLike): StorageLike | null {
  if (customStorage) return customStorage;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Pure helper to push a new snapshot onto an Undo/Redo history stack
 * while capping the total history length to `maxSteps` (default 30).
 */
export function pushBoundedHistory<T>(
  stack: T[],
  currentIndex: number,
  nextItem: T,
  maxSteps = MAX_WORKSPACE_HISTORY_STEPS
): { stack: T[]; index: number } {
  const safeLimit = Math.max(2, maxSteps);
  const clampedIdx = Math.max(0, Math.min(Math.max(0, stack.length - 1), currentIndex));
  const sliced = stack.length === 0 ? [] : stack.slice(0, clampedIdx + 1);
  const appended = [...sliced, nextItem];
  const bounded =
    appended.length > safeLimit
      ? appended.slice(appended.length - safeLimit)
      : appended;
  return {
    stack: bounded,
    index: bounded.length - 1,
  };
}

function isValidTileType(value: unknown): value is TileType {
  return (
    value === 'x2' ||
    value === 'x' ||
    value === '1' ||
    value === 'y2' ||
    value === 'xy' ||
    value === 'y'
  );
}

function isValidTileSign(value: unknown): value is TileSign {
  return value === 1 || value === -1;
}

function isValidTileStatus(value: unknown): value is TileStatus {
  return value === 'active' || value === 'cancelled';
}

function isValidTile(raw: unknown): raw is Tile {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || !obj.id) return false;
  if (!isValidTileType(obj.type)) return false;
  if (!isValidTileSign(obj.sign)) return false;
  if (!obj.position || typeof obj.position !== 'object') return false;
  const pos = obj.position as Record<string, unknown>;
  if (typeof pos.x !== 'number' || !Number.isFinite(pos.x)) return false;
  if (typeof pos.y !== 'number' || !Number.isFinite(pos.y)) return false;
  if (obj.status !== undefined && !isValidTileStatus(obj.status)) return false;
  if (obj.groupId !== undefined && obj.groupId !== null && typeof obj.groupId !== 'string') {
    return false;
  }
  if (obj.zeroPairId !== undefined && obj.zeroPairId !== null && typeof obj.zeroPairId !== 'string') {
    return false;
  }
  return true;
}

function normalizeTile(tile: Tile): Tile {
  return {
    id: tile.id,
    type: tile.type,
    sign: tile.sign,
    position: { x: tile.position.x, y: tile.position.y },
    status: tile.status === 'cancelled' ? 'cancelled' : 'active',
    groupId: tile.groupId ?? null,
    zeroPairId: tile.zeroPairId ?? null,
  };
}

function isValidSummary(raw: unknown): raw is ExpressionSummary {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  const requiredKeys = [
    'x2',
    'x',
    'constant',
    'posX2',
    'negX2',
    'posX',
    'negX',
    'posOne',
    'negOne',
  ];
  return requiredKeys.every((k) => typeof obj[k] === 'number' && Number.isFinite(obj[k] as number));
}

function normalizeSummary(raw: ExpressionSummary): ExpressionSummary {
  return {
    ...raw,
    y2: typeof raw.y2 === 'number' ? raw.y2 : 0,
    xy: typeof raw.xy === 'number' ? raw.xy : 0,
    y: typeof raw.y === 'number' ? raw.y : 0,
    posY2: typeof raw.posY2 === 'number' ? raw.posY2 : 0,
    negY2: typeof raw.negY2 === 'number' ? raw.negY2 : 0,
    posXY: typeof raw.posXY === 'number' ? raw.posXY : 0,
    negXY: typeof raw.negXY === 'number' ? raw.negXY : 0,
    posY: typeof raw.posY === 'number' ? raw.posY : 0,
    negY: typeof raw.negY === 'number' ? raw.negY : 0,
  };
}

function isValidEquationState(raw: unknown): raw is EquationState {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.leftTiles) || !obj.leftTiles.every(isValidTile)) return false;
  if (!Array.isArray(obj.rightTiles) || !obj.rightTiles.every(isValidTile)) return false;
  if (typeof obj.lastActionNote !== 'string') return false;
  if (typeof obj.isBalanced !== 'boolean') return false;
  return true;
}

function normalizeEquationState(state: EquationState): EquationState {
  const leftTiles = state.leftTiles.map(normalizeTile);
  const rightTiles = state.rightTiles.map(normalizeTile);
  return {
    leftTiles,
    rightTiles,
    initialLeft: isValidSummary(state.initialLeft)
      ? normalizeSummary(state.initialLeft)
      : summarizeTiles(leftTiles),
    initialRight: isValidSummary(state.initialRight)
      ? normalizeSummary(state.initialRight)
      : summarizeTiles(rightTiles),
    lastActionNote: state.lastActionNote,
    isBalanced: state.isBalanced,
    imbalanceReason: typeof state.imbalanceReason === 'string' ? state.imbalanceReason : undefined,
  };
}

function isValidMode(value: unknown): value is WorkspaceMode {
  return value === 'explore' || value === 'equation' || value === 'area';
}

export function computeWorkspaceHasRecoverableWork(session: PersistedWorkspaceSession): boolean {
  const currentExplore = session.exploreHistory[session.exploreHistoryIdx] || [];
  const currentEq = session.equationHistory[session.equationHistoryIdx];
  const hasExploreChanges =
    currentExplore.length > 0 ||
    session.exploreHistory.length > 1 ||
    session.exploreHistoryIdx > 0;
  const hasEquationChanges =
    session.equationHistory.length > 1 ||
    session.equationHistoryIdx > 0 ||
    (currentEq ? currentEq.leftTiles.some((t) => !isTileActive(t)) || currentEq.rightTiles.some((t) => !isTileActive(t)) : false);

  return Boolean(
    hasExploreChanges ||
      hasEquationChanges ||
      session.activeMissionId !== null ||
      session.mode === 'equation'
  );
}

export function saveWorkspaceSession(
  input: Omit<PersistedWorkspaceSession, 'version' | 'savedAt' | 'symbolicExpression' | 'equationExpression'>,
  customStorage?: StorageLike
): { ok: boolean; savedAt: string; session: PersistedWorkspaceSession } {
  const savedAt = new Date().toISOString();

  const boundedExplore =
    input.exploreHistory.length > MAX_WORKSPACE_HISTORY_STEPS
      ? input.exploreHistory.slice(input.exploreHistory.length - MAX_WORKSPACE_HISTORY_STEPS)
      : input.exploreHistory.length === 0
      ? [[]]
      : input.exploreHistory;
  const exploreOffset = Math.max(0, input.exploreHistory.length - boundedExplore.length);
  const exploreIdx = Math.max(
    0,
    Math.min(boundedExplore.length - 1, input.exploreHistoryIdx - exploreOffset)
  );

  const boundedEq =
    input.equationHistory.length > MAX_WORKSPACE_HISTORY_STEPS
      ? input.equationHistory.slice(input.equationHistory.length - MAX_WORKSPACE_HISTORY_STEPS)
      : input.equationHistory;
  const eqOffset = Math.max(0, input.equationHistory.length - boundedEq.length);
  const eqIdx = Math.max(
    0,
    Math.min(Math.max(0, boundedEq.length - 1), input.equationHistoryIdx - eqOffset)
  );

  const currentTiles = boundedExplore[exploreIdx] || [];
  const currentEq = boundedEq[eqIdx];
  const symbolicExpression = formatExpression(currentTiles, true);
  const equationLeftExpression = currentEq ? formatExpression(currentEq.leftTiles, true) : '0';
  const equationRightExpression = currentEq ? formatExpression(currentEq.rightTiles, true) : '0';

  const payload: PersistedWorkspaceSession = {
    version: WORKSPACE_STORAGE_VERSION,
    savedAt,
    mode: input.mode,
    activeMissionId: input.activeMissionId,
    presetIdx: input.presetIdx,
    symbolicExpression,
    equationExpression: `${equationLeftExpression} = ${equationRightExpression}`,
    exploreHistory: boundedExplore,
    exploreHistoryIdx: exploreIdx,
    equationHistory: boundedEq,
    equationHistoryIdx: eqIdx,
  };

  const storage = getSafeStorage(customStorage);
  if (!storage) {
    return { ok: false, savedAt: '', session: payload };
  }

  try {
    storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
    return { ok: true, savedAt, session: payload };
  } catch {
    return { ok: false, savedAt: '', session: payload };
  }
}

export function loadWorkspaceSession(customStorage?: StorageLike): WorkspaceLoadResult {
  const storage = getSafeStorage(customStorage);
  if (!storage) {
    return {
      session: null,
      status: 'unavailable',
      hasRecoverableWork: false,
      errorMessage: 'LocalStorage is unavailable in this browser.',
    };
  }

  let raw: string | null = null;
  try {
    raw = storage.getItem(WORKSPACE_STORAGE_KEY);
  } catch {
    return {
      session: null,
      status: 'unavailable',
      hasRecoverableWork: false,
      errorMessage: 'Failed to read local storage.',
    };
  }

  if (!raw) {
    return {
      session: null,
      status: 'empty',
      hasRecoverableWork: false,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') {
      return {
        session: null,
        status: 'corrupted',
        hasRecoverableWork: false,
        errorMessage: 'Saved workspace data format is invalid.',
      };
    }

    if (parsed.version !== WORKSPACE_STORAGE_VERSION) {
      return {
        session: null,
        status: 'corrupted',
        hasRecoverableWork: false,
        errorMessage: `Unrecognized workspace data version (${String(parsed.version)}).`,
      };
    }

    if (!isValidMode(parsed.mode)) {
      return {
        session: null,
        status: 'corrupted',
        hasRecoverableWork: false,
        errorMessage: 'Saved workspace mode is invalid.',
      };
    }

    if (
      !Array.isArray(parsed.exploreHistory) ||
      parsed.exploreHistory.length === 0 ||
      !parsed.exploreHistory.every(
        (snap) => Array.isArray(snap) && snap.every(isValidTile)
      )
    ) {
      return {
        session: null,
        status: 'corrupted',
        hasRecoverableWork: false,
        errorMessage: 'Saved workspace tile history is corrupted or incomplete.',
      };
    }

    if (
      !Array.isArray(parsed.equationHistory) ||
      parsed.equationHistory.length === 0 ||
      !parsed.equationHistory.every(isValidEquationState)
    ) {
      return {
        session: null,
        status: 'corrupted',
        hasRecoverableWork: false,
        errorMessage: 'Saved equation board history is corrupted or incomplete.',
      };
    }

    const exploreHistory = parsed.exploreHistory
      .slice(-MAX_WORKSPACE_HISTORY_STEPS)
      .map((snap) => (snap as Tile[]).map(normalizeTile));
    const rawExploreIdx =
      typeof parsed.exploreHistoryIdx === 'number' && Number.isInteger(parsed.exploreHistoryIdx)
        ? parsed.exploreHistoryIdx
        : exploreHistory.length - 1;
    const exploreHistoryIdx = Math.max(0, Math.min(exploreHistory.length - 1, rawExploreIdx));

    const equationHistory = parsed.equationHistory
      .slice(-MAX_WORKSPACE_HISTORY_STEPS)
      .map((eq) => normalizeEquationState(eq as EquationState));
    const rawEqIdx =
      typeof parsed.equationHistoryIdx === 'number' && Number.isInteger(parsed.equationHistoryIdx)
        ? parsed.equationHistoryIdx
        : equationHistory.length - 1;
    const equationHistoryIdx = Math.max(0, Math.min(equationHistory.length - 1, rawEqIdx));

    const activeTiles = exploreHistory[exploreHistoryIdx] || [];
    const activeEq = equationHistory[equationHistoryIdx];

    const session: PersistedWorkspaceSession = {
      version: WORKSPACE_STORAGE_VERSION,
      savedAt:
        typeof parsed.savedAt === 'string' && parsed.savedAt
          ? parsed.savedAt
          : new Date().toISOString(),
      mode: parsed.mode,
      activeMissionId:
        typeof parsed.activeMissionId === 'string' ? parsed.activeMissionId : null,
      presetIdx:
        typeof parsed.presetIdx === 'number' && Number.isInteger(parsed.presetIdx) && parsed.presetIdx >= 0
          ? parsed.presetIdx
          : 0,
      symbolicExpression: formatExpression(activeTiles, true),
      equationExpression: activeEq
        ? `${formatExpression(activeEq.leftTiles, true)} = ${formatExpression(
            activeEq.rightTiles,
            true
          )}`
        : '0 = 0',
      exploreHistory,
      exploreHistoryIdx,
      equationHistory,
      equationHistoryIdx,
    };

    return {
      session,
      status: 'ok',
      hasRecoverableWork: computeWorkspaceHasRecoverableWork(session),
    };
  } catch {
    return {
      session: null,
      status: 'corrupted',
      hasRecoverableWork: false,
      errorMessage: 'Workspace data in LocalStorage is corrupted and cannot be read.',
    };
  }
}

export function clearWorkspaceSession(customStorage?: StorageLike): boolean {
  const storage = getSafeStorage(customStorage);
  if (!storage) return false;
  try {
    storage.removeItem(WORKSPACE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
