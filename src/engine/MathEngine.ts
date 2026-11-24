import { ExpressionSummary, Tile, TileSign, TileType } from '../types/algebra';

let tileCounter = 0;

export function createTileId(prefix = 'tile'): string {
  tileCounter += 1;
  return `${prefix}-${Date.now()}-${tileCounter}`;
}

export function isTileActive(tile: Tile): boolean {
  return tile.status !== 'cancelled';
}

export function getActiveTiles(tiles: Tile[]): Tile[] {
  return tiles.filter(isTileActive);
}

export function countTileStatuses(tiles: Tile[]): {
  activeCount: number;
  cancelledCount: number;
} {
  let activeCount = 0;
  let cancelledCount = 0;
  for (const tile of tiles) {
    if (isTileActive(tile)) activeCount += 1;
    else cancelledCount += 1;
  }
  return { activeCount, cancelledCount };
}

export function createTile(
  type: TileType,
  sign: TileSign,
  position = { x: 24, y: 24 },
  groupId: string | null = null
): Tile {
  return {
    id: createTileId(type),
    type,
    sign,
    position,
    status: 'active',
    groupId,
  };
}

export function createTilesFromSpec(
  specs: Array<{ type: TileType; sign: TileSign; count: number }>,
  startX = 28,
  startY = 28,
  maxColumns = 6
): Tile[] {
  const result: Tile[] = [];
  const cols = Math.max(1, maxColumns);
  let col = 0;
  let row = 0;
  for (const spec of specs) {
    for (let i = 0; i < spec.count; i += 1) {
      const x = startX + (col % cols) * 86;
      const y = startY + row * 94;
      result.push(createTile(spec.type, spec.sign, { x, y }));
      col += 1;
      if (col % cols === 0) {
        row += 1;
      }
    }
  }
  return result;
}

export function getTileDimsForLayout(type: TileType): { width: number; height: number } {
  // Original PDF scale: 1 = 2x2cm (36px), x = 5x2cm (90x36px), y = 7x2cm (126x36px)
  if (type === 'y2') return { width: 126, height: 126 };
  if (type === 'xy') return { width: 90, height: 126 };
  if (type === 'x2') return { width: 90, height: 90 };
  if (type === 'y') return { width: 126, height: 36 };
  if (type === 'x') return { width: 90, height: 36 };
  return { width: 36, height: 36 };
}

/**
 * Finds the first non-overlapping visible position on the board for a newly added tile,
 * respecting top badge clearance (y >= 34) and horizontal board bounds so tiles never clip.
 */
export function findNextAvailableTilePosition(
  existingTiles: Tile[],
  type: TileType,
  boardWidth = 640
): { x: number; y: number } {
  const { width, height } = getTileDimsForLayout(type);
  const marginX = 16;
  const startY = 52;
  const usableWidth = Math.max(width + marginX * 2, boardWidth);
  const stepX = Math.max(52, Math.min(136, width + 14));
  const stepY = 52;
  const cols = Math.max(2, Math.floor((usableWidth - marginX * 2 + 12) / stepX));

  const overlapsExisting = (cx: number, cy: number) =>
    existingTiles.some((other) => {
      const os = getTileDimsForLayout(other.type);
      const pad = 8;
      return (
        cx < other.position.x + os.width + pad &&
        cx + width + pad > other.position.x &&
        cy < other.position.y + os.height + pad &&
        cy + height + pad > other.position.y
      );
    });

  const maxRows = Math.max(12, existingTiles.length * 2 + 8);
  for (let row = 0; row < maxRows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const rawX = marginX + col * stepX;
      const x = Math.max(12, Math.min(Math.max(12, usableWidth - width - 12), rawX));
      const y = startY + row * stepY;
      if (!overlapsExisting(x, y)) {
        return { x, y };
      }
    }
  }

  const maxBottom = existingTiles.reduce((maxY, t) => {
    const s = getTileDimsForLayout(t.type);
    return Math.max(maxY, t.position.y + s.height);
  }, startY);
  return { x: marginX, y: maxBottom + 16 };
}

export function summarizeTiles(tiles: Tile[]): ExpressionSummary {
  let posX2 = 0;
  let negX2 = 0;
  let posX = 0;
  let negX = 0;
  let posOne = 0;
  let negOne = 0;
  let posY2 = 0;
  let negY2 = 0;
  let posXY = 0;
  let negXY = 0;
  let posY = 0;
  let negY = 0;

  for (const tile of tiles) {
    if (!isTileActive(tile)) continue;
    if (tile.type === 'x2') {
      if (tile.sign === 1) posX2 += 1;
      else negX2 += 1;
    } else if (tile.type === 'xy') {
      if (tile.sign === 1) posXY += 1;
      else negXY += 1;
    } else if (tile.type === 'y2') {
      if (tile.sign === 1) posY2 += 1;
      else negY2 += 1;
    } else if (tile.type === 'x') {
      if (tile.sign === 1) posX += 1;
      else negX += 1;
    } else if (tile.type === 'y') {
      if (tile.sign === 1) posY += 1;
      else negY += 1;
    } else {
      if (tile.sign === 1) posOne += 1;
      else negOne += 1;
    }
  }

  return {
    x2: posX2 - negX2,
    x: posX - negX,
    constant: posOne - negOne,
    y2: posY2 - negY2,
    xy: posXY - negXY,
    y: posY - negY,
    posX2,
    negX2,
    posX,
    negX,
    posOne,
    negOne,
    posY2,
    negY2,
    posXY,
    negXY,
    posY,
    negY,
  };
}

export function formatSummaryToExpression(
  summary: Pick<ExpressionSummary, 'x2' | 'x' | 'constant'> &
    Partial<Pick<ExpressionSummary, 'y2' | 'xy' | 'y'>>
): string {
  const parts: string[] = [];

  const appendTerm = (coeff: number, symbol: string) => {
    if (coeff === 0) return;
    const abs = Math.abs(coeff);
    const isFirst = parts.length === 0;
    const signStr = coeff > 0 ? (isFirst ? '' : ' + ') : isFirst ? '−' : ' − ';

    if (symbol === '') {
      parts.push(`${signStr}${abs}`);
    } else {
      parts.push(`${signStr}${abs === 1 ? '' : abs}${symbol}`);
    }
  };

  appendTerm(summary.x2, 'x²');
  appendTerm(summary.xy ?? 0, 'xy');
  appendTerm(summary.y2 ?? 0, 'y²');
  appendTerm(summary.x, 'x');
  appendTerm(summary.y ?? 0, 'y');
  appendTerm(summary.constant, '');

  return parts.length === 0 ? '0' : parts.join('');
}

export function formatRawExpression(tiles: Tile[]): string {
  const active = getActiveTiles(tiles);
  if (active.length === 0) return '0';
  const summary = summarizeTiles(active);
  const chunks: string[] = [];

  const pushChunk = (count: number, sign: '+' | '−', label: string) => {
    if (count <= 0) return;
    const isFirst = chunks.length === 0;
    const termText = label === '1' ? `${count}` : `${count === 1 ? '' : count}${label}`;
    if (isFirst) {
      chunks.push(sign === '+' ? termText : `−${termText}`);
    } else {
      chunks.push(sign === '+' ? `+ ${termText}` : `− ${termText}`);
    }
  };

  pushChunk(summary.posX2, '+', 'x²');
  pushChunk(summary.negX2, '−', 'x²');
  pushChunk(summary.posXY, '+', 'xy');
  pushChunk(summary.negXY, '−', 'xy');
  pushChunk(summary.posY2, '+', 'y²');
  pushChunk(summary.negY2, '−', 'y²');
  pushChunk(summary.posX, '+', 'x');
  pushChunk(summary.negX, '−', 'x');
  pushChunk(summary.posY, '+', 'y');
  pushChunk(summary.negY, '−', 'y');
  pushChunk(summary.posOne, '+', '1');
  pushChunk(summary.negOne, '−', '1');

  return chunks.join(' ');
}

export function formatExpression(tiles: Tile[], simplified = true): string {
  const active = getActiveTiles(tiles);
  if (active.length === 0) return '0';
  if (!simplified) {
    return formatRawExpression(active);
  }
  const summary = summarizeTiles(active);
  return formatSummaryToExpression(summary);
}

export function canFormZeroPair(a: Tile, b: Tile): boolean {
  return (
    isTileActive(a) &&
    isTileActive(b) &&
    a.id !== b.id &&
    a.type === b.type &&
    a.sign === -b.sign
  );
}

export function findZeroPairs(tiles: Tile[]): Array<[Tile, Tile]> {
  const active = getActiveTiles(tiles);
  const pairs: Array<[Tile, Tile]> = [];
  const usedIds = new Set<string>();
  const types: TileType[] = ['x2', 'xy', 'y2', 'x', 'y', '1'];

  for (const type of types) {
    const positives = active.filter((t) => t.type === type && t.sign === 1 && !usedIds.has(t.id));
    const negatives = active.filter((t) => t.type === type && t.sign === -1 && !usedIds.has(t.id));

    // 1. Prioritize pairs already stacked together with the same zeroPairId
    for (const pos of positives) {
      if (!pos.zeroPairId || usedIds.has(pos.id)) continue;
      const partner = negatives.find(
        (neg) => !usedIds.has(neg.id) && neg.zeroPairId === pos.zeroPairId
      );
      if (partner) {
        usedIds.add(pos.id);
        usedIds.add(partner.id);
        pairs.push([pos, partner]);
      }
    }

    // 2. Match remaining active units across all groups / standalone tiles
    const remPos = positives.filter((t) => !usedIds.has(t.id));
    const remNeg = negatives.filter((t) => !usedIds.has(t.id));
    const pairCount = Math.min(remPos.length, remNeg.length);
    for (let i = 0; i < pairCount; i += 1) {
      usedIds.add(remPos[i].id);
      usedIds.add(remNeg[i].id);
      pairs.push([remPos[i], remNeg[i]]);
    }
  }

  return pairs;
}

export function getTermSymbol(type: TileType): string {
  if (type === 'x2') return 'x²';
  if (type === 'y2') return 'y²';
  return type;
}

export interface ZeroPairEliminationResult {
  remainingTiles: Tile[];
  activeTiles: Tile[];
  removedPairs: Array<[Tile, Tile]>;
  removedCount: number;
  explanation: string;
}

export interface EliminateZeroPairsOptions {
  boardWidth?: number;
  boardHeight?: number;
  targetTileIds?: string[];
}

interface BoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rectsOverlapWithPad(a: BoxRect, b: BoxRect, pad = 0): boolean {
  return (
    a.x < b.x + b.width + pad &&
    a.x + a.width + pad > b.x &&
    a.y < b.y + b.height + pad &&
    a.y + a.height + pad > b.y
  );
}

function isInsideZoomControlZone(box: BoxRect, boardWidth: number): boolean {
  const zoomZoneWidth = boardWidth < 640 ? 176 : 230;
  return box.y < 52 && box.x + box.width > boardWidth - zoomZoneWidth;
}

function findCleanStandalonePosition(
  tile: Tile,
  occupiedBoxes: BoxRect[],
  cancelledBoxes: BoxRect[],
  boardWidth: number,
  boardHeight: number,
  cameFromAffectedGroup: boolean
): { x: number; y: number } {
  const dims = getTileDimsForLayout(tile.type);
  const safeBoardW = Math.max(dims.width + 24, boardWidth);
  const maxX = Math.max(12, safeBoardW - dims.width - 12);
  const minY = 38;

  const isCleanSpot = (cx: number, cy: number) => {
    if (cx < 12 || cx > maxX || cy < minY) return false;
    const candidate: BoxRect = { x: cx, y: cy, width: dims.width, height: dims.height };
    if (isInsideZoomControlZone(candidate, safeBoardW)) return false;
    if (occupiedBoxes.some((b) => rectsOverlapWithPad(candidate, b, 12))) return false;
    if (cameFromAffectedGroup && cancelledBoxes.some((b) => rectsOverlapWithPad(candidate, b, 16))) {
      return false;
    }
    return true;
  };

  if (isCleanSpot(tile.position.x, tile.position.y)) {
    return tile.position;
  }

  const maxCancelledBottom = cancelledBoxes.reduce(
    (maxB, b) => Math.max(maxB, b.y + b.height),
    minY
  );
  const maxOccupiedBottom = occupiedBoxes.reduce(
    (maxB, b) => Math.max(maxB, b.y + b.height),
    minY
  );
  const preferredRowY = Math.max(minY, Math.round(tile.position.y));
  const belowCancelledY = Math.max(minY, Math.round(maxCancelledBottom + 24));
  const belowOccupiedY = Math.max(minY, Math.round(maxOccupiedBottom + 20));
  const candidateRows = Array.from(
    new Set([
      preferredRowY,
      belowCancelledY,
      belowOccupiedY,
      ...Array.from({ length: 24 }, (_, idx) => minY + idx * 28),
    ])
  );

  for (const ry of candidateRows) {
    // Try near original x first, then scan left-to-right
    const clampedOriginX = Math.max(12, Math.min(maxX, Math.round(tile.position.x)));
    if (isCleanSpot(clampedOriginX, ry)) {
      return { x: clampedOriginX, y: ry };
    }
    for (let rx = 12; rx <= maxX; rx += 24) {
      if (isCleanSpot(rx, ry)) {
        return { x: rx, y: ry };
      }
    }
  }

  return {
    x: 16,
    y: Math.max(boardHeight - dims.height - 16, maxCancelledBottom + 28, maxOccupiedBottom + 20),
  };
}

function layoutCleanRemainderGroup(
  members: Tile[],
  occupiedBoxes: BoxRect[],
  cancelledBoxes: BoxRect[],
  boardWidth: number
): Map<string, { x: number; y: number }> {
  const dims = getTileDimsForLayout(members[0].type);
  const safeBoardW = Math.max(dims.width + 24, boardWidth);
  const gapX = 6;
  const gapY = 8;
  const maxPerRow = Math.max(1, Math.floor((safeBoardW - 28) / (dims.width + gapX)));
  const cols = Math.min(members.length, maxPerRow);
  const rows = Math.ceil(members.length / cols);
  const totalW = cols * dims.width + (cols - 1) * gapX;
  const totalH = rows * dims.height + (rows - 1) * gapY;
  const maxX = Math.max(12, safeBoardW - totalW - 12);
  const minY = 40; // leaves room for the group badge above

  const isCleanGroupRect = (sx: number, sy: number) => {
    if (sx < 12 || sx > maxX || sy < minY) return false;
    const bodyRect: BoxRect = { x: sx, y: sy, width: totalW, height: totalH };
    // Include top badge headroom (28px above) so badge never collides with cancelled/active tiles
    const withBadgeRect: BoxRect = {
      x: sx - 4,
      y: sy - 28,
      width: totalW + 8,
      height: totalH + 32,
    };
    if (isInsideZoomControlZone(withBadgeRect, safeBoardW)) return false;
    if (occupiedBoxes.some((b) => rectsOverlapWithPad(withBadgeRect, b, 10))) return false;
    if (cancelledBoxes.some((b) => rectsOverlapWithPad(bodyRect, b, 16))) return false;
    return true;
  };

  const anchorX = Math.max(12, Math.min(maxX, Math.min(...members.map((m) => m.position.x))));
  const anchorY = Math.max(minY, Math.min(...members.map((m) => m.position.y)));
  const maxCancelledBottom = cancelledBoxes.reduce(
    (maxB, b) => Math.max(maxB, b.y + b.height),
    minY
  );
  const maxOccupiedBottom = occupiedBoxes.reduce(
    (maxB, b) => Math.max(maxB, b.y + b.height),
    minY
  );
  const belowCancelledY = Math.max(minY, Math.round(maxCancelledBottom + 36));
  const belowOccupiedY = Math.max(minY, Math.round(maxOccupiedBottom + 36));

  let chosenX = anchorX;
  let chosenY = Math.max(belowCancelledY, belowOccupiedY);
  let found = false;

  const candidateRows = Array.from(
    new Set([
      Math.round(anchorY),
      belowCancelledY,
      belowOccupiedY,
      ...Array.from({ length: 28 }, (_, idx) => minY + idx * 24),
    ])
  );

  for (const ry of candidateRows) {
    if (isCleanGroupRect(anchorX, ry)) {
      chosenX = anchorX;
      chosenY = ry;
      found = true;
      break;
    }
    for (let rx = 12; rx <= maxX; rx += 20) {
      if (isCleanGroupRect(rx, ry)) {
        chosenX = rx;
        chosenY = ry;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  const posById = new Map<string, { x: number; y: number }>();
  members.forEach((m, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    posById.set(m.id, {
      x: Math.round(chosenX + col * (dims.width + gapX)),
      y: Math.round(chosenY + row * (dims.height + gapY)),
    });
  });

  return posById;
}

export function eliminateZeroPairs(
  tiles: Tile[],
  options: EliminateZeroPairsOptions = {}
): ZeroPairEliminationResult {
  const boardWidth = options.boardWidth ?? 540;
  const boardHeight = options.boardHeight ?? 340;
  const scopedSet = options.targetTileIds?.length ? new Set(options.targetTileIds) : null;
  const candidateTiles = scopedSet
    ? tiles.filter((t) => scopedSet.has(t.id) && isTileActive(t))
    : tiles;

  const pairs = findZeroPairs(candidateTiles);
  if (pairs.length === 0) {
    return {
      remainingTiles: tiles,
      activeTiles: getActiveTiles(tiles),
      removedPairs: [],
      removedCount: 0,
      explanation:
        'No active zero pairs can be formed yet. A zero pair requires two active tiles of the exact same term type with opposite signs (such as +x with −x, or +y with −y).',
    };
  }

  const pairTagById = new Map<string, string>();
  const affectedGroupIds = new Set<string>();
  const cancelledZeroPairIds = new Set<string>();
  const affectedTypeSigns = new Set<string>();

  pairs.forEach(([a, b], idx) => {
    const tag =
      a.zeroPairId && a.zeroPairId === b.zeroPairId
        ? a.zeroPairId
        : `cancelled-zp-${a.type}-${Date.now()}-${idx}`;
    pairTagById.set(a.id, tag);
    pairTagById.set(b.id, tag);

    if (a.groupId) affectedGroupIds.add(a.groupId);
    if (b.groupId) affectedGroupIds.add(b.groupId);
    if (a.zeroPairId) cancelledZeroPairIds.add(a.zeroPairId);
    if (b.zeroPairId) cancelledZeroPairIds.add(b.zeroPairId);
    affectedTypeSigns.add(`${a.type}:${a.sign}`);
    affectedTypeSigns.add(`${b.type}:${b.sign}`);
  });

  // 1. Mark ONLY matched units as cancelled and remove them from any active group
  const afterCancel: Tile[] = tiles.map((t) => {
    const tag = pairTagById.get(t.id);
    if (tag) {
      return {
        ...t,
        status: 'cancelled' as const,
        groupId: null,
        zeroPairId: tag,
      };
    }
    if (t.zeroPairId && cancelledZeroPairIds.has(t.zeroPairId) && isTileActive(t)) {
      return { ...t, zeroPairId: null };
    }
    return t;
  });

  // 2. Identify active remainders that must be detached / regrouped cleanly
  const detachedUnitIds = new Set<string>();
  const remainderBuckets = new Map<string, Tile[]>();

  // Count how many ungrouped active tiles exist per affected type:sign
  const ungroupedByAffectedTypeSign = new Map<string, Tile[]>();
  for (const t of afterCancel) {
    if (!isTileActive(t)) continue;
    const tsKey = `${t.type}:${t.sign}`;
    if (t.groupId && affectedGroupIds.has(t.groupId)) {
      detachedUnitIds.add(t.id);
      const list = remainderBuckets.get(`grp:${t.groupId}:${tsKey}`) || [];
      list.push(t);
      remainderBuckets.set(`grp:${t.groupId}:${tsKey}`, list);
    } else if (!t.groupId && affectedTypeSigns.has(tsKey)) {
      const list = ungroupedByAffectedTypeSign.get(tsKey) || [];
      list.push(t);
      ungroupedByAffectedTypeSign.set(tsKey, list);
    }
  }

  for (const [tsKey, list] of ungroupedByAffectedTypeSign.entries()) {
    if (list.length >= 2) {
      for (const t of list) detachedUnitIds.add(t.id);
      remainderBuckets.set(`ungrouped:${tsKey}`, list);
    } else if (list.length === 1) {
      // Single ungrouped remainder stays standalone; check overlap only if near cancelled tiles
      detachedUnitIds.add(list[0].id);
      remainderBuckets.set(`ungrouped:${tsKey}`, list);
    }
  }

  // Merge remainder buckets of the same type:sign when they came from affected groups/ungrouped tiles
  const mergedRemaindersByTypeSign = new Map<string, { members: Tile[]; cameFromGroup: boolean }>();
  for (const list of remainderBuckets.values()) {
    if (list.length === 0) continue;
    const tsKey = `${list[0].type}:${list[0].sign}`;
    const existing = mergedRemaindersByTypeSign.get(tsKey);
    const hasGroupOrigin = list.some((t) => Boolean(t.groupId && affectedGroupIds.has(t.groupId)));
    if (existing) {
      existing.members.push(...list);
      existing.cameFromGroup = existing.cameFromGroup || hasGroupOrigin;
    } else {
      mergedRemaindersByTypeSign.set(tsKey, { members: [...list], cameFromGroup: hasGroupOrigin });
    }
  }

  // Fixed boxes = all cancelled tiles + unaffected active tiles
  const cancelledBoxes: BoxRect[] = afterCancel
    .filter((t) => !isTileActive(t))
    .map((t) => ({ ...t.position, ...getTileDimsForLayout(t.type) }));

  const occupiedBoxes: BoxRect[] = afterCancel
    .filter((t) => !isTileActive(t) || !detachedUnitIds.has(t.id))
    .map((t) => ({ ...t.position, ...getTileDimsForLayout(t.type) }));

  const updatedTileById = new Map<string, Tile>();

  for (const { members, cameFromGroup } of mergedRemaindersByTypeSign.values()) {
    if (members.length === 1) {
      const solo = members[0];
      const nextPos = findCleanStandalonePosition(
        solo,
        occupiedBoxes,
        cancelledBoxes,
        boardWidth,
        boardHeight,
        cameFromGroup || Boolean(solo.groupId)
      );
      const dims = getTileDimsForLayout(solo.type);
      occupiedBoxes.push({ x: nextPos.x, y: nextPos.y, ...dims });
      updatedTileById.set(solo.id, {
        ...solo,
        status: 'active',
        groupId: null,
        zeroPairId: null,
        position: nextPos,
      });
    } else if (members.length >= 2) {
      const newGroupId = createTileId('grp-rem');
      const posMap = layoutCleanRemainderGroup(members, occupiedBoxes, cancelledBoxes, boardWidth);
      const dims = getTileDimsForLayout(members[0].type);
      for (const m of members) {
        const nextPos = posMap.get(m.id) || m.position;
        occupiedBoxes.push({ x: nextPos.x, y: nextPos.y, ...dims });
        updatedTileById.set(m.id, {
          ...m,
          status: 'active',
          groupId: newGroupId,
          zeroPairId: null,
          position: nextPos,
        });
      }
    }
  }

  const remainingTiles: Tile[] = afterCancel.map((t) => updatedTileById.get(t.id) || t);
  const activeTiles = getActiveTiles(remainingTiles);
  const pairLabels = pairs.map(([a]) => {
    const term = getTermSymbol(a.type);
    return `+${term} + (−${term}) = 0`;
  });

  return {
    remainingTiles,
    activeTiles,
    removedPairs: pairs,
    removedCount: pairs.length,
    explanation: `Nice! ${pairs.length} zero pair(s) cancelled out (${Array.from(
      new Set(pairLabels)
    ).join(', ')}). Cancelled pairs appear faded and are no longer counted in the expression (${formatExpression(
      remainingTiles,
      true
    )}).`,
  };
}

export function eliminateSpecificZeroPair(
  tiles: Tile[],
  tileAId: string,
  tileBId: string
): ZeroPairEliminationResult {
  const tileA = tiles.find((t) => t.id === tileAId);
  const tileB = tiles.find((t) => t.id === tileBId);

  if (!tileA || !tileB || !canFormZeroPair(tileA, tileB)) {
    return {
      remainingTiles: tiles,
      activeTiles: getActiveTiles(tiles),
      removedPairs: [],
      removedCount: 0,
      explanation:
        'These two tiles cannot form an active zero pair. Zero pairs only apply to two active tiles of the same term type with opposite signs (+ and −).',
    };
  }

  const tag = `cancelled-zp-${tileA.type}-${Date.now()}`;
  const remainingTiles: Tile[] = tiles.map((t) =>
    t.id === tileAId || t.id === tileBId
      ? { ...t, status: 'cancelled' as const, groupId: null, zeroPairId: tag }
      : t
  );
  const activeTiles = getActiveTiles(remainingTiles);
  const term = getTermSymbol(tileA.type);

  return {
    remainingTiles,
    activeTiles,
    removedPairs: [[tileA, tileB]],
    removedCount: 1,
    explanation: `Nice! Zero pair +${term} and −${term} cancelled out (= 0). Both tiles are now faded and no longer counted; remaining active expression: ${formatExpression(
      remainingTiles,
      true
    )}.`,
  };
}

export function clearCancelledZeroPairs(tiles: Tile[]): {
  remainingTiles: Tile[];
  clearedCount: number;
  activeExpression: string;
  explanation: string;
} {
  const remainingTiles = tiles.filter(isTileActive);
  const clearedCount = tiles.length - remainingTiles.length;
  const activeExpression = formatExpression(remainingTiles, true);

  return {
    remainingTiles,
    clearedCount,
    activeExpression,
    explanation:
      clearedCount > 0
        ? `Cleared ${clearedCount} faded zero-pair tile(s) from the workspace. Active expression remains ${activeExpression}.`
        : 'There are no faded tiles to clear.',
  };
}

export interface TileClusterBadge {
  id: string;
  label: string;
  x: number;
  y: number;
  type: TileType;
  sign: TileSign;
  count: number;
}

export function formatSingleTermSummary(type: TileType, net: number): string {
  return formatSummaryToExpression({
    x2: type === 'x2' ? net : 0,
    x: type === 'x' ? net : 0,
    constant: type === '1' ? net : 0,
    y2: type === 'y2' ? net : 0,
    xy: type === 'xy' ? net : 0,
    y: type === 'y' ? net : 0,
  });
}

/**
 * Finds groups of >= 2 tiles with the same type & sign that share a groupId
 * or sit closely together, so the workspace can display helpful group totals (e.g. "2x", "3y", "2xy").
 */
export function computeTileClusters(tiles: Tile[]): TileClusterBadge[] {
  const byGroup = new Map<string, Tile[]>();

  for (const tile of tiles) {
    if (!isTileActive(tile) || !tile.groupId) continue;
    const list = byGroup.get(tile.groupId) || [];
    list.push(tile);
    byGroup.set(tile.groupId, list);
  }

  const badges: TileClusterBadge[] = [];
  for (const [groupId, members] of byGroup.entries()) {
    if (members.length < 2) continue;
    const first = members[0];
    const allSame = members.every((m) => m.type === first.type && m.sign === first.sign);
    if (!allSame) continue;

    const minX = Math.min(...members.map((m) => m.position.x));
    const minY = Math.min(...members.map((m) => m.position.y));
    const net = first.sign * members.length;
    const label = formatSingleTermSummary(first.type, net);

    badges.push({
      id: groupId,
      label,
      x: minX,
      y: Math.max(4, minY - 22),
      type: first.type,
      sign: first.sign,
      count: members.length,
    });
  }

  return badges;
}

export interface LikeTermValidationResult {
  valid: boolean;
  termType?: TileType;
  resultExpression?: string;
  reason: string;
}

export function getTermLabel(type: TileType): string {
  if (type === 'x2') return 'x² (quadratic x-term)';
  if (type === 'xy') return 'xy (cross-variable term)';
  if (type === 'y2') return 'y² (quadratic y-term)';
  if (type === 'x') return 'x (linear x-term)';
  if (type === 'y') return 'y (linear y-term)';
  return '1 (constant)';
}

export function canCombineLikeTerms(tiles: Tile[]): LikeTermValidationResult {
  const active = getActiveTiles(tiles);
  if (active.length === 0) {
    return {
      valid: false,
      reason: 'Select or place active tiles first before combining.',
    };
  }

  const distinctTypes = Array.from(new Set(active.map((t) => t.type)));
  if (distinctTypes.length > 1) {
    const typeNames = distinctTypes.map(getTermLabel).join(' and ');
    return {
      valid: false,
      reason: `Cannot combine as like terms! ${typeNames} represent unlike terms. Only tiles with the exact same term type can be combined.`,
    };
  }

  const onlyType = distinctTypes[0];
  const summary = summarizeTiles(active);
  const net =
    onlyType === 'x2'
      ? summary.x2
      : onlyType === 'xy'
      ? summary.xy
      : onlyType === 'y2'
      ? summary.y2
      : onlyType === 'x'
      ? summary.x
      : onlyType === 'y'
      ? summary.y
      : summary.constant;
  const resultExpr = formatSingleTermSummary(onlyType, net);

  return {
    valid: true,
    termType: onlyType,
    resultExpression: resultExpr,
    reason: `Correct! All selected active tiles are like terms (${getTermLabel(
      onlyType
    )}), combining to ${resultExpr}.`,
  };
}

export function groupTilesByTerm(tiles: Tile[], workspaceWidth = 620): Tile[] {
  const order: Array<{ type: TileType; sign: TileSign }> = [
    { type: 'x2', sign: 1 },
    { type: 'x2', sign: -1 },
    { type: 'xy', sign: 1 },
    { type: 'xy', sign: -1 },
    { type: 'y2', sign: 1 },
    { type: 'y2', sign: -1 },
    { type: 'x', sign: 1 },
    { type: 'x', sign: -1 },
    { type: 'y', sign: 1 },
    { type: 'y', sign: -1 },
    { type: '1', sign: 1 },
    { type: '1', sign: -1 },
  ];

  const activeTiles = getActiveTiles(tiles);
  const cancelledTiles = tiles.filter((t) => !isTileActive(t));
  const grouped: Tile[] = [];
  let cursorX = 24;
  let cursorY = 52;
  let currentRowHeight = 48;

  for (const bucket of order) {
    const matching = activeTiles.filter((t) => t.type === bucket.type && t.sign === bucket.sign);
    if (matching.length === 0) continue;

    const dims = getTileDimsForLayout(bucket.type);
    const stepX = dims.width + 8;

    if (cursorX > 24 && cursorX + Math.min(matching.length, 2) * stepX > workspaceWidth) {
      cursorX = 24;
      cursorY += currentRowHeight + 28;
      currentRowHeight = dims.height;
    } else {
      currentRowHeight = Math.max(currentRowHeight, dims.height);
    }

    const assignGroupId = matching.length >= 2 ? `${bucket.type}-${bucket.sign}` : null;
    for (const tile of matching) {
      if (cursorX > 24 && cursorX + dims.width > workspaceWidth - 12) {
        cursorX = 24;
        cursorY += currentRowHeight + 28;
        currentRowHeight = dims.height;
      } else {
        currentRowHeight = Math.max(currentRowHeight, dims.height);
      }
      grouped.push({
        ...tile,
        status: 'active',
        groupId: assignGroupId,
        zeroPairId: null,
        position: { x: cursorX, y: cursorY },
      });
      cursorX += stepX;
    }
    cursorX += 18;
  }

  return [...grouped, ...cancelledTiles];
}

export function explainWorkspace(tiles: Tile[]): string {
  const { activeCount, cancelledCount } = countTileStatuses(tiles);
  if (activeCount === 0) {
    if (cancelledCount > 0) {
      return `All ${cancelledCount} tile(s) on the board are cancelled (faded) zero pairs, so the active expression equals 0.`;
    }
    return 'The workspace is empty (value 0). Pick tiles from the Tile Palette to build an algebraic expression.';
  }

  const summary = summarizeTiles(tiles);
  const raw = formatRawExpression(tiles);
  const simplified = formatExpression(tiles, true);
  const pairs = findZeroPairs(tiles);

  const details: string[] = [];
  if (summary.posX2 + summary.negX2 > 0) {
    details.push(`x² term: ${summary.posX2} positive, ${summary.negX2} negative (net ${summary.x2}x²)`);
  }
  if (summary.posXY + summary.negXY > 0) {
    details.push(`xy term: ${summary.posXY} positive, ${summary.negXY} negative (net ${summary.xy}xy)`);
  }
  if (summary.posY2 + summary.negY2 > 0) {
    details.push(`y² term: ${summary.posY2} positive, ${summary.negY2} negative (net ${summary.y2}y²)`);
  }
  if (summary.posX + summary.negX > 0) {
    details.push(`x term: ${summary.posX} positive, ${summary.negX} negative (net ${summary.x}x)`);
  }
  if (summary.posY + summary.negY > 0) {
    details.push(`y term: ${summary.posY} positive, ${summary.negY} negative (net ${summary.y}y)`);
  }
  if (summary.posOne + summary.negOne > 0) {
    details.push(`Constant: ${summary.posOne} positive (+1), ${summary.negOne} negative (−1) (net ${summary.constant})`);
  }

  let pairNote = '';
  if (pairs.length > 0) {
    pairNote = ` Found ${pairs.length} active zero pair(s) that can cancel out.`;
  }
  if (cancelledCount > 0) {
    pairNote += ` (${cancelledCount} faded zero-pair tile(s) are no longer counted.)`;
  }

  if (raw !== simplified) {
    return `The active tiles represent ${raw}. After combining like terms and zero pairs, the simplified expression is ${simplified}. (${details.join('; ')}.${pairNote})`;
  }

  return `The active tiles represent ${simplified}. (${details.join('; ')}.${pairNote})`;
}

export function explainSubtractionAsOpposite(
  termType: TileType,
  count: number
): string {
  const symbol = getTermSymbol(termType);
  const qty = count === 1 && termType !== '1' ? symbol : `${count}${termType === '1' ? '' : symbol}`;
  return `Subtracting ${qty} is equivalent to adding its opposite: ${count} × −${symbol} tile(s).`;
}

export function areExpressionsEquivalent(
  tiles: Tile[],
  target: {
    x2: number;
    x: number;
    constant: number;
    y2?: number;
    xy?: number;
    y?: number;
  },
  requireNoZeroPairs = false
): { valid: boolean; reason: string } {
  const summary = summarizeTiles(tiles);
  const zeroPairs = findZeroPairs(tiles);

  const algebraMatches =
    summary.x2 === target.x2 &&
    summary.x === target.x &&
    summary.constant === target.constant &&
    summary.y2 === (target.y2 ?? 0) &&
    summary.xy === (target.xy ?? 0) &&
    summary.y === (target.y ?? 0);

  if (!algebraMatches) {
    return {
      valid: false,
      reason: `Current expression is ${formatSummaryToExpression(
        summary
      )}, while the target is ${formatSummaryToExpression(target)}. Check the tile count and signs for each term.`,
    };
  }

  if (requireNoZeroPairs && zeroPairs.length > 0) {
    return {
      valid: false,
      reason: `The expression value is equivalent (${formatSummaryToExpression(
        target
      )}), but there are still ${zeroPairs.length} uncancelled zero pair(s). Click "Match Zero Pairs" to simplify.`,
    };
  }

  return {
    valid: true,
    reason: `Spot on! Your tiles accurately represent ${formatSummaryToExpression(target)}.`,
  };
}
