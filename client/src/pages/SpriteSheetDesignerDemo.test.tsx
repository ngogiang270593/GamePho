import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DesignerWorkspace } from '../game/characterDesignerDraft';
import type { CharacterSpriteSheet } from '../game/characterSpriteSheet';
import { makeSpriteSheet } from '../game/characterSpriteSheet';
import { SpriteSheetDesignerDemo } from './SpriteSheetDesignerDemo';

const mocks = vi.hoisted(() => ({
  workspaces: new Map<string, unknown>(),
  saveWorkspace: vi.fn(), loadWorkspace: vi.fn(), deleteWorkspace: vi.fn(), apply: vi.fn(), compile: vi.fn(),
  appliedSheet: null as CharacterSpriteSheet | null,
  imageWidth: 256, imageHeight: 256,
}));

vi.mock('../components/CharacterDesignerMap', () => ({ CharacterDesignerMap: () => <section role="region" aria-label="Bản đồ khởi đầu" /> }));
vi.mock('../components/CharacterSprite', () => ({ CharacterSprite: () => null }));
vi.mock('../components/SpriteSheetCharacter', () => ({ SpriteSheetCharacter: () => null }));
vi.mock('../game/characterSpriteSheet', async importOriginal => ({
  ...await importOriginal<typeof import('../game/characterSpriteSheet')>(),
  useAppliedSpriteSheet: () => mocks.appliedSheet,
  applySpriteSheet: mocks.apply,
}));
vi.mock('../game/characterDesignerDraft', async importOriginal => ({
  ...await importOriginal<typeof import('../game/characterDesignerDraft')>(),
  loadDesignerWorkspace: mocks.loadWorkspace,
  deleteDesignerWorkspace: mocks.deleteWorkspace,
  saveDesignerWorkspace: mocks.saveWorkspace,
}));
vi.mock('../game/characterActionFrames', async importOriginal => ({
  ...await importOriginal<typeof import('../game/characterActionFrames')>(),
  compileActionFrames: mocks.compile,
  readActionFrames: vi.fn(async () => []),
}));

const target = 'forest-keeper:male';
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
const upload = (label: string, names: string[]) => {
  fireEvent.change(screen.getByLabelText(label), {
    target: { files: names.map(name => new File(['png'], name, { type: 'image/png' })) },
  });
};
const completedFiles = Array.from({ length: 8 }, (_, index) => `walk-down-${index + 1}.png`);
const completedNpcFiles = completedFiles.slice(0, 4);
const completeNpcAction = async () => {
  upload('Nhập frame hành động', completedNpcFiles);
  await waitFor(() => expect(screen.getByTestId('action-frame-count').textContent).toBe('8/8 frame'));
};
const savedWorkspace = () => mocks.workspaces.get(target) as DesignerWorkspace;

beforeEach(() => {
  mocks.workspaces.clear();
  vi.clearAllMocks();
  mocks.loadWorkspace.mockImplementation(async (key: string) => structuredClone(mocks.workspaces.get(key) ?? null));
  mocks.saveWorkspace.mockImplementation(async (workspace: DesignerWorkspace) => {
    mocks.workspaces.set(workspace.target, structuredClone(workspace));
  });
  mocks.apply.mockResolvedValue({ persisted: true });
  mocks.deleteWorkspace.mockResolvedValue(undefined);
  mocks.appliedSheet = null;
  mocks.imageWidth = 256;
  mocks.imageHeight = 256;
  mocks.compile.mockImplementation(async (base: CharacterSpriteSheet | null, _frames, action: string, facing: string, _name: string, frameCount = 8) => {
    const sheet = structuredClone(base ?? makeSpriteSheet('data:image/png;base64,YXRsYXM=', frameCount * 256, 256, 'Frames', frameCount, 1));
    if (!base) {
      for (const clip of Object.values(sheet.clips)) {
        for (const direction of Object.keys(clip.directions)) clip.directions[direction as keyof typeof clip.directions] = { start: 0, count: 1 };
      }
    }
    const clip = sheet.clips[action as keyof typeof sheet.clips];
    const start = Math.ceil(Math.max(0, ...Object.values(sheet.clips).flatMap(item =>
      Object.values(item.directions).map(range => range.start + range.count))) / frameCount) * frameCount;
    clip.directions[facing as keyof typeof clip.directions] = { start, count: frameCount };
    sheet.columns = frameCount;
    sheet.rows = Math.max(sheet.rows, Math.ceil((start + frameCount) / frameCount));
    sheet.imageWidth = frameCount * sheet.cellWidth;
    sheet.imageHeight = sheet.rows * sheet.cellHeight;
    return sheet;
  });
  // Exercise file selection and natural image dimensions; canvas packing is
  // covered separately by characterActionFrames tests.
  vi.stubGlobal('FileReader', class {
    result: string | null = null;
    onload: (() => void) | null = null;
    readAsDataURL(file: File) {
      this.result = `data:image/png;base64,${btoa(file.name)}`;
      queueMicrotask(() => this.onload?.());
    }
  });
  vi.stubGlobal('Image', class {
    naturalWidth = mocks.imageWidth;
    naturalHeight = mocks.imageHeight;
    onload: (() => void) | null = null;
    set src(_src: string) { queueMicrotask(() => this.onload?.()); }
  });
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState({}, '', '/debug/character-designer'); });

describe('character designer saving', () => {
  it('edits the forest character without showing a reference gallery', async () => {
    render(<SpriteSheetDesignerDemo />);
    expect(screen.getByRole('link', { name: 'Vào game ↗' }).getAttribute('href')).toBe('/map');
    expect(screen.getByText('Người đi rừng')).toBeTruthy();
    expect(screen.queryByLabelText('Mẫu')).toBeNull();
    expect(screen.getByLabelText('Nhân vật đang chỉnh chuyển động')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Mẫu ảnh tham khảo' })).toBeNull();
    await waitFor(() => expect(mocks.loadWorkspace).toHaveBeenCalledWith('forest-keeper:male'));

    fireEvent.change(screen.getByLabelText('Giới tính'), { target: { value: 'female' } });
    await waitFor(() => expect(mocks.loadWorkspace).toHaveBeenCalledWith('forest-keeper:female'));
    expect(mocks.loadWorkspace.mock.calls.every(([key]) => key.startsWith('forest-keeper:'))).toBe(true);
  });

  it('loads the selected NPC workspace so its actions can be edited independently', async () => {
    render(<SpriteSheetDesignerDemo />);
    fireEvent.change(screen.getByLabelText('Nhân vật đang chỉnh chuyển động'), { target: { value: 'fisherman-tao' } });
    await waitFor(() => expect(mocks.loadWorkspace).toHaveBeenCalledWith('opening-map-npc:fisherman-tao'));
    expect(screen.getAllByText('Tảo').length).toBeGreaterThan(0);
    expect(screen.getByText(/NPC · Tảo/)).toBeTruthy();
  });

  it('opens the single NPC action editor instead of a time-specific schedule sprite', async () => {
    window.history.replaceState({}, '', '/debug/character-designer?npc=fisherman-tao&action=npc-morning');
    mocks.workspaces.set('opening-map-npc:fisherman-tao', {
      version: 1,
      target: 'opening-map-npc:fisherman-tao',
      draft: { pending: {} },
      atlasStart: 0,
      action: 'walk',
      facing: 'down',
    });

    render(<SpriteSheetDesignerDemo />);
    await waitFor(() => expect(mocks.loadWorkspace).toHaveBeenCalledWith('opening-map-npc:fisherman-tao'));
    expect(button('Động tác đặc trưng').getAttribute('aria-pressed')).toBe('true');
    expect((screen.getByLabelText('Prompt tạo frame') as HTMLTextAreaElement).value).toContain('động tác ngắn, dễ lặp');
    window.history.replaceState({}, '', '/');
  });

  it('clears every old Tảo sprite and draft when the applied atlas is the rejected 1600×1600 image', async () => {
    window.history.replaceState({}, '', '/debug/character-designer?npc=fisherman-tao');
    mocks.appliedSheet = makeSpriteSheet('/assets/tao-old.png', 1600, 1600, 'Tảo cũ');
    render(<SpriteSheetDesignerDemo />);
    await waitFor(() => expect(mocks.apply).toHaveBeenCalledWith('opening-map-npc:fisherman-tao', null));
    expect(mocks.deleteWorkspace).toHaveBeenCalledWith('opening-map-npc:fisherman-tao');
    expect(await screen.findByText(/Đã xóa toàn bộ sprite và bản nháp cũ của Tảo/)).toBeTruthy();
  });

  it('keeps a square 1600×1600 Tảo action image as an unconfigured atlas, not an accepted frame', async () => {
    window.history.replaceState({}, '', '/debug/character-designer?npc=fisherman-tao&action=npc-morning');
    mocks.imageWidth = 1600;
    mocks.imageHeight = 1600;
    render(<SpriteSheetDesignerDemo />);
    fireEvent.change(screen.getByLabelText('Nhập ảnh sprite'), {
      target: { files: [new File(['png'], 'tao-atlas.png', { type: 'image/png' })] },
    });
    expect(await screen.findByText(/chưa tự coi ảnh là frame/)).toBeTruthy();
    expect(mocks.compile).not.toHaveBeenCalled();
    expect(screen.getByTestId('action-frame-count').textContent).toBe('0/8 frame');
  });

  it('rejects an old reference character draft instead of importing it into the main character', async () => {
    render(<SpriteSheetDesignerDemo />);
    const file = new File(['{}'], 'old-character.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: async () => JSON.stringify({ version: 1, target: 'field-worker:male', draft: { pending: {} }, atlasStart: 0, action: 'walk', facing: 'down' }) });
    fireEvent.change(screen.getByLabelText('Nhập cấu hình sprite'), { target: { files: [file] } });
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Bản nháp này không thuộc Người đi rừng đang chỉnh.');
    expect(mocks.saveWorkspace).not.toHaveBeenCalled();
  });

  it('keeps the action editor and preview map but removes the reference gallery and everything below it', () => {
    render(<SpriteSheetDesignerDemo />);
    expect(screen.queryByRole('tablist', { name: 'Công cụ tạo nhân vật' })).toBeNull();
    expect(screen.getByLabelText('Nhân vật đang chỉnh chuyển động')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Mở map thử ở tab mới ↗' }).getAttribute('target')).toBe('_blank');
    expect(screen.queryByRole('region', { name: 'Bản đồ khởi đầu' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Thiết kế NPC và nhiệm vụ trên map' })).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Chọn nhân vật phụ' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Mẫu ảnh tham khảo' })).toBeNull();
    expect(screen.queryByLabelText('Tên nhân vật')).toBeNull();
    expect(screen.queryByLabelText('Nhiệm vụ nhân vật giao')).toBeNull();
  });

  it('opens the selected character map in a separate tab', () => {
    render(<SpriteSheetDesignerDemo />);
    const mapLink = screen.getByRole('link', { name: 'Mở map thử ở tab mới ↗' });
    expect(mapLink.getAttribute('target')).toBe('_blank');
    expect(mapLink.getAttribute('href')).toContain('/debug/character-designer/map?gender=male');
    fireEvent.change(screen.getByLabelText('Nhân vật đang chỉnh chuyển động'), { target: { value: 'fisherman-tao' } });
    expect(mapLink.getAttribute('href')).toContain('/debug/character-designer/map?npc=fisherman-tao');
  });

  it('defaults NPCs to one front-facing signature action with four repeated frames', async () => {
    render(<SpriteSheetDesignerDemo />);
    fireEvent.change(screen.getByLabelText('Nhân vật đang chỉnh chuyển động'), { target: { value: 'fisherman-tao' } });
    const requirements = screen.getByTestId('npc-action-requirements');
    expect(requirements.textContent).toContain('4 hình động tác đặc trưng hướng trước');
    expect(button('Lưu và áp dụng vào game').disabled).toBe(true);

    upload('Nhập frame hành động', completedNpcFiles);
    await waitFor(() => expect(screen.getByTestId('action-frame-count').textContent).toBe('8/8 frame'));
    expect(requirements.textContent).toContain('Đã có đủ sprite động tác hướng trước');
    expect(screen.queryByRole('button', { name: 'Đi bộ' })).toBeNull();
    expect(screen.queryByRole('button', { name: '← A · Trái' })).toBeNull();
    expect(button('Lưu và áp dụng vào game').disabled).toBe(false);
  });

  it('edits each new villager with exactly four frames rather than repeating them to eight', async () => {
    render(<SpriteSheetDesignerDemo />);
    fireEvent.change(screen.getByLabelText('Nhân vật đang chỉnh chuyển động'), { target: { value: 'NPC_DAN_NONG_01' } });
    await waitFor(() => expect(mocks.loadWorkspace).toHaveBeenCalledWith('opening-map-npc:NPC_DAN_NONG_01'));
    expect(screen.getByTestId('npc-action-requirements').textContent).toContain('đúng 4 frame riêng');
    expect(screen.getByText('Chọn đúng 4 ảnh khác nhau theo thứ tự tên file')).toBeTruthy();

    upload('Nhập frame hành động', ['work-01.png', 'work-02.png', 'work-03.png', 'work-04.png']);
    await waitFor(() => expect(screen.getByTestId('action-frame-count').textContent).toBe('4/4 frame'));
    expect(mocks.compile.mock.calls[0][1]).toHaveLength(4);
    expect(mocks.compile.mock.calls[0][5]).toBe(4);
    expect(button('Lưu và áp dụng vào game').disabled).toBe(false);
    fireEvent.click(button('Lưu và áp dụng vào game'));
    await waitFor(() => expect(mocks.apply).toHaveBeenCalledOnce());
    expect(mocks.apply.mock.calls[0][0]).toBe('opening-map-npc:NPC_DAN_NONG_01');
    expect(mocks.apply.mock.calls[0][1].clips['npc-morning'].directions.down.count).toBe(4);
  });

  it('stores the signature action in the front-facing map clip', async () => {
    render(<SpriteSheetDesignerDemo />);
    fireEvent.change(screen.getByLabelText('Nhân vật đang chỉnh chuyển động'), { target: { value: 'fisherman-tao' } });
    fireEvent.click(button('Động tác đặc trưng'));
    upload('Nhập frame hành động', ['work-down-01.png', 'work-down-02.png', 'work-down-03.png', 'work-down-04.png']);
    await waitFor(() => expect(screen.getByTestId('action-frame-count').textContent).toBe('8/8 frame'));
    const [base, frames, action, facing] = mocks.compile.mock.calls[0];
    expect(action).toBe('npc-morning');
    expect(facing).toBe('down');
    expect(frames.map((frame: { name: string }) => frame.name)).toEqual([
      'work-down-01.png', 'work-down-02.png', 'work-down-03.png', 'work-down-04.png',
      'work-down-01.png', 'work-down-02.png', 'work-down-03.png', 'work-down-04.png',
    ]);
    expect(base).toBeNull();
    expect(button('Lưu và áp dụng vào game').disabled).toBe(false);
    fireEvent.click(button('Lưu và áp dụng vào game'));
    await waitFor(() => expect(mocks.apply).toHaveBeenCalledOnce());
    expect(mocks.apply.mock.calls[0][1].clips['npc-morning'].directions.down.count).toBe(8);
  });

  it('saves a completed walking direction without requiring all four directions', async () => {
    render(<SpriteSheetDesignerDemo />);
    upload('Nhập frame hành động', completedFiles);
    await waitFor(() => expect(screen.getByTestId('action-frame-count').textContent).toBe('8/8 frame'));
    expect(button('Lưu và áp dụng vào game').disabled).toBe(false);
    expect(button('Ghi ảnh + hành động vào source').disabled).toBe(false);
    expect(screen.getByText(/Hành động Đi bộ còn thiếu hướng:/).textContent).toContain('quay lưng');

    fireEvent.click(button('Lưu và áp dụng vào game'));
    await waitFor(() => expect(mocks.apply).toHaveBeenCalledOnce());
    expect(mocks.apply.mock.calls[0][0]).toBe(target);
    expect(mocks.apply.mock.calls[0][1].clips.walk.directions.down.count).toBe(8);

    const saved = mocks.apply.mock.calls[0][1] as CharacterSpriteSheet;
    const fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ target, sheet: saved }) });
    vi.stubGlobal('fetch', fetch);
    await waitFor(() => expect(button('Ghi ảnh + hành động vào source').disabled).toBe(false));
    fireEvent.click(button('Ghi ảnh + hành động vào source'));
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(fetch.mock.calls[0][0]).toBe('/__character-designer/save');
    expect(JSON.parse(fetch.mock.calls[0][1].body).sheet.clips.walk.directions.down.count).toBe(8);
    await waitFor(() => expect(mocks.apply).toHaveBeenCalledTimes(2));
  });

  it('writes and applies an NPC sheet only to its NPC target, without touching the protagonist', async () => {
    render(<SpriteSheetDesignerDemo />);
    fireEvent.change(screen.getByLabelText('Nhân vật đang chỉnh chuyển động'), { target: { value: 'fisherman-tao' } });
    upload('Nhập frame hành động', completedNpcFiles);
    await waitFor(() => expect(screen.getByTestId('action-frame-count').textContent).toBe('8/8 frame'));
    await completeNpcAction();
    const npcTarget = 'opening-map-npc:fisherman-tao';
    const npcSheet = makeSpriteSheet('data:image/png;base64,YXRsYXM=', 2048, 1024, 'Tảo', 8, 4);
    const fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ target: npcTarget, sheet: npcSheet }) });
    vi.stubGlobal('fetch', fetch);

    fireEvent.click(button('Ghi ảnh + hành động vào source'));
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(JSON.parse(fetch.mock.calls[0][1].body).target).toBe(npcTarget);
    await waitFor(() => expect(mocks.apply).toHaveBeenCalledOnce());
    expect(mocks.apply.mock.calls[0][0]).toBe(npcTarget);
    expect(mocks.apply.mock.calls[0][0]).not.toBe(target);
  });

  it('does not apply a source response that names another character', async () => {
    render(<SpriteSheetDesignerDemo />);
    fireEvent.change(screen.getByLabelText('Nhân vật đang chỉnh chuyển động'), { target: { value: 'fisherman-tao' } });
    upload('Nhập frame hành động', completedNpcFiles);
    await waitFor(() => expect(screen.getByTestId('action-frame-count').textContent).toBe('8/8 frame'));
    await completeNpcAction();
    const npcSheet = makeSpriteSheet('data:image/png;base64,YXRsYXM=', 2048, 1024, 'Tảo', 8, 4);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ target: 'forest-keeper:male', sheet: npcSheet }),
    }));

    fireEvent.click(button('Ghi ảnh + hành động vào source'));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('Sprite được ghi sai nhân vật'));
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it('keeps a single imported frame in a saved draft and restores it when the tool reopens', async () => {
    const view = render(<SpriteSheetDesignerDemo />);
    upload('Nhập ảnh sprite', ['walk-down-01.png']);
    await waitFor(() => expect(screen.getByTestId('action-frame-count').textContent).toBe('1/8 frame'));
    expect(button('Lưu bản nháp').disabled).toBe(false);
    expect(button('Lưu và áp dụng vào game').disabled).toBe(true);
    fireEvent.click(button('Lưu bản nháp'));
    await screen.findByText(/Đã lưu bản nháp kèm toàn bộ ảnh/);
    expect(savedWorkspace().draft.pending['walk:down'][0]).toMatchObject({ width: 256, height: 256, name: 'walk-down-01.png' });

    view.unmount();
    render(<SpriteSheetDesignerDemo />);
    await waitFor(() => expect(screen.getByTestId('action-frame-count').textContent).toBe('1/8 frame'));
    expect(screen.getByAltText('Frame 1').getAttribute('src')).toBe(savedWorkspace().draft.pending['walk:down'][0]?.src);
    expect(button('Lưu bản nháp').disabled).toBe(false);
  });

  it('applies finished walking frames while preserving unfinished images for another action', async () => {
    render(<SpriteSheetDesignerDemo />);
    upload('Nhập frame hành động', completedFiles);
    await waitFor(() => expect(button('Lưu và áp dụng vào game').disabled).toBe(false));
    fireEvent.click(button('Chạy'));
    fireEvent.click(button('→ D · Phải'));
    upload('Ảnh frame 1', ['run-right-01.png']);
    await waitFor(() => expect(screen.getByTestId('action-frame-count').textContent).toBe('1/8 frame'));
    fireEvent.click(button('Đi bộ'));
    fireEvent.click(button('↓ S · Trước'));
    expect(button('Lưu và áp dụng vào game').disabled).toBe(false);
    fireEvent.click(button('Lưu và áp dụng vào game'));
    await screen.findByText(/Đã lưu và áp dụng các hướng hoàn thành/);
    expect(savedWorkspace().draft.pending['run:right'][0]?.name).toBe('run-right-01.png');

    fireEvent.click(button('Chạy'));
    fireEvent.click(button('→ D · Phải'));
    expect(screen.getByTestId('action-frame-count').textContent).toBe('1/8 frame');
    expect(screen.getByAltText('Frame 1').getAttribute('src')).toBe(savedWorkspace().draft.pending['run:right'][0]?.src);
  });
});
