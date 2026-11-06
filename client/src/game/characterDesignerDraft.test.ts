import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appliedSpriteSheet, makeSpriteSheet } from './characterSpriteSheet';
import { designerWorkspaceError, loadDesignerWorkspace, saveDesignerWorkspace, type DesignerWorkspace } from './characterDesignerDraft';
import { OPENING_MAP_VILLAGER_SPRITE_NPCS, openingMapNpcSpriteTarget } from './openingMapNpcs';

const image = 'data:image/png;base64,Y2hhcmFjdGVy';
const prefix = 'xnl-character-sprites-v1:draft:';
const clone = <T,>(value: T): T => value === undefined ? value : JSON.parse(JSON.stringify(value));

function workspace(target = 'forest-keeper:male'): DesignerWorkspace {
  return {
    version: 1, target, action: 'walk', facing: 'right', atlasStart: 3,
    draft: {
      pending: { 'walk:right': [null, null, { src: image, width: 256, height: 256, name: '03.png' }, null, null, null, null, null] },
      uncompiled: { 'walk:right': true },
    },
  };
}

/** Small asynchronous IndexedDB substitute; reads/writes finish only when their transaction commits. */
function indexedStorage() {
  const records = new Map<string, unknown>();
  const writes: { finish: () => void; key: string }[] = [];
  let holdWrites = false;
  const close = vi.fn();
  const db = {
    close, objectStoreNames: { contains: () => true },
    transaction: () => {
      const tx = { oncomplete: undefined as (() => void) | undefined, onerror: undefined, onabort: undefined, abort: vi.fn(),
        objectStore: () => ({
          put: (value: unknown, key: string) => {
            const request = { result: key };
            const finish = () => { records.set(key, clone(value)); tx.oncomplete?.(); };
            if (holdWrites) writes.push({ finish, key }); else queueMicrotask(finish);
            return request;
          },
          get: (key: string) => {
            const request = { result: clone(records.get(key)) };
            queueMicrotask(() => tx.oncomplete?.());
            return request;
          },
        }),
      };
      return tx;
    },
  };
  const open = vi.fn(() => {
    const request = { result: db, onsuccess: undefined as (() => void) | undefined };
    queueMicrotask(() => request.onsuccess?.());
    return request;
  });
  vi.stubGlobal('indexedDB', { open });
  return { records, close, open, writes, hold: () => { holdWrites = true; } };
}

beforeEach(() => { localStorage.clear(); vi.stubGlobal('indexedDB', undefined); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });

describe('character designer workspaces', () => {
  it('roundtrips one imported frame and seven empty slots before an atlas exists', async () => {
    const db = indexedStorage();
    const draft = workspace();
    const appliedBefore = appliedSpriteSheet(draft.target);
    await saveDesignerWorkspace(draft);
    expect(db.records.get('draft:forest-keeper:male')).toEqual(draft);
    expect(await loadDesignerWorkspace(draft.target)).toEqual(draft);
    expect(appliedSpriteSheet(draft.target)).toBe(appliedBefore);
    expect(db.close).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem(prefix + draft.target)).toBeNull();
  });

  it('stores compiled sheets, pending flags and optional atlases separately by gender', async () => {
    indexedStorage();
    const first = workspace();
    first.draft.sheet = makeSpriteSheet(image, 256, 256);
    first.atlas = makeSpriteSheet('/assets/character-designer/walk.png', 2048, 256, 'Walk', 8, 1);
    first.draft.uncompiled = { 'walk:right': false };
    const second = workspace('forest-keeper:female');
    second.draft.sheet = null;
    second.atlas = null;
    await Promise.all([saveDesignerWorkspace(first), saveDesignerWorkspace(second)]);
    expect(await loadDesignerWorkspace(first.target)).toEqual(first);
    expect(await loadDesignerWorkspace(second.target)).toEqual(second);
    await expect(loadDesignerWorkspace('field-worker:female')).rejects.toThrow('không hợp lệ');
  });

  it('accepts workspaces for the current NPC sprite targets only', async () => {
    const db = indexedStorage();
    const npc = workspace('opening-map-npc:herbalist-lang');
    await saveDesignerWorkspace(npc);
    expect(db.records.get('draft:opening-map-npc:herbalist-lang')).toEqual(npc);
    expect(designerWorkspaceError({ ...npc, target: 'opening-map-npc:market-vendor' })).toContain('không đúng');
  });

  it('saves and restores four-frame drafts for all three opening-map villagers', async () => {
    const db = indexedStorage();
    for (const npc of OPENING_MAP_VILLAGER_SPRITE_NPCS) {
      const target = openingMapNpcSpriteTarget(npc.id);
      const draft = workspace(target);
      draft.draft.pending['npc-morning:down'] = draft.draft.pending['walk:right'].slice(0, 4);
      delete draft.draft.pending['walk:right'];
      await saveDesignerWorkspace(draft);
      expect(db.records.get(`draft:${target}`)).toEqual(draft);
      expect(await loadDesignerWorkspace(target)).toEqual(draft);
    }

    const invalid = workspace(openingMapNpcSpriteTarget(OPENING_MAP_VILLAGER_SPRITE_NPCS[0].id));
    expect(designerWorkspaceError(invalid)).toContain('4 ô');
  });

  it('captures a snapshot and queues a newer explicit save behind the earlier autosave', async () => {
    const db = indexedStorage();
    db.hold();
    const initial = workspace();
    const first = saveDesignerWorkspace(initial);
    initial.atlasStart = 8;
    const newer = saveDesignerWorkspace(initial);
    await vi.waitFor(() => expect(db.writes).toHaveLength(1));
    db.writes[0].finish();
    await first;
    expect((db.records.get('draft:forest-keeper:male') as DesignerWorkspace).atlasStart).toBe(3);
    await vi.waitFor(() => expect(db.writes).toHaveLength(2));
    db.writes[1].finish();
    await newer;
    expect((await loadDesignerWorkspace(initial.target))?.atlasStart).toBe(8);
  });

  it('falls back to localStorage when IndexedDB is unavailable', async () => {
    const draft = workspace();
    await saveDesignerWorkspace(draft);
    expect(JSON.parse(localStorage.getItem(prefix + draft.target)!)).toEqual(draft);
    expect(await loadDesignerWorkspace(draft.target)).toEqual(draft);
  });

  it('bounds a blocked database open and still saves all imported frames', async () => {
    vi.useFakeTimers();
    const close = vi.fn();
    const request = { result: { close }, onsuccess: undefined as (() => void) | undefined };
    vi.stubGlobal('indexedDB', { open: () => request });
    const draft = workspace();
    const saving = saveDesignerWorkspace(draft);
    await vi.advanceTimersByTimeAsync(2001);
    await saving;
    expect(await loadDesignerWorkspace(draft.target)).toEqual(draft);
    request.onsuccess?.();
    expect(close).toHaveBeenCalledOnce();
  });

  it('prefers a newer fallback and clears it after a successful database save', async () => {
    const db = indexedStorage();
    const old = workspace();
    db.records.set('draft:' + old.target, old);
    const fresh = { ...old, atlasStart: 9 };
    localStorage.setItem(prefix + old.target, JSON.stringify(fresh));
    expect(await loadDesignerWorkspace(old.target)).toEqual(fresh);
    await saveDesignerWorkspace(fresh);
    expect(localStorage.getItem(prefix + old.target)).toBeNull();
    expect(await loadDesignerWorkspace(old.target)).toEqual(fresh);
  });

  it('reports a real save failure when both storage mechanisms are denied', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota', 'QuotaExceededError'); });
    await expect(saveDesignerWorkspace(workspace())).rejects.toThrow('Chưa lưu được bản nháp');
    expect(localStorage.getItem(prefix + 'forest-keeper:male')).toBeNull();
  });

  it('reports unreadable storage without pretending there is no saved workspace', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError'); });
    await expect(loadDesignerWorkspace('forest-keeper:male')).rejects.toThrow('chặn đọc bản nháp');
  });

  it('ignores malformed or mismatched saved records', async () => {
    const db = indexedStorage();
    localStorage.setItem(prefix + 'forest-keeper:male', '{not JSON');
    db.records.set('draft:forest-keeper:male', workspace('forest-keeper:female'));
    expect(await loadDesignerWorkspace('forest-keeper:male')).toBeNull();
    db.records.set('draft:forest-keeper:male', workspace());
    expect(await loadDesignerWorkspace('forest-keeper:male')).toEqual(workspace());
  });

  it.each([
    ['unknown version', (draft: DesignerWorkspace) => ({ ...draft, version: 2 })],
    ['unknown target', (draft: DesignerWorkspace) => ({ ...draft, target: 'someone:male' })],
    ['unknown action', (draft: DesignerWorkspace) => ({ ...draft, action: 'dance' })],
    ['unknown direction', (draft: DesignerWorkspace) => ({ ...draft, facing: 'north' })],
    ['negative atlas start', (draft: DesignerWorkspace) => ({ ...draft, atlasStart: -1 })],
    ['short slots', (draft: DesignerWorkspace) => ({ ...draft, draft: { pending: { 'walk:right': [null] } } })],
    ['wrong clip key', (draft: DesignerWorkspace) => ({ ...draft, draft: { pending: { 'walk:north': Array(8).fill(null) } } })],
    ['unsafe image URL', (draft: DesignerWorkspace) => ({ ...draft, draft: { pending: { 'walk:right': [{ src: 'javascript:alert(1)', width: 256, height: 256, name: 'bad' }, ...Array(7).fill(null)] } } })],
    ['zero image width', (draft: DesignerWorkspace) => ({ ...draft, draft: { pending: { 'walk:right': [{ src: image, width: 0, height: 256, name: 'bad' }, ...Array(7).fill(null)] } } })],
    ['nonboolean flag', (draft: DesignerWorkspace) => ({ ...draft, draft: { ...draft.draft, uncompiled: { 'walk:right': 1 } } })],
    ['invalid compiled sheet', (draft: DesignerWorkspace) => ({ ...draft, draft: { ...draft.draft, sheet: { version: 1 } } })],
  ])('rejects %s before saving', async (_name, invalidate) => {
    const invalid = invalidate(workspace());
    expect(designerWorkspaceError(invalid)).not.toBeNull();
    await expect(saveDesignerWorkspace(invalid as DesignerWorkspace)).rejects.toThrow();
    expect(localStorage.length).toBe(0);
  });
});
