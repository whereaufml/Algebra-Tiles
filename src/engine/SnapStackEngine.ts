import { Tile, TileSign, TileType } from '../types/algebra';
import {
  canFormZeroPair,
  createTile,
  formatExpression,
  formatSummaryToExpression,
  getTermLabel,
} from './MathEngine';

export interface TileDimensions {
  width: number;
  height: number;
}

export function getTileSize(type: TileType): TileDimensions {
  if (type === 'x2') return { width: 78, height: 78 };
  if (type === 'x') return { width: 76, height: 44 };
  return { width: 46, height: 46 };
}

export interface TileGroupView {
  groupId: string;
  type: TileType;
  sign: TileSign;
  count: number;
  label: string;
  memberIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ZeroPairStackView {
  zeroPairId: string;
  type: TileType;
  positiveTile: Tile;
  negativeTile: Tile;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ProximityInteraction =
  | { kind: 'group'; targetTile: Tile }
  | { kind: 'zeropair'; targetTile: Tile }
  | { kind: 'mismatch'; targetTile: Tile }
  | null;

function boxesIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  pad = 0
): boolean {
  return (
    a.x < b.x + b.width + pad &&
    a.x + a.width + pad > b.x &&
    a.y < b.y + b.height + pad &&
    a.y + a.height + pad > b.y
  );
}

/**
 * Evaluates spatial proximity / overlap when dragging a tile or group:
 * 1. Overlap (`pad = 4`) with opposite-sign same-type single tile -> 'zeropair' (only when dragging 1 tile)
 * 2. Proximity (`pad = 20`) with same-sign same-type tile/group -> 'group' (magnetic snap)
 * 3. Overlap (`pad = 2`) with different-type tile -> 'mismatch'
 */
export function detectDropTarget(
  tiles: Tile[],
  movingIds: string[],
  movingType: TileType,
  movingSign: TileSign,
  box: { x: number; y: number; width: number; height: number },
  isSingleMovingTile: boolean
): ProximityInteraction {
  const movingSet = new Set(movingIds);
  const candidates = tiles.filter((t) => !movingSet.has(t.id) && !t.zeroPairId);

  const boxCx = box.x + box.width / 2;
  const boxCy = box.y + box.height / 2;

  const sorted = [...candidates].sort((a, b) => {
    const da = getTileSize(a.type);
    const db = getTileSize(b.type);
    const distA = Math.hypot(boxCx - (a.position.x + da.width / 2), boxCy - (a.position.y + da.height / 2));
    const distB = Math.hypot(boxCx - (b.position.x + db.width / 2), boxCy - (b.position.y + db.height / 2));
    return distA - distB;
  });

  // 1. Check direct overlap first (zero pair or mismatch takes precedence when directly stacked)
  for (const other of sorted) {
    const size = getTileSize(other.type);
    const otherBox = { x: other.position.x, y: other.position.y, ...size };
    if (boxesIntersect(box, otherBox, 2)) {
      if (other.type === movingType && other.sign === -movingSign && isSingleMovingTile) {
        return { kind: 'zeropair', targetTile: other };
      }
      if (other.type === movingType && other.sign === movingSign) {
        return { kind: 'group', targetTile: other };
      }
      if (other.type !== movingType) {
        return { kind: 'mismatch', targetTile: other };
      }
    }
  }

  // 2. Check magnetic snap proximity (20px) for same-type & same-sign tiles/groups
  for (const other of sorted) {
    if (other.type !== movingType || other.sign !== movingSign) continue;
    const size = getTileSize(other.type);
    const otherBox = { x: other.position.x, y: other.position.y, ...size };
    if (boxesIntersect(box, otherBox, 20)) {
      return { kind: 'group', targetTile: other };
    }
  }

  return null;
}

export function computeTileGroups(tiles: Tile[]): TileGroupView[] {
  const buckets = new Map<string, Tile[]>();
  for (const tile of tiles) {
    if (!tile.groupId || tile.zeroPairId) continue;
    const list = buckets.get(tile.groupId) || [];
    list.push(tile);
    buckets.set(tile.groupId, list);
  }

  const groups: TileGroupView[] = [];
  for (const [groupId, members] of buckets.entries()) {
    if (members.length < 2) continue;
    const first = members[0];
    if (!members.every((m) => m.type === first.type && m.sign === first.sign)) continue;

    const minX = Math.min(...members.map((m) => m.position.x));
    const minY = Math.min(...members.map((m) => m.position.y));
    const maxX = Math.max(...members.map((m) => m.position.x + getTileSize(m.type).width));
    const maxY = Math.max(...members.map((m) => m.position.y + getTileSize(m.type).height));

    const net = first.sign * members.length;
    const label = formatSummaryToExpression({
      x2: first.type === 'x2' ? net : 0,
      x: first.type === 'x' ? net : 0,
      constant: first.type === '1' ? net : 0,
    });

    groups.push({
      groupId,
      type: first.type,
      sign: first.sign,
      count: members.length,
      label,
      memberIds: members.map((m) => m.id),
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    });
  }

  return groups;
}

export function computeZeroPairStacks(tiles: Tile[]): ZeroPairStackView[] {
  const buckets = new Map<string, Tile[]>();
  for (const tile of tiles) {
    if (!tile.zeroPairId) continue;
    const list = buckets.get(tile.zeroPairId) || [];
    list.push(tile);
    buckets.set(tile.zeroPairId, list);
  }

  const stacks: ZeroPairStackView[] = [];
  for (const [zeroPairId, pair] of buckets.entries()) {
    if (pair.length !== 2) continue;
    const pos = pair.find((t) => t.sign === 1);
    const neg = pair.find((t) => t.sign === -1);
    if (!pos || !neg || pos.type !== neg.type) continue;

    const minX = Math.min(pos.position.x, neg.position.x);
    const minY = Math.min(pos.position.y, neg.position.y);
    const size = getTileSize(pos.type);
    const maxX = Math.max(pos.position.x, neg.position.x) + size.width;
    const maxY = Math.max(pos.position.y, neg.position.y) + size.height;
    const term = pos.type === 'x2' ? 'x²' : pos.type;

    stacks.push({
      zeroPairId,
      type: pos.type,
      positiveTile: pos,
      negativeTile: neg,
      label: `+${term} + (−${term}) = 0`,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    });
  }

  return stacks;
}

export function layoutSnappedGroup(
  tiles: Tile[],
  groupId: string,
  anchorX: number,
  anchorY: number,
  boardWidth = 540,
  boardHeight = 340
): Tile[] {
  const members = tiles.filter((t) => t.groupId === groupId);
  if (members.length === 0) return tiles;

  const { width, height } = getTileSize(members[0].type);
  const gapX = 6;
  const gapY = 8;
  const maxPerRow = Math.max(2, Math.floor((boardWidth - 28) / (width + gapX)));
  const cols = Math.min(members.length, maxPerRow);
  const rows = Math.ceil(members.length / cols);
  const totalW = cols * width + (cols - 1) * gapX;
  const totalH = rows * height + (rows - 1) * gapY;

  const nonMembers = tiles.filter((t) => t.groupId !== groupId);
  const overlapsNonMember = (sx: number, sy: number) =>
    nonMembers.some((other) => {
      const os = getTileSize(other.type);
      return boxesIntersect(
        { x: sx, y: sy, width: totalW, height: totalH },
        { x: other.position.x, y: other.position.y, width: os.width, height: os.height },
        4
      );
    });

  let startX = Math.max(12, Math.min(Math.max(12, boardWidth - totalW - 12), anchorX));
  let startY = Math.max(34, Math.min(Math.max(34, boardHeight - totalH - 12), anchorY));

  if (overlapsNonMember(startX, startY)) {
    const candidates: Array<{ x: number; y: number }> = [
      { x: startX, y: Math.min(boardHeight - totalH - 12, startY + height + 18) },
      { x: Math.max(12, startX - width - 12), y: startY },
      { x: Math.min(boardWidth - totalW - 12, startX + width + 18), y: startY },
      { x: 16, y: Math.min(boardHeight - totalH - 12, startY + height + 24) },
    ];
    for (const c of candidates) {
      if (
        c.x >= 12 &&
        c.y >= 34 &&
        c.x + totalW <= boardWidth - 12 &&
        c.y + totalH <= boardHeight - 12 &&
        !overlapsNonMember(c.x, c.y)
      ) {
        startX = c.x;
        startY = c.y;
        break;
      }
    }
  }

  const posById = new Map<string, { x: number; y: number }>();
  members.forEach((m, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    posById.set(m.id, {
      x: Math.round(startX + col * (width + gapX)),
      y: Math.round(startY + row * (height + gapY)),
    });
  });

  return tiles.map((t) => {
    const pos = posById.get(t.id);
    return pos ? { ...t, position: pos } : t;
  });
}

export function snapTilesIntoGroup(
  tiles: Tile[],
  sourceTileIds: string[],
  targetTileId: string,
  boardWidth = 540,
  boardHeight = 340
): { tiles: Tile[]; groupId: string; count: number; label: string } {
  const target = tiles.find((t) => t.id === targetTileId);
  const sourceFirst = tiles.find((t) => sourceTileIds.includes(t.id));
  if (!target || !sourceFirst || target.type !== sourceFirst.type || target.sign !== sourceFirst.sign) {
    return {
      tiles,
      groupId: target?.groupId || '',
      count: 0,
      label: '',
    };
  }

  const groupId = target.groupId || `grp-${target.type}-${target.sign}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const sourceSet = new Set(sourceTileIds);
  const targetGroupSet = new Set(
    target.groupId
      ? tiles.filter((t) => t.groupId === target.groupId).map((t) => t.id)
      : [target.id]
  );

  // Also include any existing group members of source tiles if dragging a whole group
  const sourceGroupIds = new Set(
    tiles.filter((t) => sourceSet.has(t.id) && t.groupId).map((t) => t.groupId as string)
  );
  for (const t of tiles) {
    if (t.groupId && sourceGroupIds.has(t.groupId)) {
      sourceSet.add(t.id);
    }
  }

  const mergedIds = new Set<string>([...targetGroupSet, ...sourceSet]);
  const updated = tiles.map((t) =>
    mergedIds.has(t.id) ? { ...t, groupId, zeroPairId: null } : t
  );

  const anchorMembers = updated.filter((t) => targetGroupSet.has(t.id));
  const anchorX = Math.min(...anchorMembers.map((m) => m.position.x));
  const anchorY = Math.min(...anchorMembers.map((m) => m.position.y));

  const laidOut = layoutSnappedGroup(updated, groupId, anchorX, anchorY, boardWidth, boardHeight);
  const net = target.sign * mergedIds.size;
  const label = formatSummaryToExpression({
    x2: target.type === 'x2' ? net : 0,
    x: target.type === 'x' ? net : 0,
    constant: target.type === '1' ? net : 0,
  });

  return {
    tiles: laidOut,
    groupId,
    count: mergedIds.size,
    label,
  };
}

export function addLikeTileToGroup(
  tiles: Tile[],
  groupId: string,
  boardWidth = 540,
  boardHeight = 340
): { tiles: Tile[]; count: number; label: string } {
  const members = tiles.filter((t) => t.groupId === groupId);
  if (members.length === 0) return { tiles, count: 0, label: '' };

  const sample = members[0];
  const newTile = createTile(sample.type, sample.sign, { ...sample.position }, groupId);
  const anchorX = Math.min(...members.map((m) => m.position.x));
  const anchorY = Math.min(...members.map((m) => m.position.y));
  const next = layoutSnappedGroup([...tiles, newTile], groupId, anchorX, anchorY, boardWidth, boardHeight);

  const count = members.length + 1;
  const net = sample.sign * count;
  const label = formatSummaryToExpression({
    x2: sample.type === 'x2' ? net : 0,
    x: sample.type === 'x' ? net : 0,
    constant: sample.type === '1' ? net : 0,
  });

  return { tiles: next, count, label };
}

export function ungroupTiles(
  tiles: Tile[],
  groupId: string,
  boardWidth = 540,
  boardHeight = 340
): { tiles: Tile[]; count: number } {
  const members = tiles.filter((t) => t.groupId === groupId);
  if (members.length === 0) return { tiles, count: 0 };

  const { width, height } = getTileSize(members[0].type);
  const gapX = 16;
  const gapY = 16;
  const minX = Math.min(...members.map((m) => m.position.x));
  const minY = Math.min(...members.map((m) => m.position.y));

  const maxCols = Math.max(2, Math.floor((boardWidth - 20) / (width + gapX)));
  const cols = Math.min(members.length, maxCols);
  const rows = Math.ceil(members.length / cols);
  const totalW = cols * width + (cols - 1) * gapX;
  const totalH = rows * height + (rows - 1) * gapY;

  const startX = Math.max(12, Math.min(Math.max(12, boardWidth - totalW - 12), minX));
  const startY = Math.max(16, Math.min(Math.max(16, boardHeight - totalH - 12), minY));

  const posById = new Map<string, { x: number; y: number }>();
  members.forEach((m, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    posById.set(m.id, {
      x: Math.round(startX + col * (width + gapX)),
      y: Math.round(startY + row * (height + gapY)),
    });
  });

  const next = tiles.map((t) => {
    const pos = posById.get(t.id);
    if (!pos) return t;
    return { ...t, groupId: null, position: pos };
  });

  return { tiles: next, count: members.length };
}

export function moveGroupByDelta(
  tiles: Tile[],
  groupId: string,
  rawDx: number,
  rawDy: number,
  boardWidth = 540,
  boardHeight = 340
): Tile[] {
  const members = tiles.filter((t) => t.groupId === groupId);
  if (members.length === 0) return tiles;

  const minX = Math.min(...members.map((m) => m.position.x));
  const minY = Math.min(...members.map((m) => m.position.y));
  const maxX = Math.max(...members.map((m) => m.position.x + getTileSize(m.type).width));
  const maxY = Math.max(...members.map((m) => m.position.y + getTileSize(m.type).height));

  const minAllowedDx = 10 - minX;
  const maxAllowedDx = Math.max(minAllowedDx, boardWidth - 10 - maxX);
  const minAllowedDy = 32 - minY;
  const maxAllowedDy = Math.max(minAllowedDy, boardHeight - 10 - maxY);

  const dx = Math.max(minAllowedDx, Math.min(maxAllowedDx, rawDx));
  const dy = Math.max(minAllowedDy, Math.min(maxAllowedDy, rawDy));

  return tiles.map((t) =>
    t.groupId === groupId
      ? { ...t, position: { x: Math.round(t.position.x + dx), y: Math.round(t.position.y + dy) } }
      : t
  );
}

export function relocateGroupToPoint(
  tiles: Tile[],
  groupId: string,
  targetX: number,
  targetY: number,
  boardWidth = 540,
  boardHeight = 340
): Tile[] {
  const members = tiles.filter((t) => t.groupId === groupId);
  if (members.length === 0) return tiles;

  const minX = Math.min(...members.map((m) => m.position.x));
  const minY = Math.min(...members.map((m) => m.position.y));
  const maxX = Math.max(...members.map((m) => m.position.x + getTileSize(m.type).width));
  const maxY = Math.max(...members.map((m) => m.position.y + getTileSize(m.type).height));
  const groupW = maxX - minX;
  const groupH = maxY - minY;

  const desiredX = targetX - groupW / 2;
  const desiredY = targetY - groupH / 2;
  return moveGroupByDelta(tiles, groupId, desiredX - minX, desiredY - minY, boardWidth, boardHeight);
}

export function stackZeroPair(
  tiles: Tile[],
  movingId: string,
  targetId: string,
  boardWidth = 540,
  boardHeight = 340
): { valid: boolean; tiles: Tile[]; zeroPairId?: string; explanation: string } {
  const a = tiles.find((t) => t.id === movingId);
  const b = tiles.find((t) => t.id === targetId);
  if (!a || !b || !canFormZeroPair(a, b)) {
    return {
      valid: false,
      tiles,
      explanation: a && b && a.type !== b.type
        ? `Tidak dapat memasangkan ${getTermLabel(a.type)} dengan ${getTermLabel(b.type)} sebagai Zero Pair karena jenis sukunya berbeda.`
        : 'Zero pair membutuhkan dua ubin sejenis dengan tanda berlawanan (+ dan −).',
    };
  }

  const posTile = a.sign === 1 ? a : b;
  const negTile = a.sign === -1 ? a : b;
  const size = getTileSize(b.type);
  const offsetX = 20;
  const offsetY = 22;

  const baseX = Math.max(14, Math.min(Math.max(14, boardWidth - size.width - offsetX - 14), b.position.x));
  const baseY = Math.max(34, Math.min(Math.max(34, boardHeight - size.height - offsetY - 14), b.position.y));
  const zeroPairId = `zp-${b.type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

  // If either tile belonged to a group, check if any orphan single tile remains in that group and ungroup it
  const affectedGroupIds = new Set(
    [a.groupId, b.groupId].filter((g): g is string => Boolean(g))
  );

  let next = tiles.map((t) => {
    if (t.id === posTile.id) {
      return { ...t, groupId: null, zeroPairId, position: { x: baseX, y: baseY } };
    }
    if (t.id === negTile.id) {
      return { ...t, groupId: null, zeroPairId, position: { x: baseX + offsetX, y: baseY + offsetY } };
    }
    return t;
  });

  // Clean up any 1-member leftover groups
  for (const gid of affectedGroupIds) {
    const remaining = next.filter((t) => t.groupId === gid);
    if (remaining.length === 1) {
      next = next.map((t) => (t.groupId === gid ? { ...t, groupId: null } : t));
    }
  }

  const term = b.type === 'x2' ? 'x²' : b.type;
  return {
    valid: true,
    tiles: next,
    zeroPairId,
    explanation: `Ubin +${term} dan −${term} ditumpuk sebagai Zero Pair! Tekan "Pasangkan Nol" untuk meniadakan (= 0) atau "Pisahkan" untuk memisahkan kembali.`,
  };
}

export function moveZeroPairByDelta(
  tiles: Tile[],
  zeroPairId: string,
  rawDx: number,
  rawDy: number,
  boardWidth = 540,
  boardHeight = 340
): Tile[] {
  const members = tiles.filter((t) => t.zeroPairId === zeroPairId);
  if (members.length === 0) return tiles;

  const minX = Math.min(...members.map((m) => m.position.x));
  const minY = Math.min(...members.map((m) => m.position.y));
  const maxX = Math.max(...members.map((m) => m.position.x + getTileSize(m.type).width));
  const maxY = Math.max(...members.map((m) => m.position.y + getTileSize(m.type).height));

  const minAllowedDx = 10 - minX;
  const maxAllowedDx = Math.max(minAllowedDx, boardWidth - 10 - maxX);
  const minAllowedDy = 32 - minY;
  const maxAllowedDy = Math.max(minAllowedDy, boardHeight - 10 - maxY);

  const dx = Math.max(minAllowedDx, Math.min(maxAllowedDx, rawDx));
  const dy = Math.max(minAllowedDy, Math.min(maxAllowedDy, rawDy));

  return tiles.map((t) =>
    t.zeroPairId === zeroPairId
      ? { ...t, position: { x: Math.round(t.position.x + dx), y: Math.round(t.position.y + dy) } }
      : t
  );
}

export function separateZeroPair(
  tiles: Tile[],
  zeroPairId: string,
  boardWidth = 540,
  boardHeight = 340
): { tiles: Tile[]; explanation: string } {
  const members = tiles.filter((t) => t.zeroPairId === zeroPairId);
  if (members.length === 0) {
    return { tiles, explanation: 'Zero pair tidak ditemukan.' };
  }
  const pos = members.find((t) => t.sign === 1) || members[0];
  const neg = members.find((t) => t.id !== pos.id) || members[1];
  const { width, height } = getTileSize(pos.type);
  const gap = 18;

  const startX = Math.max(12, Math.min(Math.max(12, boardWidth - width * 2 - gap - 12), pos.position.x));
  const startY = Math.max(16, Math.min(Math.max(16, boardHeight - height - 12), pos.position.y));

  const next = tiles.map((t) => {
    if (t.id === pos.id) {
      return { ...t, zeroPairId: null, position: { x: startX, y: startY } };
    }
    if (neg && t.id === neg.id) {
      return { ...t, zeroPairId: null, position: { x: startX + width + gap, y: startY } };
    }
    return t;
  });

  const term = pos.type === 'x2' ? 'x²' : pos.type;
  return {
    tiles: next,
    explanation: `Tumpukan +${term} dan −${term} dipisahkan kembali menjadi dua ubin terpisah.`,
  };
}

export function eliminateZeroPairStack(
  tiles: Tile[],
  zeroPairId: string
): { tiles: Tile[]; removedCount: number; explanation: string } {
  const members = tiles.filter((t) => t.zeroPairId === zeroPairId);
  if (members.length === 0) {
    return { tiles, removedCount: 0, explanation: 'Zero pair tidak ditemukan.' };
  }
  const term = members[0].type === 'x2' ? 'x²' : members[0].type;
  const remaining = tiles.filter((t) => t.zeroPairId !== zeroPairId);
  return {
    tiles: remaining,
    removedCount: 1,
    explanation: `Tepat! Pasangan nol +${term} dan −${term} saling meniadakan (= 0). Ekspresi tersisa: ${formatExpression(
      remaining,
      true
    )}.`,
  };
}
