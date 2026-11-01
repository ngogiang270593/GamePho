import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { CharacterSprite } from '../components/CharacterSprite';
import { SpriteSheetCharacter } from '../components/SpriteSheetCharacter';
import { WorldMap } from '../components/WorldMap';
import type { CharacterGender, Facing } from '../game/character';
import { STARTING_CHARACTERS, startingCharacterAppearance, type StartingCharacterId } from '../game/startingCharacters';
import { SPRITE_ACTIONS, applySpriteSheet, makeSpriteSheet, spriteCell, spriteSheetError, spriteSheetTarget, useAppliedSpriteSheet, type CharacterSpriteSheet, type SpriteAction } from '../game/characterSpriteSheet';
import '../styles/character-designer-demo.css';

const directions: { value: Facing; label: string }[] = [{ value: 'down', label: 'Trước' }, { value: 'right', label: 'Phải' }, { value: 'up', label: 'Sau' }, { value: 'left', label: 'Trái' }];
const labels: Record<SpriteAction, string> = { idle: 'Đứng', walk: 'Đi bộ', run: 'Chạy', turn: 'Xoay', jump: 'Nhảy' };

function readImage(file: File) {
  return new Promise<{ src: string; width: number; height: number }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được file ảnh.'));
    reader.onload = () => { const image = new Image(); image.onerror = () => reject(new Error('File không phải ảnh hợp lệ.')); image.onload = () => resolve({ src: String(reader.result), width: image.naturalWidth, height: image.naturalHeight }); image.src = String(reader.result); };
    reader.readAsDataURL(file);
  });
}

function patchSheet(sheet: CharacterSpriteSheet, patch: Partial<CharacterSpriteSheet>): CharacterSpriteSheet {
  return { ...sheet, ...patch, clips: patch.clips ?? sheet.clips };
}

export function SpriteSheetDesignerDemo() {
  const [templateId, setTemplateId] = useState<StartingCharacterId>('forest-keeper');
  const [gender, setGender] = useState<CharacterGender>('male');
  const [action, setAction] = useState<SpriteAction>('walk');
  const [facing, setFacing] = useState<Facing>('down');
  const [frame, setFrame] = useState(0);
  const [draft, setDraft] = useState<CharacterSpriteSheet | null>(null);
  const [status, setStatus] = useState<{ text: string; error?: boolean }>();
  const [saving, setSaving] = useState(false);
  const template = STARTING_CHARACTERS.find(item => item.id === templateId) ?? STARTING_CHARACTERS[0];
  const target = spriteSheetTarget(template.id, gender);
  const stored = useAppliedSpriteSheet(target);
  const sheet = draft ?? stored;
  const appearance = useMemo(() => startingCharacterAppearance(template.id, gender), [template.id, gender]);
  const clip = sheet?.clips[action] ?? sheet?.clips.walk ?? sheet?.clips.idle;
  const range = clip?.directions[facing];
  const selected = range ? Math.min(range.count - 1, Math.max(0, frame)) : 0;
  const total = sheet ? sheet.columns * sheet.rows : 0;
  useEffect(() => setFrame(0), [target, action, facing]);

  const update = (patch: Partial<CharacterSpriteSheet>) => {
    if (!sheet) return;
    const next = patchSheet(sheet, patch); setDraft(next);
    const error = spriteSheetError(next); setStatus(error ? { text: error, error: true } : undefined);
  };

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try { const image = await readImage(file); setDraft(makeSpriteSheet(image.src, image.width, image.height, file.name, 4, 4)); setStatus({ text: `Đã nạp ${file.name} · ${image.width}×${image.height}.` }); }
    catch (error) { setStatus({ text: error instanceof Error ? error.message : 'Không nạp được ảnh.', error: true }); }
    event.target.value = '';
  }

  async function applyLocal() {
    if (!sheet) return; const error = spriteSheetError(sheet); if (error) { setStatus({ text: error, error: true }); return; }
    try { await applySpriteSheet(target, sheet); setDraft(null); setStatus({ text: 'Đã áp dụng cùng sprite cho creator và map.' }); }
    catch (error) { setStatus({ text: error instanceof Error ? error.message : 'Chưa áp dụng được.', error: true }); }
  }

  async function saveSource() {
    if (!sheet) return; const error = spriteSheetError(sheet); if (error) { setStatus({ text: error, error: true }); return; }
    setSaving(true);
    try {
      const response = await fetch('/__character-designer/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target, sheet }) });
      const result = await response.json() as { sheet?: CharacterSpriteSheet; error?: string };
      if (!response.ok || !result.sheet) throw new Error(result.error ?? 'Không ghi được sprite vào source.');
      await applySpriteSheet(target, result.sheet); setDraft(null); setStatus({ text: `Đã ghi vào source: ${result.sheet.src}` });
    } catch (error) { setStatus({ text: error instanceof Error ? error.message : 'Không ghi được source.', error: true }); }
    finally { setSaving(false); }
  }

  return <main className="sprite-editor">
    <header className="sprite-editor__header"><div><span className="sprite-editor__eyebrow">SPRITE SOURCE EDITOR · LIVE MAP</span><h1>Đưa sprite vào nhân vật</h1><p>Nạp sprite sheet, chỉnh lưới frame và dùng cùng một ảnh cho creator lẫn nhân vật trong map.</p></div><nav><a href="/debug/forest-keeper-outfit">Outfit demo ↗</a></nav></header>
    <div className="sprite-editor__layout">
      <aside className="sprite-editor__sidebar">
        <section className="sprite-editor__panel sprite-editor__target"><label>Mẫu<select value={templateId} onChange={event => setTemplateId(event.target.value as StartingCharacterId)}>{STARTING_CHARACTERS.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Giới tính<select value={gender} onChange={event => setGender(event.target.value as CharacterGender)}><option value="male">Nam</option><option value="female">Nữ</option></select></label></section>
        <section className="sprite-editor__panel"><h2>1. Nạp sprite sheet</h2><label className="sprite-editor__drop"><strong>Chọn PNG / WebP / JPEG</strong><input type="file" accept="image/png,image/jpeg,image/webp" onChange={importFile} /><small>Ảnh được đọc trong trình duyệt, không upload ra ngoài.</small></label>{sheet ? <><div className="sprite-editor__fields"><label>Tên<input value={sheet.name} onChange={event => update({ name: event.target.value })} /></label><label>Tỉ lệ<input type="number" min=".1" max="4" step=".05" value={sheet.scale} onChange={event => update({ scale: Number(event.target.value) })} /></label></div><div className="sprite-editor__fields"><label>Ảnh rộng<input type="number" value={sheet.imageWidth} onChange={event => update({ imageWidth: Number(event.target.value) })} /></label><label>Ảnh cao<input type="number" value={sheet.imageHeight} onChange={event => update({ imageHeight: Number(event.target.value) })} /></label><label>Ô rộng<input type="number" value={sheet.cellWidth} onChange={event => update({ cellWidth: Number(event.target.value) })} /></label><label>Ô cao<input type="number" value={sheet.cellHeight} onChange={event => update({ cellHeight: Number(event.target.value) })} /></label><label>Cột<input type="number" min="1" value={sheet.columns} onChange={event => update({ columns: Number(event.target.value) })} /></label><label>Hàng<input type="number" min="1" value={sheet.rows} onChange={event => update({ rows: Number(event.target.value) })} /></label><label>Lề X<input type="number" min="0" value={sheet.offsetX} onChange={event => update({ offsetX: Number(event.target.value) })} /></label><label>Lề Y<input type="number" min="0" value={sheet.offsetY} onChange={event => update({ offsetY: Number(event.target.value) })} /></label></div></> : <div className="sprite-editor__empty">Chưa có sprite mới. Nạp ảnh để bắt đầu chỉnh.</div>}</section>
        <section className="sprite-editor__panel"><h2>2. Hành động và hướng</h2><div className="sprite-editor__actions">{SPRITE_ACTIONS.map(item => <button key={item} type="button" aria-pressed={action === item} onClick={() => setAction(item)}>{labels[item]}</button>)}</div><div className="sprite-editor__directions">{directions.map(item => <button key={item.value} type="button" aria-pressed={facing === item.value} onClick={() => setFacing(item.value)}>{item.label}</button>)}</div>{range && <label className="sprite-editor__field sprite-editor__field--wide">Frame {range.start + selected + 1}<input type="range" min="0" max={Math.max(0, range.count - 1)} value={selected} onChange={event => setFrame(Number(event.target.value))} /></label>}</section>
        <section className="sprite-editor__panel"><div className="sprite-editor__toolbar"><button className="primary" type="button" disabled={!sheet} onClick={() => void applyLocal()}>Áp dụng ngay</button><button className="primary" type="button" disabled={!sheet || saving} onClick={() => void saveSource()}>{saving ? 'Đang ghi…' : 'Ghi vào source'}</button></div><p className="sprite-editor__hint">Target: <code>{target}</code>. Ghi source tạo asset + manifest để map thật dùng lại.</p>{status && <p className={`sprite-editor__status${status.error ? ' is-error' : ''}`} role={status.error ? 'alert' : 'status'}>{status.text}</p>}</section>
      </aside>
      <main className="sprite-editor__main">
        <section className="sprite-editor__card"><header><div><span className="sprite-editor__eyebrow">ATLAS GRID</span><h2>Chọn frame trên ảnh</h2></div><code>{sheet ? `${sheet.imageWidth}×${sheet.imageHeight} · ${total} frame` : 'chưa nạp ảnh'}</code></header>{sheet ? <div className="sprite-editor__atlas" style={{ aspectRatio: `${sheet.imageWidth} / ${sheet.imageHeight}` }}><img src={sheet.src} alt="Sprite sheet đang chỉnh" /><div className="sprite-editor__grid">{Array.from({ length: total }, (_, index) => { const cell = spriteCell(sheet, index); const selectedCell = range && index === range.start + selected; return <button key={index} type="button" aria-pressed={Boolean(selectedCell)} className={selectedCell ? 'is-selected' : ''} style={{ left: `${cell.x / sheet.imageWidth * 100}%`, top: `${cell.y / sheet.imageHeight * 100}%`, width: `${sheet.cellWidth / sheet.imageWidth * 100}%`, height: `${sheet.cellHeight / sheet.imageHeight * 100}%` }} onClick={() => range && setFrame(Math.max(0, Math.min(range.count - 1, index - range.start)))} aria-label={`Frame ${index + 1}`}>{index + 1}</button>; })}</div></div> : <div className="sprite-editor__empty">Ảnh sprite sẽ hiển thị ở đây.</div>}</section>
        <section className="sprite-editor__previews"><article className="sprite-editor__card"><header><div><span className="sprite-editor__eyebrow">CREATOR PREVIEW</span><h2>{template.name} · {gender === 'male' ? 'Nam' : 'Nữ'}</h2></div><code>{sheet ? 'custom atlas' : 'source mặc định'}</code></header><div className="sprite-editor__stage">{sheet ? <SpriteSheetCharacter sheet={sheet} action={action} facing={facing} frame={selected} playing={false} className="sprite-editor__character" /> : <CharacterSprite appearance={appearance} startingCharacter={template.id} facing={facing} walking={action === 'walk'} running={action === 'run'} className="sprite-editor__character" />}</div></article><article className="sprite-editor__card"><header><div><span className="sprite-editor__eyebrow">MAP PREVIEW</span><h2>Cùng sprite trên map</h2></div><code>{sheet ? 'custom atlas' : 'source mặc định'}</code></header><div className="sprite-editor__map"><WorldMap appearance={appearance} startingCharacter={template.id} playerName="Demo" compact persist={false} playerSpriteSheet={sheet} previewMotion={{ action, facing, frame: selected, playing: true }} /></div><p className="sprite-editor__hint">Map dùng chung sprite và frame hiện tại. Sau khi ghi source, target này sẽ đọc manifest mới ở lần tải lại.</p></article></section>
        <details className="sprite-editor__source"><summary>JSON cấu hình hiện tại</summary><pre>{JSON.stringify({ target, sheet }, null, 2)}</pre></details>
      </main>
    </div>
  </main>;
}
