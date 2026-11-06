import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeSpriteSheet } from '../game/characterSpriteSheet';
import { SpriteSheetCharacter } from './SpriteSheetCharacter';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('SpriteSheetCharacter', () => {
  it.each([[256, 256], [512, 256], [128, 512]])('fits a complete %i×%i frame within the map viewport with its original aspect ratio', (width, height) => {
    const sheet = makeSpriteSheet('/assets/imported-character.png', width, height);
    const { container } = render(<SpriteSheetCharacter sheet={sheet} />);
    const sprite = container.querySelector('svg')!;
    const image = sprite.querySelector('image')!;
    expect(image.getAttribute('href')).toBe(sheet.src);
    expect(image.getAttribute('width')).toBe(String(width));
    expect(image.getAttribute('height')).toBe(String(height));
    expect(Number(image.getAttribute('x'))).toBe(0);
    expect(Number(image.getAttribute('y'))).toBe(0);

    const transform = sprite.querySelector('g[transform]')!.getAttribute('transform')!;
    const match = /translate\(80 212\) scale\(([^)]+)\) translate\(([^ ]+) ([^)]+)\)/.exec(transform)!;
    expect(match).toBeTruthy();
    const [, scaleValue, xValue, yValue] = match;
    const scale = Number(scaleValue);
    const left = 80 + scale * Number(xValue);
    const top = 212 + scale * Number(yValue);
    const drawnWidth = width * scale;
    const drawnHeight = height * scale;
    expect(drawnWidth).toBeLessThanOrEqual(150);
    expect(drawnHeight).toBeLessThanOrEqual(200);
    expect(drawnWidth / drawnHeight).toBeCloseTo(width / height);
    expect(Math.max(drawnWidth / 150, drawnHeight / 200)).toBeCloseTo(1);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(left + drawnWidth).toBeLessThanOrEqual(160);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top + drawnHeight).toBeLessThanOrEqual(224);
  });

  it('keeps a single image unchanged instead of synthesizing frames, even with legacy motion enabled', () => {
    vi.useFakeTimers();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const sheet = { ...makeSpriteSheet('/assets/forest-keeper-256.png', 256, 256), singleFrameWalk: true };
    const { container, rerender } = render(<SpriteSheetCharacter sheet={sheet} action="walk" />);
    const image = container.querySelector('image')!;
    const original = image.outerHTML;
    expect(container.querySelectorAll('image')).toHaveLength(1);
    expect(container.querySelector('svg')!.getAttribute('data-playing')).toBe('false');
    expect(container.querySelector('svg')!.getAttribute('data-frame')).toBe('0');
    expect(container.querySelector('svg')!.hasAttribute('data-single-frame-motion')).toBe(false);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(container.querySelector('image')!.outerHTML).toBe(original);

    rerender(<SpriteSheetCharacter sheet={sheet} action="run" />);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(container.querySelectorAll('image')).toHaveLength(1);
    expect(container.querySelector('image')!.outerHTML).toBe(original);
    expect(container.querySelector('svg')!.getAttribute('data-playing')).toBe('false');
  });

  it('plays all eight real frames at a moderated clip rate, wraps and switches to the requested direction range', () => {
    vi.useFakeTimers();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const sheet = makeSpriteSheet('/assets/walk-sheet.png', 2048, 1024, 'Walk sheet', 8, 4);
    const { container, rerender } = render(<SpriteSheetCharacter sheet={sheet} action="walk" facing="up" />);
    const sprite = () => container.querySelector('svg')!;
    const image = () => sprite().querySelector('image')!;
    expect(sprite().getAttribute('data-playing')).toBe('true');
    expect(sprite().getAttribute('data-frame')).toBe('16');
    expect(Number(image().getAttribute('x'))).toBe(0);
    expect(Number(image().getAttribute('y'))).toBe(-512);
    for (let frame = 1; frame < 8; frame++) {
      act(() => { vi.advanceTimersByTime(188); });
      expect(sprite().getAttribute('data-frame')).toBe(String(16 + frame));
      expect(Number(image().getAttribute('x'))).toBe(-256 * frame);
      expect(Number(image().getAttribute('y'))).toBe(-512);
    }
    act(() => { vi.advanceTimersByTime(188); });
    expect(sprite().getAttribute('data-frame')).toBe('16');

    rerender(<SpriteSheetCharacter sheet={sheet} action="walk" facing="left" />);
    expect(sprite().getAttribute('data-frame')).toBe('24');
    expect(Number(image().getAttribute('x'))).toBe(0);
    expect(Number(image().getAttribute('y'))).toBe(-768);
    act(() => { vi.advanceTimersByTime(188); });
    expect(sprite().getAttribute('data-frame')).toBe('25');
  });

  it('freezes an explicit frame or paused playback and renders portraits without playback', () => {
    vi.useFakeTimers();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const sheet = makeSpriteSheet('/assets/walk-sheet.png', 2048, 1024, 'Walk sheet', 8, 4);
    const { container, rerender } = render(<SpriteSheetCharacter sheet={sheet} action="walk" facing="up" frame={6} playing />);
    const sprite = () => container.querySelector('svg')!;
    expect(sprite().getAttribute('data-frame')).toBe('22');
    expect(sprite().getAttribute('data-playing')).toBe('false');
    act(() => { vi.advanceTimersByTime(1000); });
    expect(sprite().getAttribute('data-frame')).toBe('22');

    rerender(<SpriteSheetCharacter sheet={sheet} action="walk" facing="up" playing={false} />);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(sprite().getAttribute('data-frame')).toBe('16');
    expect(sprite().getAttribute('data-playing')).toBe('false');

    rerender(<SpriteSheetCharacter sheet={sheet} action="walk" facing="up" portrait />);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(sprite().getAttribute('data-frame')).toBe('16');
    expect(sprite().getAttribute('data-playing')).toBe('false');
  });

  it('holds the final frame for a non-looping action', () => {
    vi.useFakeTimers();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const sheet = makeSpriteSheet('/assets/jump-sheet.png', 2048, 256, 'Jump sheet', 8, 1);
    const { container } = render(<SpriteSheetCharacter sheet={sheet} action="jump" />);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(container.querySelector('svg')!.getAttribute('data-frame')).toBe('5');
    act(() => { vi.advanceTimersByTime(500); });
    expect(container.querySelector('svg')!.getAttribute('data-frame')).toBe('7');
    act(() => { vi.advanceTimersByTime(1000); });
    expect(container.querySelector('svg')!.getAttribute('data-frame')).toBe('7');
  });
});
