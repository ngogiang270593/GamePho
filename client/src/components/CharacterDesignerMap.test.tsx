import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_APPEARANCE } from '../game/character';
import { makeSpriteSheet } from '../game/characterSpriteSheet';
import type { OpeningMapPageProps } from '../pages/OpeningMapPage';
import { CharacterDesignerMap } from './CharacterDesignerMap';

const map = vi.hoisted(() => ({ props: null as OpeningMapPageProps | null, mounts: 0 }));

vi.mock('../pages/OpeningMapPage', async () => {
  const { useState } = await import('react');
  return {
    OpeningMapPage: (props: OpeningMapPageProps) => {
      map.props = props;
      const [instance] = useState(() => ++map.mounts);
      return <div data-testid="opening-map" data-instance={instance}>Bản đồ làng quê màu nước</div>;
    },
  };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  map.props = null;
  map.mounts = 0;
});

function mount(realMap = true) {
  const sheet = makeSpriteSheet('/test-sprite.png', 2048, 1024, 'Walking', 8, 4);
  const previewMotion = { action: 'walk' as const, facing: 'left' as const, frame: 3, playing: false };
  const onRealMap = vi.fn();
  const props = {
    appearance: { ...DEFAULT_APPEARANCE, gender: 'male' as const, outfit: 'forest' as const },
    startingCharacter: 'forest-keeper' as const,
    sheet, realMap, onRealMap, previewMotion,
  };
  return { ...render(<CharacterDesignerMap {...props} />), props, sheet, previewMotion, onRealMap };
}

describe('character designer using the new game map', () => {
  it('previews the current character on the new map even when a legacy map is saved', () => {
    const progressKey = 'su-viet-hanh-trinh-progress-v1';
    const positionKey = 'opening-map-player-position-watercolor';
    const savedProgress = JSON.stringify({ currentMapId: 'thang-long', gold: 1200 });
    const savedPosition = JSON.stringify({ x: 940, y: 630 });
    localStorage.setItem(progressKey, savedProgress);
    localStorage.setItem(positionKey, savedPosition);
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const { props, sheet } = mount();

    expect(screen.getByTestId('opening-map')).toBeTruthy();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(map.props).toMatchObject({
      embedded: true,
      persistPlayerPosition: false,
      interactive: true,
      appearance: props.appearance,
      startingCharacter: props.startingCharacter,
      playerName: 'Nhân vật thử',
    });
    expect(map.props?.playerSpriteSheet).toBe(sheet);
    expect(map.props?.previewMotion).toBeUndefined();
    expect(map.props?.npcs).toBeUndefined();
    expect(localStorage.getItem(progressKey)).toBe(savedProgress);
    expect(localStorage.getItem(positionKey)).toBe(savedPosition);
    expect(write).not.toHaveBeenCalled();
  });

  it('switches between map controls and the exact animation selected in the designer', () => {
    const { props, rerender, previewMotion, onRealMap } = mount();
    const checkbox = screen.getByRole('checkbox', { name: 'Đi thử bằng WASD trên map' });
    fireEvent.click(checkbox);
    expect(onRealMap).toHaveBeenCalledWith(false);

    rerender(<CharacterDesignerMap {...props} realMap={false} />);
    expect(map.props?.interactive).toBe(false);
    expect(map.props?.previewMotion).toBe(previewMotion);
    expect(map.props?.persistPlayerPosition).toBe(false);
    expect(screen.getByText('Đang xem hành động, hướng và frame đã chọn trong trình thiết kế.')).toBeTruthy();

    fireEvent.click(checkbox);
    expect(onRealMap).toHaveBeenLastCalledWith(true);
    rerender(<CharacterDesignerMap {...props} realMap />);
    expect(map.props?.interactive).toBe(true);
    expect(map.props?.previewMotion).toBeUndefined();
  });

  it('resets the isolated map position while retaining the selected character and preview', () => {
    const { props, rerender, previewMotion } = mount(false);
    const firstInstance = screen.getByTestId('opening-map').getAttribute('data-instance');
    rerender(<CharacterDesignerMap {...props} sheet={null} />);
    expect(map.props?.playerSpriteSheet).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại vị trí thử' }));
    expect(screen.getByTestId('opening-map').getAttribute('data-instance')).not.toBe(firstInstance);
    expect(map.props).toMatchObject({
      appearance: props.appearance,
      startingCharacter: props.startingCharacter,
      interactive: false,
      persistPlayerPosition: false,
      playerSpriteSheet: null,
    });
    expect(map.props?.previewMotion).toBe(previewMotion);
  });
});
