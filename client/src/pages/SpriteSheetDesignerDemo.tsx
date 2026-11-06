import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { CharacterSprite } from '../components/CharacterSprite';
import { SpriteSheetCharacter } from '../components/SpriteSheetCharacter';
import type { CharacterGender, Facing } from '../game/character';
import { STARTING_CHARACTERS, startingCharacterAppearance } from '../game/startingCharacters';
import { createOpeningMapVillagers, DEFAULT_OPENING_MAP_NPCS, OPENING_MAP_NPC_IDS, OPENING_MAP_VILLAGER_SPRITE_NPCS, openingMapNpcSpriteTarget, useOpeningMapNpcs } from '../game/openingMapNpcs';
import { OpeningMapNpcArtwork } from '../components/OpeningMapNpcArtwork';
import { ACTION_FRAME_COUNT, ACTION_POSES, compileActionFrames, makeActionSlots, readActionFrames, type FrameImage } from '../game/characterActionFrames';
import { GAME_SPRITE_ACTIONS, NPC_SCHEDULE_SPRITE_ACTION, NPC_WORK_SPRITE_ACTION, SPRITE_ACTIONS, SPRITE_ACTION_LABELS, applySpriteSheet, makeSpriteSheet, spriteCell, spriteSheetError, spriteSheetTarget, useAppliedSpriteSheet, type CharacterSpriteSheet, type SpriteAction } from '../game/characterSpriteSheet';
import { deleteDesignerWorkspace, designerWorkspaceError, loadDesignerWorkspace, saveDesignerWorkspace, type DesignerDraft, type DesignerWorkspace } from '../game/characterDesignerDraft';
import '../styles/character-designer-demo.css';

const directions: { value: Facing; label: string }[] = [{ value: 'up', label: '↑ W · Sau / quay lưng' }, { value: 'left', label: '← A · Trái' }, { value: 'down', label: '↓ S · Trước' }, { value: 'right', label: '→ D · Phải' }];
const labels = SPRITE_ACTION_LABELS;
const facingPrompt: Record<Facing, string> = { down: 'nhìn thẳng về phía người xem', right: 'nhìn ngang sang phải', up: 'quay lưng về phía người xem', left: 'nhìn ngang sang trái' };
type Slots = (FrameImage | null)[];
type Status = { text: string; error?: boolean };
type Draft = DesignerDraft;
const emptySlots = (count = ACTION_FRAME_COUNT): Slots => Array.from({ length: count }, () => null);
const TAO_SPRITE_TARGET = openingMapNpcSpriteTarget('fisherman-tao');
const VILLAGER_SPRITE_NPC_IDS = OPENING_MAP_VILLAGER_SPRITE_NPCS.map(npc => npc.id);

// Preserve images already open in the editor across a development hot reload.
// Durable draft storage below also keeps them after an ordinary page reload.
type DesignerSession = { drafts: Record<string, Draft>; gender: CharacterGender; action: SpriteAction; facing: Facing; npcId?: string; atlasDraft?: { target: string; sheet: CharacterSpriteSheet }; atlasStart: number };
const cachedSession = import.meta.hot?.data.designerSession as DesignerSession | undefined;
const isEditorTarget = (target: string) => target === 'forest-keeper:male' || target === 'forest-keeper:female'
  || [...OPENING_MAP_NPC_IDS, ...VILLAGER_SPRITE_NPC_IDS].some(id => target === openingMapNpcSpriteTarget(id));
let currentSession = cachedSession;
if (import.meta.hot) import.meta.hot.dispose(data => { data.designerSession = currentSession; });

function readImage(file: File): Promise<FrameImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được file ảnh.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('File không phải ảnh hợp lệ.'));
      image.onload = () => resolve({ src: String(reader.result), width: image.naturalWidth, height: image.naturalHeight, name: file.name });
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function SpriteSheetDesignerDemo() {
  const templateId = 'forest-keeper';
  const [gender, setGender] = useState<CharacterGender>(cachedSession?.gender ?? 'male');
  const requestedAction = new URLSearchParams(window.location.search).get('action');
  const initialActionValue = SPRITE_ACTIONS.find(item => item === requestedAction);
  const initialAction = initialActionValue && Object.values(NPC_SCHEDULE_SPRITE_ACTION).includes(initialActionValue)
    ? NPC_WORK_SPRITE_ACTION
    : initialActionValue;
  const [action, setAction] = useState<SpriteAction>(initialAction ?? cachedSession?.action ?? 'walk');
  const [facing, setFacing] = useState<Facing>(cachedSession?.facing ?? 'down');
  const [editingNpcId, setEditingNpcId] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('npc') ?? cachedSession?.npcId;
    return [...OPENING_MAP_NPC_IDS, ...VILLAGER_SPRITE_NPC_IDS].find(id => id === requested) ?? '';
  });
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [repeatFour, setRepeatFour] = useState(!!(new URLSearchParams(window.location.search).get('npc')));
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(Object.entries(cachedSession?.drafts ?? {}).filter(([target]) => isEditorTarget(target))));
  const [atlasDraft, setAtlasDraft] = useState<{ target: string; sheet: CharacterSpriteSheet } | undefined>(() => cachedSession?.atlasDraft && isEditorTarget(cachedSession.atlasDraft.target) ? cachedSession.atlasDraft : undefined);
  const [atlasStart, setAtlasStart] = useState(cachedSession?.atlasStart ?? 0);
  const [status, setStatus] = useState<Status>();
  const [busy, setBusy] = useState(false);
  const [loadedDrafts, setLoadedDrafts] = useState<Record<string, boolean>>({});
  const [draftNotice, setDraftNotice] = useState<{ target: string; text: string; error?: boolean }>();
  const latestDrafts = useRef(drafts);
  latestDrafts.current = drafts;
  const taoResetInProgress = useRef(false);
  const mapNpcs = useOpeningMapNpcs();
  const villagerTemplate = mapNpcs.find(npc => npc.id === 'messenger')
    ?? DEFAULT_OPENING_MAP_NPCS.find(npc => npc.id === 'messenger')
    ?? DEFAULT_OPENING_MAP_NPCS[0];
  const editorNpcs = [...mapNpcs, ...createOpeningMapVillagers(villagerTemplate)];
  const editingNpc = editorNpcs.find(npc => npc.id === editingNpcId);
  const usesFourFrameAction = VILLAGER_SPRITE_NPC_IDS.includes(editingNpcId as typeof VILLAGER_SPRITE_NPC_IDS[number]);
  const actionFrameCount = usesFourFrameAction ? 4 : ACTION_FRAME_COUNT;
  const template = STARTING_CHARACTERS.find(item => item.id === templateId) ?? STARTING_CHARACTERS[0];
  const target = editingNpc ? openingMapNpcSpriteTarget(editingNpc.id) : spriteSheetTarget(template.id, gender);
  const stored = useAppliedSpriteSheet(target);
  const draft = drafts[target];
  const atlas = atlasDraft?.target === target ? atlasDraft.sheet : undefined;
  const taoHasBadSize = [stored, draft?.sheet, atlas].some(sheet =>
    sheet?.imageWidth === 1600 && sheet.imageHeight === 1600)
    || Object.values(draft?.pending ?? {}).some(slots =>
      slots.some(frame => frame?.width === 1600 && frame.height === 1600));
  const sheet = draft?.sheet ?? stored;
  const key = `${action}:${facing}`;
  const pending = draft?.pending[key];
  const clip = sheet?.clips[action] ?? sheet?.clips.walk ?? sheet?.clips.idle;
  const range = clip?.directions[facing];
  const filled = pending ? pending.filter(Boolean).length : Math.min(actionFrameCount, range?.count ?? 0);
  const ready = filled === actionFrameCount && range?.count === actionFrameCount;
  const unfinished = Object.values(draft?.pending ?? {}).some(slots => slots.some(slot => !slot));
  const compilationFailed = Object.entries(draft?.pending ?? {}).some(([id, slots]) => slots.every(Boolean) && draft?.uncompiled?.[id]);
  const directionFrameCount = (direction: Facing) => {
    const slots = draft?.pending[`${action}:${direction}`];
    return slots ? slots.filter(Boolean).length : Math.min(actionFrameCount, sheet?.clips[action]?.directions[direction].count ?? 0);
  };
  const missingDirections = directions.filter(direction => directionFrameCount(direction.value) !== 8);
  const isNpcWorkAction = !!editingNpc && action === NPC_WORK_SPRITE_ACTION;
  const frameInstructions = ACTION_POSES[action];
  const npcActionReady = isNpcWorkAction
    && directionFrameCount('down') === actionFrameCount;
  const movementReady = editingNpc ? npcActionReady : action === 'idle' || missingDirections.length === 0;
  const error = sheet ? spriteSheetError(sheet) : null;
  const hasCompletedFrames = Object.values(sheet?.clips ?? {}).some(item => Object.values(item.directions).some(item => item.count === actionFrameCount));
  const canSave = !!sheet && hasCompletedFrames && !pending?.some(slot => !slot) && !compilationFailed && !error && !busy
    && (!editingNpc || npcActionReady);
  currentSession = { drafts, gender, action, facing, npcId: editingNpcId, atlasDraft, atlasStart };
  const hasWorkspace = !!sheet || !!atlas || Object.values(draft?.pending ?? {}).some(slots => slots.some(Boolean));
  const atlasView = atlas ?? sheet;
  const atlasTotal = atlasView ? atlasView.columns * atlasView.rows : 0;
  const mainAppearance = useMemo(() => startingCharacterAppearance(template.id, gender), [template.id, gender]);
  const appearance = editingNpc?.appearance ?? mainAppearance;
  const subjectName = editingNpc?.name ?? template.name;
  const subjectGender = appearance.gender;
  const prompt = `Tạo frame ${frame + 1}/${actionFrameCount} của hành động ${labels[action]} cho nhân vật “${subjectName}”, ${subjectGender === 'male' ? 'nam' : 'nữ'}, ${facingPrompt[facing]}. ${isNpcWorkAction ? `Tạo một động tác ngắn, dễ lặp thể hiện vai trò “${editingNpc?.role ?? subjectName}”; giữ chân gần như cố định, chọn đạo cụ đơn giản và giữ nguyên vị trí trên map.` : ''}Tư thế: ${frameInstructions[frame]} Giữ nguyên mẫu ảnh tham chiếu: khuôn mặt, tóc, trang phục, màu sắc và tỷ lệ cơ thể. Camera orthographic cố định, toàn thân ở giữa ảnh, bàn chân cùng đường nền. PNG RGBA 256x256 nền trong suốt, không chữ, không crop tay hoặc chân. Chỉ xuất đúng một frame, đặt tên ${action}-${facing}-${String(frame + 1).padStart(2, '0')}.png.`;
  const incompleteImage = pending?.some(slot => !slot) ? pending[frame] ?? pending.find(Boolean) : null;
  const previewSheet = incompleteImage ? { ...makeSpriteSheet(incompleteImage.src, incompleteImage.width, incompleteImage.height, incompleteImage.name), singleFrameWalk: false } : sheet;
  const previewPlaying = playing && ready && !incompleteImage;
  const previewFrame = incompleteImage ? 0 : previewPlaying ? undefined : Math.min(frame, Math.max(0, (range?.count ?? 1) - 1));
  const availableActions: readonly SpriteAction[] = editingNpc ? [NPC_WORK_SPRITE_ACTION] : GAME_SPRITE_ACTIONS;

  useEffect(() => { setFrame(0); setStatus(undefined); }, [target, action, facing]);

  useEffect(() => {
    setRepeatFour(!!editingNpc && !VILLAGER_SPRITE_NPC_IDS.includes(editingNpc.id as typeof VILLAGER_SPRITE_NPC_IDS[number]));
    if (editingNpc) setFacing('down');
    setAction(current => editingNpc
      ? NPC_WORK_SPRITE_ACTION
      : Object.values(NPC_SCHEDULE_SPRITE_ACTION).includes(current) ? 'walk' : current);
  }, [editingNpcId]);

  useEffect(() => {
    let cancelled = false;
    void loadDesignerWorkspace(target).then(saved => {
      if (cancelled) return;
      // In-memory imports, including images retained during a hot reload, are newer.
      if (saved && !latestDrafts.current[target]) {
        setDrafts(all => all[target] ? all : { ...all, [target]: saved.draft });
        if (saved.atlas) setAtlasDraft({ target, sheet: saved.atlas });
        const restoredAction = initialAction ?? saved.action;
        setAtlasStart(saved.atlasStart); setAction(editingNpc ? NPC_WORK_SPRITE_ACTION : Object.values(NPC_SCHEDULE_SPRITE_ACTION).includes(restoredAction) ? 'walk' : restoredAction); setFacing(editingNpc ? 'down' : saved.facing);
        setDraftNotice({ target, text: 'Đã khôi phục bản nháp, gồm cả ảnh và các ô frame đang nhập dở.' });
      }
    }).catch(cause => {
      if (!cancelled) setDraftNotice({ target, text: cause instanceof Error ? cause.message : 'Không đọc được bản nháp.', error: true });
    }).finally(() => { if (!cancelled) setLoadedDrafts(all => ({ ...all, [target]: true })); });
    return () => { cancelled = true; };
  }, [target, initialAction]);

  useEffect(() => {
    if (target !== TAO_SPRITE_TARGET || !loadedDrafts[target] || !taoHasBadSize || taoResetInProgress.current) return;
    taoResetInProgress.current = true;
    void (async () => {
      try {
        await applySpriteSheet(target, null);
        await deleteDesignerWorkspace(target);
        setDrafts(all => { const next = { ...all }; delete next[target]; return next; });
        setAtlasDraft(undefined);
        setStatus({ text: 'Đã xóa toàn bộ sprite và bản nháp cũ của Tảo vì ảnh 1600×1600 không phải bộ frame hành động hợp lệ.' });
        setDraftNotice({ target, text: 'Sprite cũ của Tảo đã được xóa khỏi thiết bị.' });
      } catch (cause) {
        setDraftNotice({ target, text: cause instanceof Error ? cause.message : 'Không xóa được sprite cũ của Tảo.', error: true });
      } finally {
        taoResetInProgress.current = false;
      }
    })();
  }, [target, loadedDrafts, taoHasBadSize]);

  useEffect(() => {
    if (!loadedDrafts[target] || busy || (!draft && !atlas)) return;
    const snapshot: DesignerWorkspace = { version: 1, target, draft: { ...draft, sheet: sheet ?? undefined, pending: draft?.pending ?? {} }, atlas, atlasStart, action, facing };
    const timer = window.setTimeout(() => {
      void saveDesignerWorkspace(snapshot).then(() => setDraftNotice({ target, text: 'Đã tự lưu bản nháp trên trình duyệt.' }))
        .catch(cause => setDraftNotice({ target, text: cause instanceof Error ? cause.message : 'Chưa tự lưu được bản nháp. Hãy xuất JSON để giữ ảnh.', error: true }));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [target, draft, sheet, atlas, atlasStart, action, facing, busy, loadedDrafts]);

  function workspace(nextSheet = sheet): DesignerWorkspace {
    return { version: 1, target, draft: { ...draft, sheet: nextSheet ?? undefined, pending: draft?.pending ?? {} }, atlas, atlasStart, action, facing };
  }

  async function saveDraft() {
    if (!hasWorkspace || busy) return;
    await work(async () => {
      await saveDesignerWorkspace(workspace());
      setDraftNotice({ target, text: 'Đã lưu bản nháp trên trình duyệt.' });
      setStatus({ text: `Đã lưu bản nháp kèm toàn bộ ảnh, kể cả bộ chưa đủ ${actionFrameCount} frame. Tải lại tool để tiếp tục sửa.` });
    });
  }

  async function currentSlots(): Promise<Slots> {
    if (pending) return [...pending];
    const frames = sheet ? await readActionFrames(sheet, action, facing) : [];
    return emptySlots(actionFrameCount).map((_, index) => frames[index] ?? null);
  }

  async function installFrames(slots: Slots) {
    setDrafts(all => ({ ...all, [target]: { ...all[target], pending: { ...all[target]?.pending, [key]: slots }, uncompiled: { ...all[target]?.uncompiled, [key]: true } } }));
    const count = slots.filter(Boolean).length;
    if (count !== actionFrameCount) {
      setPlaying(false);
      setStatus({ text: `${labels[action]} · ${directions.find(item => item.value === facing)?.label}: ${count}/${actionFrameCount} frame. Có thể lưu nháp ngay; cần thêm ${actionFrameCount - count} frame để phát hành động này.` });
      return;
    }
    const next = await compileActionFrames(sheet, slots as FrameImage[], action, facing, `${subjectName} · ${subjectGender === 'male' ? 'Nam' : 'Nữ'}`, actionFrameCount);
    const invalid = spriteSheetError(next);
    if (invalid) throw new Error(invalid);
    setDrafts(all => ({ ...all, [target]: { ...all[target], sheet: next, pending: { ...all[target]?.pending, [key]: slots }, uncompiled: { ...all[target]?.uncompiled, [key]: false } } }));
    setFrame(0); setPlaying(true);
    setStatus({ text: `Đã ghép đủ ${actionFrameCount} frame cho ${labels[action]} · ${directions.find(item => item.value === facing)?.label}. Bấm Lưu và áp dụng để dùng trong game.` });
  }

  async function work(task: () => Promise<void>) {
    setBusy(true);
    try { await task(); }
    catch (cause) { setStatus({ text: cause instanceof Error ? cause.message : 'Không xử lý được frame.', error: true }); }
    finally { setBusy(false); }
  }

  async function importFrames(event: ChangeEvent<HTMLInputElement>, slot?: number) {
    const files = Array.from(event.target.files ?? []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    event.target.value = '';
    if (!files.length) return;
    await work(async () => {
      const validateTaoFrame = (image: FrameImage) => {
        if (editingNpcId === 'fisherman-tao' && action.startsWith('npc-')
          && (image.width > 512 || image.height > 512)) {
          throw new Error('Frame hành động của Tảo phải nhỏ hơn hoặc bằng 512×512; ảnh 1600×1600 là atlas, không phải một frame.');
        }
        return image;
      };
      if (slot !== undefined) {
        const slots = await currentSlots(); slots[slot] = validateTaoFrame(await readImage(files[0]));
        setFrame(slot); await installFrames(slots); return;
      }
      const repeat = actionFrameCount === ACTION_FRAME_COUNT && files.length === 4 && (repeatFour || !!editingNpc);
      if (files.length !== actionFrameCount && !repeat) throw new Error(`Chọn đúng ${actionFrameCount} ảnh${actionFrameCount === ACTION_FRAME_COUNT ? '; hoặc chọn 4 ảnh để lặp thành 8 frame' : ''}.`);
      await installFrames(makeActionSlots((await Promise.all(files.map(readImage))).map(validateTaoFrame), repeat, actionFrameCount));
    });
  }

  async function importAtlas(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    await work(async () => {
      const image = await readImage(file);
      const columns = image.width === image.height * actionFrameCount ? actionFrameCount : 1;
      const imported = { ...makeSpriteSheet(image.src, image.width, image.height, image.name, columns, 1), singleFrameWalk: false };
      setAtlasDraft({ target, sheet: imported }); setAtlasStart(0);
      if (columns === 1 && !(editingNpcId === 'fisherman-tao' && action.startsWith('npc-'))) {
        const slots = emptySlots(); slots[0] = image;
        await installFrames(slots);
      } else {
        setStatus({ text: columns === actionFrameCount
          ? `Đã nhận sprite sheet ${actionFrameCount} ô. Kiểm tra lưới rồi bấm Dùng ${actionFrameCount} ô cho hành động này.`
          : `Đã nhận ảnh nhưng chưa tự coi ảnh là frame. Hãy chỉnh số cột/hàng theo atlas và chọn đủ ${actionFrameCount} ô trước khi dùng.` });
      }
    });
  }

  async function clearTaoSprites() {
    if (editingNpcId !== 'fisherman-tao' || busy) return;
    await work(async () => {
      await applySpriteSheet(TAO_SPRITE_TARGET, null);
      await deleteDesignerWorkspace(TAO_SPRITE_TARGET);
      setDrafts(all => { const next = { ...all }; delete next[TAO_SPRITE_TARGET]; return next; });
      setAtlasDraft(undefined);
      setAtlasStart(0);
      setStatus({ text: 'Đã xóa toàn bộ sprite và bản nháp hành động của Tảo.' });
      setDraftNotice({ target: TAO_SPRITE_TARGET, text: 'Đã xóa sprite đã lưu khỏi thiết bị.' });
    });
  }

  function updateAtlas(patch: Partial<CharacterSpriteSheet>, grid = false) {
    if (!atlas) return;
    const next = { ...atlas, ...patch };
    if (grid) {
      next.cellWidth = Math.max(1, Math.floor((next.imageWidth - next.offsetX - (next.columns - 1) * next.gapX) / next.columns));
      next.cellHeight = Math.max(1, Math.floor((next.imageHeight - next.offsetY - (next.rows - 1) * next.gapY) / next.rows));
    }
    for (const item of SPRITE_ACTIONS) next.clips = { ...next.clips, [item]: { ...next.clips[item], directions: Object.fromEntries(directions.map(direction => [direction.value, { start: 0, count: 1 }])) as typeof next.clips.idle.directions } };
    setAtlasDraft({ target, sheet: next }); setAtlasStart(0);
  }

  async function useAtlas() {
    if (!atlas) return;
    await work(async () => {
      const invalid = spriteSheetError(atlas); if (invalid) throw new Error(invalid);
      if (atlasStart + actionFrameCount > atlas.columns * atlas.rows) throw new Error(`Lưới phải có đủ ${actionFrameCount} ô liên tiếp từ frame đầu đã chọn.`);
      const extraction = { ...atlas, clips: { ...atlas.clips, [action]: { ...atlas.clips[action], directions: { ...atlas.clips[action].directions, [facing]: { start: atlasStart, count: actionFrameCount } } } } };
      await installFrames(await readActionFrames(extraction, action, facing));
      setAtlasDraft(undefined);
    });
  }

  async function editSlot(index: number, operation: 'left' | 'right' | 'remove') {
    await work(async () => {
      const slots = await currentSlots();
      if (operation === 'remove') slots[index] = null;
      else { const other = index + (operation === 'left' ? -1 : 1); [slots[index], slots[other]] = [slots[other], slots[index]]; }
      await installFrames(slots);
    });
  }

  function updateClip(patch: Partial<NonNullable<typeof clip>>) {
    if (!sheet || !clip) return;
    setDrafts(all => ({ ...all, [target]: { ...all[target], pending: all[target]?.pending ?? {}, sheet: { ...sheet, clips: { ...sheet.clips, [action]: { ...clip, ...patch } } } } }));
  }

  async function save(source: boolean) {
    if (!sheet || !canSave) return;
    await work(async () => {
      let next = sheet;
      if (source) {
        const response = await fetch('/__character-designer/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target, sheet }) });
        const content = await response.text();
        let result: { target?: string; sheet?: CharacterSpriteSheet; error?: string };
        try { result = JSON.parse(content); } catch { throw new Error('Ghi source cần chạy tool bằng npm run dev trên máy chứa source. Có thể lưu trên trình duyệt hoặc xuất JSON.'); }
        if (!response.ok || !result.sheet) throw new Error(result.error ?? 'Không ghi được ảnh và hành động vào source.');
        if (result.target !== target) throw new Error(`Sprite được ghi sai nhân vật (nhận ${result.target ?? 'không có mã'}; cần ${target}). Chưa áp dụng vào game.`);
        next = result.sheet;
      }
      const result = await applySpriteSheet(target, next);
      // Applying a finished direction must keep unrelated incomplete images.
      setDrafts(all => ({ ...all, [target]: { ...all[target], sheet: next, pending: all[target]?.pending ?? {} } }));
      let draftWarning = '';
      try { await saveDesignerWorkspace(workspace(next)); setDraftNotice({ target, text: 'Đã lưu bản nháp kèm các ảnh đang nhập dở.' }); }
      catch (cause) { draftWarning = cause instanceof Error ? cause.message : 'Bản nháp chưa lưu được; hãy xuất JSON để giữ các ảnh đang nhập dở.'; setDraftNotice({ target, text: draftWarning, error: true }); }
      setStatus({ text: (source ? `Đã ghi ảnh và hành động vào source cho ${target}. Các hướng đủ ${actionFrameCount} frame đã được lưu, hướng khác giữ nguyên. ` : result.persisted ? `Đã lưu và áp dụng các hướng hoàn thành cho ${target}. Tải lại vẫn giữ sprite. ` : result.warning ?? 'Đã áp dụng trong phiên hiện tại. ') + draftWarning });
    });
  }

  async function importConfig(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    await work(async () => {
      const value = JSON.parse(await file.text());
      if (value.target && value.target !== target) throw new Error(`Bản nháp này không thuộc ${subjectName} đang chỉnh.`);
      const saved: DesignerWorkspace = value.draft ? { ...value, target } : { version: 1, target, draft: { sheet: value.sheet ?? value, pending: {} }, atlasStart: 0, action, facing };
      const invalid = designerWorkspaceError(saved); if (invalid) throw new Error(invalid);
      setDrafts(all => ({ ...all, [target]: saved.draft }));
      setAtlasDraft(saved.atlas ? { target, sheet: saved.atlas } : undefined); setAtlasStart(saved.atlasStart);
      setAction(editingNpc ? NPC_WORK_SPRITE_ACTION : Object.values(NPC_SCHEDULE_SPRITE_ACTION).includes(saved.action) ? 'walk' : saved.action);
      setFacing(editingNpc ? 'down' : saved.facing); setPlaying(true);
      await saveDesignerWorkspace(saved);
      setStatus({ text: 'Đã nhập và lưu bản nháp kèm ảnh, cấu hình và các frame đang sửa.' });
    });
  }

  async function exportConfig() {
    if (!hasWorkspace || busy) return;
    await work(async () => {
      const images = new Map<string, Promise<string>>();
      const embed = (src: string) => {
        if (src.startsWith('data:')) return Promise.resolve(src);
        if (!images.has(src)) images.set(src, (async () => {
        const response = await fetch(src); if (!response.ok) throw new Error('Không tải được ảnh để xuất.');
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
        })());
        return images.get(src)!;
      };
      const saved = structuredClone(workspace());
      if (saved.draft.sheet) saved.draft.sheet.src = await embed(saved.draft.sheet.src);
      if (saved.atlas) saved.atlas.src = await embed(saved.atlas.src);
      await Promise.all(Object.values(saved.draft.pending).flat().map(async frame => { if (frame) frame.src = await embed(frame.src); }));
      const url = URL.createObjectURL(new Blob([JSON.stringify({ ...saved, sheet: saved.draft.sheet }, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `${target.replace(/:/g, '-')}-${actionFrameCount}frames.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus({ text: 'Đã xuất JSON kèm toàn bộ ảnh và bản nháp, kể cả frame chưa hoàn thành. Có thể mang sang máy khác hoặc gửi AI sửa.' });
    });
  }

  return <main className="sprite-editor">
    <header className="sprite-editor__header"><div><span className="sprite-editor__eyebrow">CHARACTER DESIGNER</span><h1>Thiết kế nhân vật và chuyển động</h1><p>Chọn nhân vật rồi thử sprite trực tiếp trên map. NPC chỉ cần một vòng đi bộ và một động tác ngắn.</p></div><nav><a href={`/debug/character-designer/map?${editingNpc ? `npc=${encodeURIComponent(editingNpc.id)}` : `gender=${gender}`}`} target="_blank" rel="noreferrer">Mở map thử ở tab mới ↗</a><a href="/map">Vào game ↗</a></nav></header>
    <div id="movement-editor-panel">
    <div className="sprite-editor__layout">
      <aside className="sprite-editor__sidebar">
        <section className="sprite-editor__panel sprite-editor__target">
          <label>Nhân vật đang chỉnh<select disabled={busy} aria-label="Nhân vật đang chỉnh chuyển động" value={editingNpcId} onChange={event => setEditingNpcId(event.target.value)}><option value="">Nhân vật chính · {template.name}</option>{editorNpcs.map(npc => <option key={npc.id} value={npc.id}>NPC · {npc.name}</option>)}</select></label>
          <div className="sprite-editor__field"><span>{editingNpc ? 'Nhân vật phụ đang chỉnh' : 'Nhân vật chính'}</span><strong>{subjectName}</strong></div>
          {editingNpcId === 'fisherman-tao' && <button type="button" disabled={busy} onClick={() => void clearTaoSprites()}>Xóa toàn bộ sprite và bản nháp của Tảo</button>}
          {!editingNpc && <label>Giới tính<select disabled={busy} value={gender} onChange={event => setGender(event.target.value as CharacterGender)}><option value="male">Nam</option><option value="female">Nữ</option></select></label>}
        </section>
        <section className="sprite-editor__panel"><h2>1. Động tác nhân vật</h2>
          <div className="sprite-editor__actions">{availableActions.map(item => <button key={item} disabled={busy} type="button" aria-pressed={action === item} onClick={() => setAction(item)}>{editingNpc ? 'Động tác đặc trưng' : labels[item]}</button>)}</div>
          {editingNpc
            ? <p className="sprite-editor__hint">NPC chỉ dùng động tác đặc trưng và luôn hướng mặt về trước trên map.</p>
            : <><div className="sprite-editor__directions">{directions.map(item => <button key={item.value} disabled={busy} type="button" aria-pressed={facing === item.value} onClick={() => setFacing(item.value)}>{item.label}</button>)}</div><p className="sprite-editor__hint">Trong game: thả phím = đứng; WASD = đi bộ; Shift + WASD = chạy. Hướng nhìn tự đổi theo phím di chuyển. Một hành động di chuyển đủ 4 hướng cần 32 frame (8 × 4).</p><div className="sprite-editor__direction-status">{directions.map(direction => <p key={direction.value} data-direction-status={direction.value}>{direction.label}: <strong>{directionFrameCount(direction.value)}/8</strong></p>)}</div></>}
        </section>
        {editingNpc && <section className="sprite-editor__panel" aria-label="Yêu cầu sprite NPC" data-testid="npc-action-requirements">
          <h2>NPC trên map</h2>
          <p className="sprite-editor__hint">{usesFourFrameAction ? 'Hộ dân này dùng đúng 4 frame riêng cho động tác đặc trưng, không lặp frame; có thể nhập ảnh từng ô hoặc cả atlas. NPC đứng tại vị trí đã đặt và phát động tác này trên map.' : 'Giai đoạn đầu chỉ cần 4 hình động tác đặc trưng hướng trước; tool tự lặp thành 8 frame. Có thể thêm đủ 8 hình riêng nếu muốn. NPC đứng tại vị trí đã đặt và phát động tác này trên map.'}</p>
          <p className="sprite-editor__patrol-status" role="status">{npcActionReady ? 'Đã có đủ sprite động tác hướng trước. Lưu và áp dụng để xem trên map.' : `Chưa có sprite. Thêm ${usesFourFrameAction ? 'đúng 4' : '4 hoặc 8'} hình động tác đặc trưng hướng trước để bắt đầu.`}</p>
        </section>}
        <section className="sprite-editor__panel"><h2>2. Nhập {actionFrameCount} frame</h2>
          <label className="sprite-editor__drop"><strong>{usesFourFrameAction ? 'Chọn đúng 4 ảnh khác nhau theo thứ tự tên file' : editingNpc ? 'Chọn 4 hoặc 8 ảnh theo thứ tự tên file' : 'Chọn 8 ảnh theo thứ tự tên file'}</strong><input aria-label="Nhập frame hành động" disabled={busy} type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={event => void importFrames(event)} /><small>{usesFourFrameAction ? 'Bốn ảnh được giữ thành 4 frame riêng biệt; không tự nhân đôi. Vẽ đúng động tác đặc trưng, giữ cùng kích thước và vị trí chân.' : editingNpc ? '4 ảnh sẽ tự lặp thành 8 frame. Vẽ nhân vật nhìn thẳng, giữ cùng kích thước và vị trí chân.' : 'Ví dụ walk-down-01.png … walk-down-08.png. Giữ nguyên kích thước ảnh, căn giữa và chân cùng đường nền.'}</small></label>
          {!editingNpc && <label className="sprite-editor__check"><input type="checkbox" checked={repeatFour} onChange={event => setRepeatFour(event.target.checked)} /><span>Nhập 4 tư thế rồi lặp thành 8 frame: 1–2–3–4–1–2–3–4</span></label>}
          <label className="sprite-editor__drop"><strong>Hoặc chọn ảnh đơn / sprite sheet</strong><input aria-label="Nhập ảnh sprite" disabled={busy} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void importAtlas(event)} /><small>Ảnh đơn ở hành động không tự nhận làm frame; hãy chỉnh atlas và chọn đúng {actionFrameCount} ô.</small></label>
          {!editingNpc && <button disabled={busy || filled < 4} type="button" onClick={() => void work(async () => { const slots = await currentSlots(); if (slots.slice(0, 4).some(slot => !slot)) throw new Error('Cần đủ frame 1–4 trước khi lặp.'); await installFrames(makeActionSlots(slots.slice(0, 4) as FrameImage[], true)); })}>Lặp frame 1–4 thành 5–8</button>}
          {pending && <button disabled={busy} type="button" onClick={() => { setDrafts(all => { const next = { ...all[target], pending: { ...all[target]?.pending } }; delete next.pending[key]; return { ...all, [target]: next }; }); setStatus(undefined); }}>Bỏ lượt sửa frame này</button>}
        </section>
        {atlas && <section className="sprite-editor__panel"><h2>Cắt sprite sheet thành {actionFrameCount} frame</h2><p className="sprite-editor__hint">Ảnh gốc {atlas.imageWidth}×{atlas.imageHeight}. Chỉnh lưới theo ảnh rồi chọn {actionFrameCount} ô liên tiếp.</p>
          <div className="sprite-editor__fields">{(['columns', 'rows', 'cellWidth', 'cellHeight', 'offsetX', 'offsetY', 'gapX', 'gapY'] as const).map((field, index) => <label key={field}>{['Cột', 'Hàng', 'Ô rộng', 'Ô cao', 'Lề X', 'Lề Y', 'Cách X', 'Cách Y'][index]}<input type="number" disabled={busy} min={index < 4 ? 1 : 0} value={atlas[field]} onChange={event => updateAtlas({ [field]: Math.max(index < 4 ? 1 : 0, Number(event.target.value)) }, index < 2)} /></label>)}<label>Frame đầu (1…{atlas.columns * atlas.rows})<input type="number" min="1" value={atlasStart + 1} onChange={event => setAtlasStart(Math.max(0, Number(event.target.value) - 1))} /></label></div>
          <button disabled={busy || atlasStart + actionFrameCount > atlas.columns * atlas.rows || !!spriteSheetError(atlas)} type="button" onClick={() => void useAtlas()}>Dùng {actionFrameCount} ô cho hành động này</button>
          {spriteSheetError(atlas) && <p role="alert" className="sprite-editor__status is-error">{spriteSheetError(atlas)}</p>}
        </section>}
        <section className="sprite-editor__panel"><h2>3. Phát và lưu hành động</h2>
          <div className="sprite-editor__fields"><label>FPS<input aria-label="FPS hành động" type="number" min="1" max="60" disabled={!clip || busy} value={clip?.fps ?? 8} onChange={event => updateClip({ fps: Number(event.target.value) })} /></label><label>Tỉ lệ<input type="number" min=".1" max="4" step=".05" disabled={!sheet || busy} value={sheet?.scale ?? 1} onChange={event => sheet && setDrafts(all => ({ ...all, [target]: { ...all[target], pending: all[target]?.pending ?? {}, sheet: { ...sheet, scale: Number(event.target.value) } } }))} /></label></div>
          <label className="sprite-editor__check"><input type="checkbox" checked={clip?.loop ?? true} disabled={!clip || busy} onChange={event => updateClip({ loop: event.target.checked })} /><span>Lặp hành động</span></label>
          <div className="sprite-editor__toolbar"><button type="button" disabled={!ready || busy} onClick={() => setPlaying(value => !value)}>{playing ? 'Tạm dừng' : 'Phát animation'}</button><button className="primary" type="button" disabled={!hasWorkspace || busy} onClick={() => void saveDraft()}>Lưu bản nháp</button><button className="primary" type="button" disabled={!canSave} onClick={() => void save(false)}>Lưu và áp dụng vào game</button><button className="primary" type="button" disabled={!canSave} onClick={() => void save(true)}>{busy ? 'Đang xử lý…' : 'Ghi ảnh + hành động vào source'}</button><button disabled={!hasWorkspace || busy} type="button" onClick={() => void exportConfig()}>Xuất JSON kèm ảnh</button></div>
          <label className="sprite-editor__hint">Nhập JSON kèm ảnh<input aria-label="Nhập cấu hình sprite" type="file" accept="application/json,.json" disabled={busy} onChange={event => void importConfig(event)} /></label>
          {!ready && <p className="sprite-editor__hint">Lưu bản nháp giữ được ảnh ngay cả khi mới có 1 frame. Cần đủ {actionFrameCount} frame để phát và áp dụng hướng đang sửa.</p>}
          {!movementReady && <p className="sprite-editor__hint">{editingNpc ? 'Cần đủ 4 hoặc 8 hình động tác hướng trước để áp dụng lên map.' : `Hành động ${labels[action]} còn thiếu hướng: ${missingDirections.map(direction => direction.label).join(', ')}. Các hướng đã đủ 8 frame vẫn lưu và áp dụng được; hướng chưa thiết kế dùng hình gốc đúng hướng.`}</p>}
          {unfinished && <p className="sprite-editor__hint">Ảnh nhập dở được giữ trong bản nháp. Các hướng đã ghép xong có thể áp dụng vào game riêng.</p>}
          {compilationFailed && <p className="sprite-editor__status is-error" role="alert">Có bộ frame chưa ghép thành công. Lưu bản nháp hoặc xuất JSON để giữ ảnh rồi kiểm tra lại kích thước frame.</p>}
          <p className="sprite-editor__hint">Lưu trên trình duyệt dùng cùng địa chỉ game. Ghi source lưu ảnh và toàn bộ hành động vào dự án để mang sang máy khác.</p>
          {error && <p role="alert" className="sprite-editor__status is-error">{error}</p>}
          {status && <p role={status.error ? 'alert' : 'status'} className={`sprite-editor__status${status.error ? ' is-error' : ''}`}>{status.text}</p>}
          {draftNotice?.target === target && <p data-testid="designer-draft-status" aria-live="polite" className={`sprite-editor__hint${draftNotice.error ? ' sprite-editor__status is-error' : ''}`}>{draftNotice.text}</p>}
        </section>
        <section className="sprite-editor__panel"><h2>Prompt frame {frame + 1}/{actionFrameCount}</h2><textarea className="sprite-editor__prompt" aria-label="Prompt tạo frame" readOnly value={prompt} rows={8} /><button type="button" onClick={() => void navigator.clipboard?.writeText(prompt)}>Sao chép prompt frame này</button><p className="sprite-editor__hint">Dùng cùng mẫu ảnh tham chiếu, hướng nhìn và vị trí chân cho tất cả frame.</p></section>
      </aside>
      <div className="sprite-editor__main">
        <section className="sprite-editor__card"><header><div><span className="sprite-editor__eyebrow">{actionFrameCount} FRAME · {labels[action]} · {directions.find(item => item.value === facing)?.label}</span><h2>Thứ tự frame của hành động</h2></div><strong className="sprite-editor__progress" data-testid="action-frame-count">{filled}/{actionFrameCount} frame</strong></header>
          <div className="sprite-editor__timeline">{Array.from({ length: actionFrameCount }, (_, index) => {
            const image = pending?.[index];
            const exists = pending ? !!image : !!sheet && index < (range?.count ?? 0);
            return <article key={index} className={`sprite-editor__slot ${exists ? 'is-filled' : 'is-missing'}${frame === index ? ' is-current' : ''}`} data-frame-slot={index + 1}>
              <button type="button" aria-label={`Xem frame ${index + 1}`} aria-pressed={!playing && frame === index} onClick={() => { setFrame(index); setPlaying(false); }} style={{ width: '100%', padding: 0, overflow: 'hidden' }}>
                {image ? <img src={image.src} alt={`Frame ${index + 1}`} /> : exists && sheet ? <SpriteSheetCharacter sheet={sheet} action={action} facing={facing} frame={index} playing={false} style={{ width: '100%', height: 'auto', aspectRatio: '1' }} /> : <span style={{ display: 'grid', placeItems: 'center', aspectRatio: '1' }}>Chưa có ảnh</span>}
              </button>
              <strong>Frame {index + 1}{index > 3 && action === 'walk' ? ` · lặp ${index - 3}` : ''}</strong><p>{frameInstructions[index]}</p>
              <small>{image ? `${image.width}×${image.height} · ${image.name}` : exists ? `${sheet?.cellWidth}×${sheet?.cellHeight}` : 'Cần bổ sung ảnh'}</small>
              <label>Thay ảnh<input aria-label={`Ảnh frame ${index + 1}`} disabled={busy} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void importFrames(event, index)} /></label>
              <div className="sprite-editor__slot-controls"><button aria-label={`Dời frame ${index + 1} sang trái`} disabled={busy || index === 0 || !exists} type="button" onClick={() => void editSlot(index, 'left')}>←</button><button aria-label={`Dời frame ${index + 1} sang phải`} disabled={busy || index === actionFrameCount - 1 || !exists} type="button" onClick={() => void editSlot(index, 'right')}>→</button><button disabled={busy || !exists} type="button" aria-label={`Xóa frame ${index + 1}`} onClick={() => void editSlot(index, 'remove')}>Xóa</button></div>
            </article>;
          })}</div>
          <div className="sprite-editor__range"><input aria-label="Chọn frame xem trước" type="range" min="0" max={actionFrameCount - 1} value={Math.min(frame, actionFrameCount - 1)} onChange={event => { setFrame(Number(event.target.value)); setPlaying(false); }} /><output>{Math.min(frame, actionFrameCount - 1) + 1}/{actionFrameCount}</output></div>
        </section>
        <section className="sprite-editor__previews sprite-editor__previews--creator">
          <article className="sprite-editor__card"><header><div><span className="sprite-editor__eyebrow">CREATOR PREVIEW</span><h2>{subjectName} · {subjectGender === 'male' ? 'Nam' : 'Nữ'}</h2></div><code>{ready ? `${actionFrameCount} frame` : `chưa đủ ${actionFrameCount} frame`}</code></header><div className="sprite-editor__stage">{editingNpc
            ? <OpeningMapNpcArtwork npcId={editingNpc.id} appearance={appearance} design={editingNpc.design} artwork={editingNpc.artwork} pose={editingNpc.pose} facing={facing} action={action} frame={previewFrame} playing={previewPlaying} spriteSheet={previewSheet} className="sprite-editor__character" />
            : <CharacterSprite appearance={appearance} startingCharacter={template.id} spriteSheet={previewSheet} spriteAction={action} spriteFrame={previewFrame} spritePlaying={previewPlaying} facing={facing} className="sprite-editor__character" />}</div></article>
        </section>
        <details className="sprite-editor__card" open={!!atlas}><summary>Ảnh sprite sheet và lưới</summary>{atlasView ? <div className="sprite-editor__atlas" style={{ width: Math.min(720, atlasView.imageWidth), aspectRatio: `${atlasView.imageWidth} / ${atlasView.imageHeight}` }}><img src={atlasView.src} alt="Sprite sheet đang chỉnh" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /><div className="sprite-editor__grid">{Array.from({ length: Math.min(atlasTotal, 2048) }, (_, index) => { const cell = spriteCell(atlasView, index); const selected = atlas ? index >= atlasStart && index < atlasStart + actionFrameCount : !!range && index >= range.start && index < range.start + range.count; return <button key={index} type="button" disabled={!atlas} aria-label={`Ô sprite ${index + 1}`} className={selected ? 'is-selected' : ''} style={{ left: `${cell.x / atlasView.imageWidth * 100}%`, top: `${cell.y / atlasView.imageHeight * 100}%`, width: `${atlasView.cellWidth / atlasView.imageWidth * 100}%`, height: `${atlasView.cellHeight / atlasView.imageHeight * 100}%` }} onClick={() => setAtlasStart(index)}>{index + 1}</button>; })}</div></div> : <p>Chưa nhập ảnh.</p>}</details>
        <details className="sprite-editor__source"><summary>JSON cấu hình hiện tại</summary><pre>{JSON.stringify({ target, sheet: sheet ? { ...sheet, src: sheet.src.startsWith('data:') ? '[ảnh nhúng; Xuất JSON kèm ảnh để lấy đầy đủ]' : sheet.src } : null }, null, 2)}</pre></details>
      </div>
    </div>
    </div>
  </main>;
}
