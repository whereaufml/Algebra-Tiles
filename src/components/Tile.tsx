import React from 'react';
import { Tile as TileModel, TileSign, TileStatus, TileType } from '../types/algebra';
import { getTermSymbol, getTileDimsForLayout } from '../engine/MathEngine';

interface TileVisualProps {
  type: TileType;
  sign: TileSign;
  status?: TileStatus;
  selected?: boolean;
  zeroPairHighlight?: boolean;
  groupHighlight?: boolean;
  stackRole?: 'back' | 'front' | null;
  compact?: boolean;
  touchActionNone?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerEnter?: (e: React.PointerEvent) => void;
  onPointerLeave?: (e: React.PointerEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export function getTileLabel(type: TileType, sign: TileSign): string {
  const s = sign === 1 ? '+' : '−';
  return `${s}${getTermSymbol(type)}`;
}

export function getTileDimensions(type: TileType, compact = false): { width: number; height: number } {
  if (compact) {
    if (type === 'y2') return { width: 54, height: 54 };
    if (type === 'xy') return { width: 40, height: 54 };
    if (type === 'x2') return { width: 44, height: 44 };
    if (type === 'y') return { width: 68, height: 26 };
    if (type === 'x') return { width: 56, height: 26 };
    return { width: 28, height: 28 };
  }
  return getTileDimsForLayout(type);
}

export function getTileColors(type: TileType, sign: TileSign): {
  fill: string;
  rgb: string;
  stroke: string;
  badgeText: string;
  signColor: string;
} {
  // Original Algebra Cards & Tiles PDF palette
  const palette: Record<
    TileType,
    { fill: string; paleFill: string; rgb: string; stroke: string; posText: string; signColor: string }
  > = {
    x2: {
      fill: '#2D6DF6',
      paleFill: '#DBE6FE',
      rgb: '45, 109, 246',
      stroke: '#1D4ED8',
      posText: '#FFFFFF',
      signColor: '#2D6DF6',
    },
    x: {
      fill: '#0CA789',
      paleFill: '#D4F3EC',
      rgb: '12, 167, 137',
      stroke: '#077D66',
      posText: '#FFFFFF',
      signColor: '#0CA789',
    },
    '1': {
      fill: '#F6C431',
      paleFill: '#FEF3C7',
      rgb: '246, 196, 49',
      stroke: '#C99708',
      posText: '#1E293B',
      signColor: '#B45309',
    },
    y: {
      fill: '#6C4CF6',
      paleFill: '#E7E0FE',
      rgb: '108, 76, 246',
      stroke: '#4E31C9',
      posText: '#FFFFFF',
      signColor: '#6C4CF6',
    },
    xy: {
      fill: '#EC3B93',
      paleFill: '#FCDCEB',
      rgb: '236, 59, 147',
      stroke: '#BD1B6B',
      posText: '#FFFFFF',
      signColor: '#EC3B93',
    },
    y2: {
      fill: '#F98E13',
      paleFill: '#FDE8CD',
      rgb: '249, 142, 19',
      stroke: '#C46304',
      posText: '#FFFFFF',
      signColor: '#EA580C',
    },
  };

  const entry = palette[type];
  if (sign === 1) {
    return {
      fill: entry.fill,
      rgb: entry.rgb,
      stroke: entry.stroke,
      badgeText: entry.posText,
      signColor: entry.signColor,
    };
  }

  return {
    fill: entry.paleFill,
    rgb: entry.rgb,
    stroke: '#D64545',
    badgeText: '#B91C1C',
    signColor: '#D64545',
  };
}

export const TileVisual: React.FC<TileVisualProps> = ({
  type,
  sign,
  status = 'active',
  selected = false,
  zeroPairHighlight = false,
  groupHighlight = false,
  stackRole = null,
  compact = false,
  touchActionNone = false,
  onClick,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  className = '',
  style,
  ariaLabel,
}) => {
  const rawPatternId = React.useId();
  const stripePatternId = `neg-stripes-${rawPatternId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { width, height } = getTileDimensions(type, compact);
  const { fill, rgb, stroke, badgeText, signColor } = getTileColors(type, sign);
  const fullLabel = getTileLabel(type, sign);
  const centerLabel = sign === 1 ? getTermSymbol(type) : fullLabel;
  const rx = compact ? 6 : 8;
  const isBackStack = stackRole === 'back';
  const isCancelled = status === 'cancelled';
  const isNegative = sign === -1;

  const rectFill = isCancelled
    ? isNegative
      ? `rgba(${rgb}, 0.11)`
      : `rgba(${rgb}, 0.16)`
    : fill;
  const rectStroke = isCancelled
    ? isNegative
      ? 'rgba(214, 69, 69, 0.48)'
      : 'rgba(100, 116, 139, 0.5)'
    : stroke;
  const textFill = isCancelled
    ? isNegative
      ? 'rgba(153, 27, 27, 0.74)'
      : 'rgba(51, 65, 85, 0.76)'
    : badgeText;

  const showCornerSignBadge = !compact && !isBackStack;
  const badgeRadius = type === '1' ? 4.5 : 5.5;
  const badgeCenter = type === '1' ? 8 : 9.5;
  const fontSize = isBackStack
    ? 12
    : compact
    ? type === '1'
      ? 11
      : 12
    : type === 'y2' || type === 'x2'
    ? 18
    : type === 'xy'
    ? 17
    : type === '1'
    ? 14
    : 15;

  return (
    <button
      type="button"
      data-tile-status={isCancelled ? 'cancelled' : 'active'}
      data-tile-type={type}
      data-tile-sign={isNegative ? 'negative' : 'positive'}
      onClick={onClick}
      onPointerDown={isCancelled ? undefined : onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      aria-label={
        ariaLabel ||
        (isCancelled
          ? `${fullLabel} tile (cancelled as zero pair, not counted)`
          : `${fullLabel} tile`)
      }
      aria-pressed={selected}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        touchAction: !isCancelled && touchActionNone ? 'none' : undefined,
        transition: 'all 260ms ease',
        ...style,
      }}
      className={`group relative inline-flex items-center justify-center select-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39286F] ${
        isCancelled
          ? selected
            ? 'cursor-pointer ring-2 ring-slate-500/80 ring-offset-1'
            : 'cursor-pointer'
          : selected
          ? 'ring-3 ring-[#39286F] ring-offset-2 scale-[1.03]'
          : 'hover:scale-[1.02]'
      } ${!isCancelled && zeroPairHighlight ? 'ring-3 ring-[#F4C95D] ring-offset-1' : ''} ${
        !isCancelled && groupHighlight ? 'ring-3 ring-[#27A89A] ring-offset-2' : ''
      } ${!isCancelled && stackRole === 'front' ? 'ring-2 ring-white shadow-md' : ''} ${className}`}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={`block pointer-events-none ${isCancelled ? '' : 'drop-shadow-xs'}`}
        aria-hidden="true"
      >
        {isNegative && (
          <defs>
            <pattern
              id={stripePatternId}
              width={7}
              height={7}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={7}
                stroke="#DC2626"
                strokeWidth={isCancelled ? 1.8 : 2.2}
                strokeOpacity={isCancelled ? 0.18 : 0.34}
              />
            </pattern>
          </defs>
        )}
        <rect
          x={1.5}
          y={1.5}
          width={width - 3}
          height={height - 3}
          rx={rx}
          fill={rectFill}
          stroke={rectStroke}
          strokeWidth={isCancelled ? 1.5 : 2}
          strokeDasharray={isCancelled ? '4 3' : undefined}
          style={{ transition: 'fill 260ms ease, stroke 260ms ease' }}
        />
        {isNegative && (
          <rect
            x={2}
            y={2}
            width={width - 4}
            height={height - 4}
            rx={Math.max(4, rx - 1)}
            fill={`url(#${stripePatternId})`}
          />
        )}
        {!isCancelled && !isNegative && (
          <rect
            x={4}
            y={4}
            width={width - 8}
            height={Math.max(5, Math.round(height * 0.14))}
            rx={4}
            fill="rgba(255,255,255,0.16)"
          />
        )}

        {/* Top-left circular + / - badge matching the original Algebra Cards & Tiles PDF */}
        {showCornerSignBadge && (
          <g opacity={isCancelled ? 0.65 : 1}>
            <circle
              cx={badgeCenter}
              cy={badgeCenter}
              r={badgeRadius}
              fill="rgba(255,255,255,0.92)"
            />
            <text
              x={badgeCenter}
              y={badgeCenter + 3.2}
              textAnchor="middle"
              fill={signColor}
              fontFamily="'IBM Plex Mono', monospace"
              fontWeight="800"
              fontSize={type === '1' ? 9 : 10}
            >
              {isNegative ? '−' : '+'}
            </text>
          </g>
        )}

        <text
          x={isBackStack ? 8 : width / 2 + (showCornerSignBadge && type === '1' ? 2 : 0)}
          y={
            isBackStack
              ? 16
              : height / 2 + (compact ? 4 : type === '1' ? 5 : 5.5)
          }
          textAnchor={isBackStack ? 'start' : 'middle'}
          fill={textFill}
          stroke={
            isNegative
              ? isCancelled
                ? 'rgba(255,255,255,0.78)'
                : 'rgba(255,255,255,0.95)'
              : undefined
          }
          strokeWidth={isNegative ? (compact ? 2.6 : 3.6) : 0}
          paintOrder="stroke"
          fontFamily="'IBM Plex Mono', monospace"
          fontWeight="700"
          style={{ transition: 'fill 260ms ease' }}
          fontSize={fontSize}
        >
          {compact ? fullLabel : centerLabel}
        </text>
      </svg>
    </button>
  );
};

interface DraggableWorkspaceTileProps {
  tile: TileModel;
  selected: boolean;
  zeroPairHighlight: boolean;
  dropHighlight?: 'zeropair' | 'group' | 'mismatch' | null;
  stackRole?: 'back' | 'front' | null;
  zoom?: number;
  onSelect: (id: string, multi: boolean) => void;
  onHoverChange?: (id: string, hovering: boolean, pointerType: string) => void;
  onDragStart?: (id: string) => void;
  onDragMove?: (id: string, x: number, y: number) => void;
  onDragEnd?: (id: string, x: number, y: number, wasMoved: boolean) => void;
  onDragDelta?: (id: string, dx: number, dy: number) => void;
  onDragDeltaEnd?: (id: string, dx: number, dy: number, wasMoved: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  snapToGrid: boolean;
}

export const WorkspaceTileItem: React.FC<DraggableWorkspaceTileProps> = ({
  tile,
  selected,
  zeroPairHighlight,
  dropHighlight = null,
  stackRole = null,
  zoom = 1,
  onSelect,
  onHoverChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragDelta,
  onDragDeltaEnd,
  containerRef,
  snapToGrid,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isTouchDrag, setIsTouchDrag] = React.useState(false);

  const dragRef = React.useRef<{
    active: boolean;
    moved: boolean;
    pointerId: number | null;
    startClientX: number;
    startClientY: number;
    offsetX: number;
    offsetY: number;
    lastX: number;
    lastY: number;
    lastDx: number;
    lastDy: number;
  }>({
    active: false,
    moved: false,
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    offsetX: 0,
    offsetY: 0,
    lastX: tile.position.x,
    lastY: tile.position.y,
    lastDx: 0,
    lastDy: 0,
  });

  const isCancelled = tile.status === 'cancelled';

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isCancelled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;

    e.stopPropagation();
    const targetEl = e.currentTarget as HTMLElement;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unavailable in synthetic environments
    }

    const rect = container.getBoundingClientRect();
    const safeZoom = Math.max(0.4, zoom);
    const touch = e.pointerType === 'touch';
    setIsTouchDrag(touch);

    dragRef.current = {
      active: true,
      moved: false,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      offsetX: (e.clientX - rect.left) / safeZoom - tile.position.x,
      offsetY: (e.clientY - rect.top) / safeZoom - tile.position.y,
      lastX: tile.position.x,
      lastY: tile.position.y,
      lastDx: 0,
      lastDy: 0,
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };

    const computeCoords = (clientX: number, clientY: number) => {
      const cRect = containerRef.current?.getBoundingClientRect();
      if (!cRect) return { x: dragRef.current.lastX, y: dragRef.current.lastY };
      const { width, height } = getTileDimensions(tile.type);
      const liftY = touch ? 14 / safeZoom : 0;
      let nextX = (clientX - cRect.left) / safeZoom - dragRef.current.offsetX;
      let nextY = (clientY - cRect.top) / safeZoom - dragRef.current.offsetY - liftY;

      const logicalW = cRect.width / safeZoom;
      const logicalH = cRect.height / safeZoom;
      nextX = Math.max(8, Math.min(Math.max(8, logicalW - width - 8), nextX));
      nextY = Math.max(8, Math.min(Math.max(8, logicalH - height - 8), nextY));

      if (snapToGrid && !tile.groupId && !tile.zeroPairId) {
        nextX = Math.round(nextX / 12) * 12;
        nextY = Math.round(nextY / 12) * 12;
      }
      return { x: nextX, y: nextY };
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current.active) return;
      if (dragRef.current.pointerId !== null && moveEvent.pointerId !== dragRef.current.pointerId) {
        return;
      }

      const dist = Math.hypot(
        moveEvent.clientX - dragRef.current.startClientX,
        moveEvent.clientY - dragRef.current.startClientY
      );

      if (!dragRef.current.moved && dist <= 6) {
        return;
      }

      if (!dragRef.current.moved) {
        dragRef.current.moved = true;
        setIsDragging(true);
        onDragStart?.(tile.id);
      }

      const liftY = touch ? 14 / safeZoom : 0;
      const dx = (moveEvent.clientX - dragRef.current.startClientX) / safeZoom;
      const dy = (moveEvent.clientY - dragRef.current.startClientY) / safeZoom - liftY;
      dragRef.current.lastDx = dx;
      dragRef.current.lastDy = dy;

      if (onDragDelta) {
        onDragDelta(tile.id, dx, dy);
      } else {
        const { x, y } = computeCoords(moveEvent.clientX, moveEvent.clientY);
        dragRef.current.lastX = x;
        dragRef.current.lastY = y;
        onDragMove?.(tile.id, x, y);
      }
    };

    const finishDrag = (endEvent: PointerEvent, cancelled = false) => {
      if (!dragRef.current.active) return;
      const wasMoved = dragRef.current.moved;
      dragRef.current.active = false;
      setIsDragging(false);
      setIsTouchDrag(false);
      cleanup();

      try {
        targetEl.releasePointerCapture(endEvent.pointerId);
      } catch {
        // Ignore
      }

      if (wasMoved && !cancelled) {
        if (onDragDeltaEnd) {
          onDragDeltaEnd(tile.id, dragRef.current.lastDx, dragRef.current.lastDy, true);
        } else {
          onDragEnd?.(tile.id, dragRef.current.lastX, dragRef.current.lastY, true);
        }
      } else if (wasMoved && cancelled) {
        if (onDragDeltaEnd) {
          onDragDeltaEnd(tile.id, 0, 0, false);
        } else {
          onDragEnd?.(tile.id, tile.position.x, tile.position.y, false);
        }
      } else if (!cancelled) {
        onSelect(tile.id, endEvent.shiftKey || endEvent.metaKey || endEvent.ctrlKey);
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => finishDrag(upEvent, false);
    const handlePointerCancel = (cancelEvent: PointerEvent) => finishDrag(cancelEvent, true);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
  };

  const tileDims = getTileDimensions(tile.type);

  return (
    <div
      data-tile-id={tile.id}
      data-tile-type={tile.type}
      data-tile-sign={tile.sign === 1 ? 'positive' : 'negative'}
      data-tile-status={isCancelled ? 'cancelled' : 'active'}
      data-group-id={tile.groupId || undefined}
      data-zero-pair-id={tile.zeroPairId || undefined}
      style={{
        position: 'absolute',
        left: `${tile.position.x}px`,
        top: `${tile.position.y}px`,
        width: `${tileDims.width}px`,
        height: `${tileDims.height}px`,
        touchAction: isCancelled ? undefined : 'none',
        zIndex: isCancelled
          ? 6
          : isDragging
          ? 45
          : stackRole === 'front'
          ? 16
          : stackRole === 'back'
          ? 12
          : 10,
        transition: 'left 250ms ease, top 250ms ease',
      }}
      className={`select-none ${
        !isCancelled && isDragging
          ? isTouchDrag
            ? 'scale-105 drop-shadow-lg'
            : 'scale-[1.03] drop-shadow-md'
          : ''
      }`}
    >
      <TileVisual
        type={tile.type}
        sign={tile.sign}
        status={tile.status || 'active'}
        selected={selected}
        stackRole={stackRole}
        touchActionNone={!isCancelled}
        zeroPairHighlight={zeroPairHighlight || dropHighlight === 'zeropair'}
        groupHighlight={dropHighlight === 'group'}
        onPointerDown={handlePointerDown}
        onPointerEnter={(e) => onHoverChange?.(tile.id, true, e.pointerType)}
        onPointerLeave={(e) => onHoverChange?.(tile.id, false, e.pointerType)}
        onClick={(e) => {
          e.stopPropagation();
          if (isCancelled) {
            onSelect(tile.id, false);
          } else if (e.detail === 0) {
            onSelect(tile.id, e.shiftKey || e.metaKey || e.ctrlKey);
          }
        }}
        className={`${
          isCancelled ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
        } ${dropHighlight === 'mismatch' ? 'ring-3 ring-[#C94438] ring-offset-2' : ''}`}
        ariaLabel={
          isCancelled
            ? `${getTileLabel(tile.type, tile.sign)} tile (faded — cancelled as zero pair)`
            : `${getTileLabel(tile.type, tile.sign)} tile on board`
        }
      />
    </div>
  );
};

