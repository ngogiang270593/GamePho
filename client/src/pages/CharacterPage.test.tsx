import { cleanup, fireEvent, render as renderBase, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CharacterPage } from './CharacterPage';
import { DEFAULT_APPEARANCE, DEFAULT_APPEARANCES } from '../game/character';
import { CHARACTER_ITEMS, defaultCharacterCustomization } from '../game/characterCustomization';
import { initialInventory, receiveInventoryItem } from '../game/characterInventory';
import { startingCharacterAppearance, STARTING_CHARACTERS } from '../game/startingCharacters';
import type { ReactElement } from 'react';
import type { PlayerCharacter } from '../services/gameTypes';

// Existing customization tests explicitly expand the optional editing tools.
function render(ui: ReactElement) {
  const view = renderBase(ui);
  view.container.querySelectorAll<HTMLDetailsElement>('.creator-appearance-details, .creator-preview-tools, .creation-promo').forEach(details => { details.open = true; });
  return view;
}

const store = vi.hoisted(() => ({
  character: { displayName: '', avatar: '🧑‍🍳' } as PlayerCharacter,
  saveCharacter: vi.fn(),
  soundEnabled: true,
  setSoundEnabled: vi.fn(),
  showNotification: vi.fn(),
}));

vi.mock('../context/GameContext', () => ({
  useGameStore: () => store,
}));

vi.mock('../services/gameService', () => ({
  downloadGameBackup: vi.fn(),
}));

afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
  store.character = { displayName: '', avatar: '🧑‍🍳' };
  store.saveCharacter.mockClear();
  store.setSoundEnabled.mockClear();
  store.showNotification.mockClear();
});

describe('CharacterPage', () => {
  it('cycles creation options in both directions, wraps, and confirms the selected appearance', () => {
    const onStart = vi.fn();
    render(<MemoryRouter><CharacterPage initialSetup localOnly onStart={onStart} /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'TẠO NHÂN VẬT' })).toBeTruthy();
    expect(screen.getAllByRole('combobox')).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: 'Khuôn mặt trước' }));
    expect((screen.getByRole('combobox', { name: 'Khuôn mặt' }) as HTMLSelectElement).value).toBe('freckles');
    fireEvent.click(screen.getByRole('button', { name: 'Khuôn mặt tiếp theo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Khuôn mặt tiếp theo' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Màu da' }), { target: { value: 'tan' } });
    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: '  Mận  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'XÁC NHẬN' }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'Mận', appearance: expect.objectContaining({ face: 'oval', skin: 'tan' }) }));
  });

  it('returns from creation without saving and rejects invalid names', () => {
    const onBack = vi.fn();
    const onStart = vi.fn();
    render(<MemoryRouter><CharacterPage initialSetup localOnly onStart={onStart} onBack={onBack} /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'A' } });
    fireEvent.submit(screen.getByRole('button', { name: 'XÁC NHẬN' }).closest('form')!);
    expect(onStart).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'QUAY LẠI' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(store.saveCharacter).not.toHaveBeenCalled();
  });

  it('randomizes creation without changing gender and records only the selected default look', () => {
    const customization = defaultCharacterCustomization();
    customization.equipped.hair = CHARACTER_ITEMS.find(item => item.category === 'hair')?.id;
    const onStart = vi.fn();
    render(<MemoryRouter><CharacterPage initialSetup localOnly initialCustomization={customization} onStart={onStart} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Nam' }));
    fireEvent.click(screen.getByRole('button', { name: 'NGẪU NHIÊN' }));
    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'Tư An' } });
    fireEvent.click(screen.getByRole('button', { name: 'XÁC NHẬN' }));
    const profile = onStart.mock.calls[0][0];
    expect(profile.appearance.gender).toBe('male');
    expect(CHARACTER_ITEMS.find(item => item.id === profile.customization.equipped.hair)?.appearanceValue).toBe(profile.appearance.hair);
    expect(profile.customization.inventory.ownedItems).toEqual(profile.customization.inventory.defaultItems);
    expect(profile.customization.equipped.shoes).toBe(customization.equipped.shoes);
  });

  it('opens the focused character wardrobe without rendering the duplicate appearance editor', () => {
    const { container } = renderBase(
      <MemoryRouter>
        <CharacterPage localOnly />
      </MemoryRouter>,
    );
    expect(container.querySelector('.character-wardrobe-page')).toBeTruthy();
    expect(container.querySelector('.creator-appearance-details')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Nhân vật' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Túi đồ/ })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Ô trang bị' })).toBeTruthy();
  });

  it('keeps the selected starting archetype in the wardrobe preview', () => {
    const template = STARTING_CHARACTERS.find(item => item.id === 'forest-keeper')!;
    const appearance = startingCharacterAppearance(template.id, 'female');
    const customization = receiveInventoryItem(
      initialInventory(appearance),
      CHARACTER_ITEMS.find(item => item.id === 'clothes-scholar')!.id,
      1,
    );
    const { container } = renderBase(
      <MemoryRouter>
        <CharacterPage
          localOnly
          initialAppearance={appearance}
          initialCustomization={customization}
          startingCharacterId={template.id}
        />
      </MemoryRouter>,
    );

    expect(container.querySelector('.character-dressing-room__sprite')?.getAttribute('data-starting-character'))
      .toBe(template.id);
  });

  it('switches character and inventory tabs with clicks, keyboard, and horizontal swipes', () => {
    const { container } = renderBase(
      <MemoryRouter>
        <CharacterPage localOnly />
      </MemoryRouter>,
    );
    const wardrobe = screen.getByRole('region', { name: 'Nhân vật' });
    const characterTab = screen.getByRole('tab', { name: 'Nhân vật' });
    const inventoryTab = screen.getByRole('tab', { name: /Túi đồ/ });
    const characterPanel = container.querySelector('#character-panel-preview')!;
    const inventoryPanel = container.querySelector('#character-panel-inventory')!;

    fireEvent.click(inventoryTab);
    expect(inventoryTab.getAttribute('aria-selected')).toBe('true');
    expect(inventoryPanel.classList.contains('is-mobile-hidden')).toBe(false);
    expect(characterPanel.classList.contains('is-mobile-hidden')).toBe(true);

    fireEvent.keyDown(inventoryTab, { key: 'ArrowLeft' });
    expect(characterTab.getAttribute('aria-selected')).toBe('true');
    expect(characterPanel.classList.contains('is-mobile-hidden')).toBe(false);

    fireEvent.touchStart(wardrobe, { changedTouches: [{ clientX: 240, clientY: 100 }] });
    fireEvent.touchEnd(wardrobe, { changedTouches: [{ clientX: 120, clientY: 110 }] });
    expect(inventoryTab.getAttribute('aria-selected')).toBe('true');

    fireEvent.touchStart(wardrobe, { changedTouches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(wardrobe, { changedTouches: [{ clientX: 115, clientY: 210 }] });
    expect(inventoryTab.getAttribute('aria-selected')).toBe('true');
  });

  it('awards the new-character promo only when CODEX500 is entered correctly', () => {
    const onStart = vi.fn();
    render(<MemoryRouter><CharacterPage initialSetup localOnly onStart={onStart} /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'Út Mận' } });
    fireEvent.change(screen.getByLabelText(/Nhập mã \(không bắt buộc\)/), { target: { value: ' codex500 ' } });
    expect(screen.getByRole('status').textContent).toContain('10.000 xu');
    fireEvent.click(screen.getByRole('button', { name: /XÁC NHẬN|Tạo nhân vật & vào xóm/ }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ promoCodeRedeemed: true }));
  });

  it('does not award the new-character promo for an incorrect code', () => {
    const onStart = vi.fn();
    render(<MemoryRouter><CharacterPage initialSetup localOnly onStart={onStart} /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'Út Mận' } });
    fireEvent.change(screen.getByLabelText(/Nhập mã \(không bắt buộc\)/), { target: { value: 'WRONG' } });
    fireEvent.click(screen.getByRole('button', { name: /XÁC NHẬN|Tạo nhân vật & vào xóm/ }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ promoCodeRedeemed: false }));
  });

  it('saves every selected body part and enters the map', () => {
    render(
      <MemoryRouter initialEntries={['/character']}>
        <Routes>
          <Route path="/character" element={<CharacterPage />} />
          <Route path="/map" element={<p>Bản đồ xóm</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'Út Mận' } });
    fireEvent.click(screen.getByRole('button', { name: 'Búi sau gáy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tóc nâu hạt dẻ' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mắt' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mắt cười' }));
    fireEvent.click(screen.getByRole('button', { name: 'Khuôn mặt' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trái xoan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Da nâu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trang phục' }));
    fireEvent.click(screen.getByRole('button', { name: 'Áo dài hoa sen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Phụ kiện' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nón lá' }));
    fireEvent.click(screen.getByRole('button', { name: /Lưu & vào bản đồ/ }));

    expect(store.saveCharacter).toHaveBeenCalledWith({ displayName: 'Út Mận', avatar: '🧑‍🍳', appearance: {
      gender: 'female', hair: 'bun', hairColor: 'brown', eyes: 'smile', face: 'oval', skin: 'tan', outfit: 'lotus', accessory: 'nonla', pet: 'none',
    } });
    expect(localStorage.getItem('pho-xom-started')).toBe('yes');
    expect(screen.getByText('Bản đồ xóm')).toBeTruthy();
  });

  it('does not save a name shorter than two characters', () => {
    render(
      <MemoryRouter>
        <CharacterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'A' } });
    fireEvent.submit(screen.getByRole('button', { name: /Lưu & vào bản đồ/ }).closest('form')!);

    expect(store.saveCharacter).not.toHaveBeenCalled();
    expect(localStorage.getItem('pho-xom-started')).toBeNull();
  });

  it('calls the play handler after saving a new player', () => {
    const onStart = vi.fn();
    render(
      <MemoryRouter>
        <CharacterPage initialSetup onStart={onStart} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('heading', { name: 'Cài đặt hệ thống' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Lưu dữ liệu chơi' })).toBeNull();

    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'Bảy' } });
    fireEvent.click(screen.getByRole('button', { name: /XÁC NHẬN|Tạo nhân vật & vào xóm/ }));
    expect(store.saveCharacter).toHaveBeenCalledWith({ displayName: 'Bảy', avatar: '🧑‍🍳', appearance: DEFAULT_APPEARANCE });
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('reopens the saved outfit and shows each facing and walking animation', () => {
    store.character = { displayName: 'Mận', avatar: '🧑‍🍳', appearance: { ...DEFAULT_APPEARANCE, hair: 'short', outfit: 'baba' } };
    const { container } = render(<MemoryRouter><CharacterPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Tóc ngắn' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Mặt sau' }));
    fireEvent.click(screen.getByRole('button', { name: '▷ Xem bước đi' }));
    expect(container.querySelector('.studio-model.facing-up.is-walking')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Lưu & vào bản đồ/ }));
    expect(store.saveCharacter).toHaveBeenCalledWith(store.character);
  });

  it('creates a male character with his selected hair and traditional outfit', () => {
    const onStart = vi.fn();
    const { container } = render(<MemoryRouter><CharacterPage onStart={onStart} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Nam' }));
    expect(screen.getByRole('button', { name: 'Tóc rẽ ngôi' }).getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.studio-model.character-male')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tóc húi gọn' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trang phục' }));
    fireEvent.click(screen.getByRole('button', { name: 'Áo dài nam' }));
    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'Tư An' } });
    fireEvent.click(screen.getByRole('button', { name: /XÁC NHẬN|Tạo nhân vật & vào xóm/ }));
    expect(store.saveCharacter).toHaveBeenCalledWith({ displayName: 'Tư An', avatar: '🧑‍🍳', appearance: {
      ...DEFAULT_APPEARANCES.male, hair: 'crop', outfit: 'aodai',
    } });
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('keeps separate drafts when switching between male and female', () => {
    render(<MemoryRouter><CharacterPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Búi sau gáy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nam' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tóc húi gọn' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nữ' }));
    expect(screen.getByRole('button', { name: 'Búi sau gáy' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Nam' }));
    expect(screen.getByRole('button', { name: 'Tóc húi gọn' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Phối ngẫu nhiên' }));
    expect(screen.getByRole('button', { name: 'Nam' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('reopens a saved male character without replacing his appearance', () => {
    store.character = { displayName: 'Tư An', avatar: '🧑‍🍳', appearance: { ...DEFAULT_APPEARANCES.male, hair: 'topknot' } };
    render(<MemoryRouter><CharacterPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Nam' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Tóc búi cao' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /Lưu & vào bản đồ/ }));
    expect(store.saveCharacter).toHaveBeenCalledWith(store.character);
  });

  it.each(['male', 'female'] as const)('saves skin color and a companion for %s characters', gender => {
    const onStart = vi.fn();
    const { container } = render(<MemoryRouter><CharacterPage onStart={onStart} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: gender === 'male' ? 'Nam' : 'Nữ' }));
    fireEvent.click(screen.getByRole('button', { name: 'Da nâu sẫm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Thú cưng' }));
    fireEvent.click(screen.getByRole('button', { name: 'Chó vàng' }));
    expect(container.querySelector('.studio-companion.pet-dog')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Da nâu sẫm' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'Bình An' } });
    fireEvent.click(screen.getByRole('button', { name: /XÁC NHẬN|Tạo nhân vật & vào xóm/ }));
    expect(store.saveCharacter).toHaveBeenCalledWith({ displayName: 'Bình An', avatar: '🧑‍🍳', appearance: {
      ...DEFAULT_APPEARANCES[gender], skin: 'deep', pet: 'dog',
    } });
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('restores a saved pet, preserves it while shuffling clothes, and allows removing it', () => {
    store.character = { displayName: 'Mận', avatar: '🧑‍🍳', appearance: { ...DEFAULT_APPEARANCE, skin: 'bronze', pet: 'cat' } };
    const { container } = render(<MemoryRouter><CharacterPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Da nâu đồng' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Phối ngẫu nhiên' }));
    expect(container.querySelector('.studio-companion.pet-cat')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Thú cưng' }));
    expect(screen.getByRole('button', { name: 'Mèo mướp' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Không nuôi' }));
    expect(container.querySelector('.studio-companion')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Lưu & vào bản đồ/ }));
    expect(store.saveCharacter.mock.calls[0][0].appearance.pet).toBe('none');
  });

  it.each([
    { outfit: 'tuthan' as const, label: 'Áo tứ thân' },
    { outfit: 'nhatbinh' as const, label: 'Áo Nhật Bình' },
    { outfit: 'nguthan' as const, label: 'Áo ngũ thân' },
  ])('saves $label without changing the selected skin or companion', ({ outfit, label }) => {
    store.character = { displayName: 'Mận', avatar: '🧑‍🍳', appearance: { ...DEFAULT_APPEARANCE, skin: 'honey', pet: 'cat' } };
    const onStart = vi.fn();
    render(<MemoryRouter><CharacterPage onStart={onStart} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Trang phục' }));
    fireEvent.click(screen.getByRole('button', { name: label }));
    fireEvent.click(screen.getByRole('button', { name: /XÁC NHẬN|Tạo nhân vật & vào xóm/ }));
    expect(store.saveCharacter).toHaveBeenCalledWith({ ...store.character, appearance: { ...store.character.appearance, outfit } });
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('pairs four-panel clothing with a kerchief and lets the player choose a palm hat', () => {
    store.character = { displayName: 'Mận', avatar: '🧑‍🍳', appearance: { ...DEFAULT_APPEARANCE, outfit: 'tuthan', pet: 'rabbit' } };
    const onStart = vi.fn();
    render(<MemoryRouter><CharacterPage onStart={onStart} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Trang phục' }));
    fireEvent.click(screen.getByRole('button', { name: /Phối cùng khăn mỏ quạ/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Phụ kiện' }));
    expect(screen.getByRole('button', { name: 'Khăn mỏ quạ' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Nón quai thao' }));
    fireEvent.click(screen.getByRole('button', { name: /XÁC NHẬN|Tạo nhân vật & vào xóm/ }));
    expect(store.saveCharacter).toHaveBeenCalledWith({ ...store.character, appearance: { ...store.character.appearance, accessory: 'quaithao' } });
  });

  it('shows only owned items and keeps purchased equipment when equipping and saving', () => {
    const purchasedInventory = receiveInventoryItem(initialInventory(), 'wings-light', 1_700_000_000_000, true);
    const onCustomizationChange = vi.fn();
    const onStart = vi.fn();
    const initialCustomization = purchasedInventory;
    render(<MemoryRouter><CharacterPage
      localOnly
      initialDisplayName="Út Mận"
      initialCustomization={initialCustomization}
      onStart={onStart}
      onCustomizationChange={onCustomizationChange}
    /></MemoryRouter>);

    fireEvent.click(screen.getByRole('tab', { name: /Cánh/ }));
    expect(screen.getByRole('button', { name: /Cánh ánh sáng/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Cánh phượng hoàng/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Cánh ánh sáng/ }));
    fireEvent.click(document.querySelector('.character-item-detail .character-equip-button')!);
    expect(onCustomizationChange).toHaveBeenLastCalledWith(expect.objectContaining({
      inventory: expect.objectContaining({
        ownedItems: expect.arrayContaining(['wings-light']),
        purchasedItems: expect.arrayContaining(['wings-light']),
      }),
      equipped: expect.objectContaining({ wings: 'wings-light' }),
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Xoay nhân vật' }));
    expect(onCustomizationChange).toHaveBeenLastCalledWith(expect.objectContaining({ facing: 'three-quarter' }));
    fireEvent.click(screen.getByRole('button', { name: /Lưu nhân vật/ }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({
      customization: expect.objectContaining({
        facing: 'three-quarter',
        equipped: expect.objectContaining({ wings: 'wings-light' }),
        inventory: expect.objectContaining({
          ownedItems: expect.arrayContaining(['wings-light']),
          purchasedItems: expect.arrayContaining(['wings-light']),
        }),
      }),
    }));
  });
});
