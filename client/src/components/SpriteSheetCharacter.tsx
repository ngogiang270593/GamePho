import { useEffect, useState, type SVGProps } from 'react';
import type { Facing } from '../game/character';
import { spriteCell, type CharacterSpriteSheet, type SpriteAction } from '../game/characterSpriteSheet';

export function SpriteSheetCharacter({ sheet, action = 'idle', facing = 'down', frame, playing = true, portrait = false, playbackIntervalMultiplier = 1, ...props }: {
  sheet: CharacterSpriteSheet;
  action?: SpriteAction;
  facing?: Facing;
  frame?: number;
  playing?: boolean;
  portrait?: boolean;
  playbackIntervalMultiplier?: number;
} & SVGProps<SVGSVGElement>) {
  const clip = sheet.clips[action] ?? sheet.clips.walk ?? sheet.clips.idle;
  const range = clip.directions[facing];
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick(0);
    if (!playing || portrait || frame !== undefined || range.count < 2) return;
    const interval = window.setInterval(() => {
      if (!document.hidden) setTick(value => clip.loop ? (value + 1) % range.count : Math.min(value + 1, range.count - 1));
    }, 1500 * playbackIntervalMultiplier / clip.fps);
    return () => window.clearInterval(interval);
  }, [sheet.src, action, facing, range.start, range.count, clip.fps, clip.loop, playing, portrait, frame, playbackIntervalMultiplier]);
  const selected = Math.min(range.count - 1, Math.max(0, frame ?? tick));
  const cell = spriteCell(sheet, range.start + selected);
  // Preserve the whole frame, including square or wide artwork, in the map's viewport.
  const scale = Math.min(150 / sheet.cellWidth, 200 / sheet.cellHeight) * sheet.scale;
  return <svg xmlns="http://www.w3.org/2000/svg" {...props}
    viewBox={portrait ? '25 0 110 115' : '0 0 160 224'}
    className={`player-sprite sprite-sheet-character facing-${facing} action-${action} ${props.className ?? ''}`}
    style={{ ...props.style, overflow: 'hidden' }}
    data-character-artwork="custom-sprite-sheet" data-sprite-name={sheet.name}
    data-facing={facing} data-locomotion={action} data-preview-action={action} data-frame={range.start + selected}
    data-playing={playing && !portrait && frame === undefined && range.count > 1}
    aria-hidden={props['aria-label'] ? undefined : true} focusable="false">
    {!portrait && <ellipse cx="80" cy="212" rx="23" ry="4" fill="#3f5036" opacity=".16" />}
    <g transform={`translate(80 212) scale(${scale}) translate(${-sheet.anchorX * sheet.cellWidth} ${-sheet.anchorY * sheet.cellHeight})`}>
      <svg width={sheet.cellWidth} height={sheet.cellHeight} viewBox={`0 0 ${sheet.cellWidth} ${sheet.cellHeight}`} overflow="hidden">
        <image href={sheet.src} x={-cell.x} y={-cell.y} width={sheet.imageWidth} height={sheet.imageHeight} preserveAspectRatio="none" />
      </svg>
    </g>
  </svg>;
}
