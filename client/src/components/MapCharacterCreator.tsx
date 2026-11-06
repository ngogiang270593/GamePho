import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { OpeningMapNpcArtwork } from './OpeningMapNpcArtwork';
import { OpeningMapPage } from '../pages/OpeningMapPage';
import { characterGenders, characterOptions, type CharacterGender } from '../game/character';
import type { MapOneNpcVisualDesign } from '../game/mapOneNpcDesign';
import { MAP_CHARACTER_DRAFT_KEY, parseMapCharacterDraft, readMapCharacterDraft, saveMapCharacterDraft, type MapCharacterDraft } from '../game/mapCharacterDraft';
import { DEFAULT_OPENING_MAP_NPCS, OPENING_MAP_ID, OPENING_MAP_NPC_IDS, resolveOpeningMapNpcRecords, type OpeningMapNpc } from '../game/openingMapNpcs';
import { OPENING_MAP_HEIGHT, OPENING_MAP_WIDTH } from '../game/openingMap';
import { NPC_WORK_SPRITE_ACTION } from '../game/characterSpriteSheet';
import type { Point } from '../game/world';

type DesignChoice = 'faceShape' | 'hairstyle' | 'outfit' | 'bodyType' | 'accessory' | 'weapon' | 'heldItem' | 'posture' | 'animationSet' | 'beardStyle';
const designChoices: { key: DesignChoice; label: string; options: readonly (readonly [string, string])[] }[] = [
  { key: 'bodyType', label: 'Dáng người', options: [['elderly-bent', 'Cao tuổi · khom lưng'], ['strong-arms', 'Cánh tay khỏe'], ['athletic', 'Săn chắc'], ['lean', 'Gầy'], ['broad-shouldered', 'Vai rộng'], ['petite', 'Nhỏ nhắn'], ['tall-slim', 'Cao gầy'], ['short-sturdy', 'Thấp chắc'], ['soft-middle', 'Đầy đặn'], ['stately', 'Đĩnh đạc'], ['compact', 'Gọn người'], ['child', 'Trẻ nhỏ']] },
  { key: 'faceShape', label: 'Khuôn mặt', options: [['wrinkled', 'Lão niên · nếp nhăn'], ['round', 'Tròn'], ['oval', 'Trái xoan'], ['long', 'Dài'], ['square', 'Vuông'], ['angular', 'Góc cạnh'], ['petite', 'Nhỏ'], ['high-cheek', 'Gò má cao'], ['broad-forehead', 'Trán rộng'], ['child', 'Trẻ nhỏ']] },
  { key: 'hairstyle', label: 'Kiểu tóc', options: [['silver-bun', 'Búi tóc bạc'], ['gray-topknot', 'Tóc bạc búi cao'], ['elder-wrap', 'Khăn người cao tuổi'], ['messy-short', 'Tóc ngắn rối'], ['cropped', 'Tóc ngắn gọn'], ['cloth-wrap', 'Quấn khăn'], ['warrior-knot', 'Búi võ sư'], ['low-ponytail', 'Đuôi ngựa thấp'], ['high-bun', 'Búi cao'], ['low-bun', 'Búi thấp'], ['braided', 'Tóc tết'], ['tied-back', 'Buộc phía sau'], ['loose-long', 'Tóc dài buông'], ['topknot', 'Búi trên đỉnh'], ['side-part', 'Rẽ ngôi'], ['scarf-tie', 'Buộc khăn']] },
  { key: 'outfit', label: 'Trang phục NPC', options: [['elder-cloak', 'Áo choàng người già'], ['river-tunic', 'Áo người chài'], ['light-armor', 'Giáp nhẹ võ sư'], ['messenger-vest', 'Áo giao liên'], ['guard-armor', 'Giáp đội tuần tra'], ['field-tunic', 'Áo làm ruộng'], ['market-wrap', 'Áo người bán hàng'], ['noble-robe', 'Áo dài trang trọng'], ['crossed-wrap', 'Áo vạt chéo'], ['smith-apron', 'Tạp dề thợ rèn'], ['healer-robe', 'Áo người chữa bệnh'], ['child-tunic', 'Áo trẻ nhỏ']] },
  { key: 'accessory', label: 'Phụ kiện', options: [['none', 'Không'], ['headband', 'Băng đầu'], ['cloth-tie', 'Dây vải'], ['headscarf', 'Khăn trùm đầu'], ['shoulder-sash', 'Dải vải ngang vai'], ['shoulder-guard', 'Giáp vai'], ['wrist-wrap', 'Vải quấn cổ tay'], ['herb-pouch', 'Túi thuốc'], ['woven-basket', 'Giỏ đan'], ['reed-hat', 'Nón'], ['hairpin', 'Trâm tóc'], ['bead-cord', 'Dây hạt']] },
  { key: 'weapon', label: 'Đạo cụ chính', options: [['none', 'Không'], ['walking-staff', 'Gậy chống'], ['paddle', 'Mái chèo'], ['practice-sword', 'Kiếm tập'], ['spear', 'Giáo lính canh'], ['shield', 'Khiên'], ['scroll', 'Cuộn thư'], ['medicine-bag', 'Túi thuốc'], ['grain-basket', 'Giỏ lương thực'], ['hammer', 'Búa'], ['flag', 'Cờ'], ['bow', 'Cung']] },
  { key: 'heldItem', label: 'Vật cầm tay', options: [['none', 'Không'], ['rope', 'Dây lưới'], ['bamboo-tablet', 'Thư / thẻ tre'], ['herbs', 'Thuốc'], ['medicine-bottle', 'Bình thuốc'], ['woven-basket', 'Giỏ đan'], ['grain-basket', 'Giỏ gạo'], ['market-goods', 'Hàng hóa'], ['trade-scale', 'Cân hàng'], ['water-bowl', 'Bát nước'], ['seed-bag', 'Túi hạt'], ['seedlings', 'Mạ'], ['hoe', 'Cuốc'], ['sickle', 'Liềm']] },
  { key: 'beardStyle', label: 'Râu', options: [['none', 'Không'], ['short', 'Ngắn'], ['full', 'Rậm'], ['long', 'Dài'], ['sparse', 'Thưa'], ['gray-short', 'Râu bạc ngắn'], ['gray-long', 'Râu bạc dài']] },
  { key: 'posture', label: 'Tư thế', options: [['stooped', 'Khom lưng'], ['upright', 'Đứng thẳng'], ['relaxed', 'Thả lỏng'], ['ready', 'Sẵn sàng'], ['working', 'Đang làm việc'], ['alert', 'Cảnh giác'], ['running', 'Giao liên'], ['leaning', 'Tựa người'], ['calm', 'Điềm tĩnh']] },
  { key: 'animationSet', label: 'Cử động khi đứng', options: [['resting', 'Nghỉ ngơi'], ['storytelling', 'Kể chuyện'], ['paddling', 'Chèo thuyền'], ['practice', 'Luyện tập'], ['guarding', 'Canh gác'], ['running', 'Đưa tin'], ['healing', 'Chữa thương'], ['trading', 'Bán hàng'], ['fieldwork', 'Làm ruộng'], ['hammering', 'Rèn'], ['commanding', 'Chỉ huy'], ['breathe', 'Thở nhẹ']] },
];
const kinds: readonly (readonly [OpeningMapNpc['kind'], string])[] = [['quest', 'Giao nhiệm vụ'], ['villager', 'Dân làng'], ['merchant', 'Người buôn bán'], ['guard', 'Mini-Boss / lính canh']];
function loadCharacters() {
  try { return { characters: readMapCharacterDraft().filter(item => OPENING_MAP_NPC_IDS.includes(item.id as typeof OPENING_MAP_NPC_IDS[number])), error: '' }; }
  catch (cause) { return { characters: [] as MapCharacterDraft[], error: cause instanceof Error ? cause.message : 'Không đọc được nhân vật đã lưu.' }; }
}

export function MapCharacterCreator({ selectedNpcId, onNpcSelect }: { selectedNpcId?: string; onNpcSelect?: (id: string) => void } = {}) {
  const [saved] = useState(loadCharacters);
  const [characters, setCharacters] = useState(saved.characters);
  const [storageError, setStorageError] = useState(saved.error);
  const [selectedId, setSelectedId] = useState(selectedNpcId ?? 'memory-keeper');
  const [placing, setPlacing] = useState(false);
  const [overview, setOverview] = useState(true);
  const [focusPoint, setFocusPoint] = useState<Point>();
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const records = useMemo(() => resolveOpeningMapNpcRecords(characters), [characters]);
  const npcs = records.filter(npc => !npc.hidden);
  const selected = npcs.find(npc => npc.id === (selectedNpcId ?? selectedId)) ?? npcs[0];
  const hidden = records.filter(npc => npc.hidden);

  useEffect(() => {
    if (selectedNpcId) setSelectedId(selectedNpcId);
  }, [selectedNpcId]);

  useEffect(() => {
    if (saved.error) return;
    try { saveMapCharacterDraft(characters); setStorageError(''); }
    catch (cause) { setStorageError(cause instanceof Error ? cause.message : 'Chưa lưu được nhân vật trên trình duyệt.'); }
  }, [characters, saved.error]);

  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      if (event.key !== MAP_CHARACTER_DRAFT_KEY) return;
      const next = loadCharacters(); setCharacters(next.characters); setStorageError(next.error);
    };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  function upsert(npc: MapCharacterDraft) {
    setCharacters(all => [...all.filter(item => item.id !== npc.id || item.mapId !== npc.mapId), npc]);
  }
  function patch(patch: Partial<OpeningMapNpc>) {
    if (selected) upsert({ ...selected, ...patch });
  }
  function design(patchDesign: Partial<MapOneNpcVisualDesign>) {
    if (selected) patch({ design: { ...selected.design, ...patchDesign } });
  }
  function chooseGender(gender: CharacterGender) {
    if (selected) patch({ appearance: { ...selected.appearance, gender }, design: { ...selected.design, ...(gender === 'female' ? { beardStyle: 'none' } : {}) } });
  }
  function place(point: Point) {
    if (!selected) return;
    patch({ point }); setPlacing(false);
    setNotice(`Đã đặt ${selected.name} tại ${Math.round(point.x)}, ${Math.round(point.y)} trên map khởi đầu mới nhất.`);
  }
  async function save(source = false) {
    setSaving(true); setNotice('');
    try {
      saveMapCharacterDraft(characters);
      if (source) {
        const opening = [...npcs, ...hidden];
        const response = await fetch('/__character-designer/save-map-characters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ characters: opening }) });
        const content = await response.text();
        let result: { characters?: MapCharacterDraft[]; error?: string };
        try { result = JSON.parse(content); } catch { throw new Error('Ghi source cần mở tool bằng npm run dev trên máy chứa dự án. Bản sửa vẫn đã lưu trên trình duyệt.'); }
        if (!response.ok || !result.characters) throw new Error(result.error ?? 'Không ghi được danh sách NPC vào source.');
        const next = parseMapCharacterDraft(result.characters);
        saveMapCharacterDraft(next); setCharacters(next);
      }
      setStorageError('');
      setNotice(source ? 'Đã ghi NPC, ngoại hình, vị trí và nhiệm vụ vào source. Map trong game dùng cùng cấu hình.' : 'Đã lưu NPC trên trình duyệt và áp dụng vào map mới nhất. Tải lại game vẫn giữ nhân vật.');
    } catch (cause) { setStorageError(cause instanceof Error ? cause.message : 'Không lưu được nhân vật.'); }
    finally { setSaving(false); }
  }

  function download() {
    const data = { version: 1, mapId: OPENING_MAP_ID, characters: [...npcs, ...hidden] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'npc-map-khoi-dau.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Đã xuất JSON đầy đủ NPC, ngoại hình, vị trí, hội thoại và nhiệm vụ để mang đi hoặc nhờ AI sửa.');
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      const entries: unknown = Array.isArray(value) ? value : value.characters;
      if (!Array.isArray(entries)) throw new Error('File cần chứa danh sách characters.');
      const incoming = parseMapCharacterDraft(entries);
      const next = [...characters];
      for (const npc of incoming) {
        const index = next.findIndex(item => item.mapId === npc.mapId && item.id === npc.id);
        if (index < 0) next.push(npc); else next[index] = npc;
      }
      saveMapCharacterDraft(next); setCharacters(next); setStorageError(''); setNotice('Đã nhập và lưu NPC vào map khởi đầu.');
    } catch (cause) { setStorageError(cause instanceof Error ? cause.message : 'Không nhập được JSON nhân vật.'); }
  }

  return <section className="sprite-editor__map-creator npc-editor" aria-labelledby="map-character-title">
    <header className="npc-editor__heading"><div><span className="sprite-editor__eyebrow">{npcs.length} NHÂN VẬT PHỤ · MAP KHỞI ĐẦU MỚI NHẤT</span><h2 id="map-character-title">Thiết kế NPC và nhiệm vụ trên map</h2><p>Chọn từng người để sửa tạo hình, hành động, ảnh và vị trí. Mỗi NPC dùng một động tác hướng trước, không đi tuần.</p></div><div className="npc-editor__actions"><a href="/map" target="_blank" rel="noreferrer">Mở map trong game ↗</a></div></header>
    <div className="npc-editor__layout">
      <aside className="sprite-editor__panel npc-editor__roster"><h3>Danh sách nhân vật</h3><p className="sprite-editor__hint">{npcs.length} / {OPENING_MAP_NPC_IDS.length} nhân vật trên map.</p><nav aria-label="Chọn nhân vật phụ">{npcs.map(npc => <button key={npc.id} type="button" aria-label={`Chỉnh ${npc.name}`} aria-pressed={selected?.id === npc.id} className={`npc-editor__card${selected?.id === npc.id ? ' is-selected' : ''}`} onClick={() => { setSelectedId(npc.id); onNpcSelect?.(npc.id); setPlacing(false); setNotice(''); }}>
        <OpeningMapNpcArtwork npcId={npc.id} appearance={npc.appearance} design={npc.design} artwork={npc.artwork} pose={npc.pose} facing={npc.facing} className="npc-editor__card-sprite" portrait />
        <span><strong>{npc.name}</strong>{npc.alias && <small>{npc.alias}</small>}<small>{npc.locationLabel}</small><span className={`npc-editor__badge${npc.kind === 'guard' ? ' is-guard' : ''}`}>{kinds.find(kind => kind[0] === npc.kind)?.[1]}</span></span>
      </button>)}</nav>
      {hidden.length > 0 && <details><summary>NPC đã ẩn ({hidden.length})</summary>{hidden.map(npc => <button type="button" key={npc.id} onClick={() => upsert({ ...npc, hidden: false })}>Hiện lại {npc.name}</button>)}</details>}
      </aside>
      {selected ? <section className="sprite-editor__panel npc-editor__form" aria-label={`Hồ sơ ${selected.name}`}>
        <div className="npc-editor__profile"><div className="npc-editor__portrait"><OpeningMapNpcArtwork npcId={selected.id} appearance={selected.appearance} design={selected.design} artwork={selected.artwork} facing={selected.facing} pose={selected.pose} className="npc-editor__portrait-sprite" /><strong>{selected.name}</strong><small>{selected.alias}</small></div>
          <div className="sprite-editor__fields"><label>Tên nhân vật<input aria-label="Tên nhân vật" maxLength={64} value={selected.name} onChange={event => patch({ name: event.target.value })} /></label><label>Tên gọi / biệt danh<input maxLength={64} value={selected.alias} onChange={event => patch({ alias: event.target.value })} /></label>
            <label>Vai trò<input maxLength={300} value={selected.role} onChange={event => patch({ role: event.target.value })} /></label><label>Loại NPC<select value={selected.kind} onChange={event => patch({ kind: event.target.value as OpeningMapNpc['kind'] })}>{kinds.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Khu vực / vị trí<input aria-label="Khu vực / vị trí" maxLength={100} value={selected.locationLabel} onChange={event => patch({ locationLabel: event.target.value })} /></label>
            <label>Tọa độ X<input type="number" min="0" max={OPENING_MAP_WIDTH} value={Math.round(selected.point.x)} onChange={event => patch({ point: { ...selected.point, x: Number(event.target.value) } })} /></label><label>Tọa độ Y<input type="number" min="0" max={OPENING_MAP_HEIGHT} value={Math.round(selected.point.y)} onChange={event => patch({ point: { ...selected.point, y: Number(event.target.value) } })} /></label>
          </div>
        </div>
        <fieldset className="npc-editor__group"><legend>Ngoại hình và trang phục</legend><div className="sprite-editor__creator-genders" role="group" aria-label="Giới tính NPC">{characterGenders.map(gender => <button type="button" key={gender.value} aria-pressed={selected.appearance.gender === gender.value} onClick={() => chooseGender(gender.value)}>{gender.label}</button>)}</div>
          <div className="sprite-editor__fields">{designChoices.map(field => <label key={field.key}>{field.label}<select value={selected.design[field.key]} onChange={event => design({ [field.key]: event.target.value } as Partial<MapOneNpcVisualDesign>)}>{!field.options.some(([value]) => value === selected.design[field.key]) && <option value={selected.design[field.key]}>{selected.design[field.key]}</option>}{field.options.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>)}
            <label>Màu da<select value={selected.appearance.skin} onChange={event => patch({ appearance: { ...selected.appearance, skin: event.target.value as typeof selected.appearance.skin }, design: { ...selected.design, skinTone: event.target.value as typeof selected.appearance.skin } })}>{characterOptions.skin.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            {(['outfitColor', 'accentColor', 'trouserColor'] as const).map((key, index) => <label key={key}>{['Màu áo / giáp', 'Màu viền', 'Màu quần'][index]}<input type="color" value={selected.design[key]} onChange={event => design({ [key]: event.target.value })} /></label>)}
            {(['height', 'shoulderWidth', 'bodyWidth'] as const).map((key, index) => <label key={key}>{['Chiều cao', 'Độ rộng vai', 'Độ rộng thân'][index]}<input type="number" min=".6" max="1.4" step=".02" value={selected.design[key]} onChange={event => design({ [key]: Number(event.target.value) })} /></label>)}
            <label>Tỉ lệ trên map<input type="number" min=".5" max="2" step=".05" value={selected.scale} onChange={event => patch({ scale: Number(event.target.value) })} /></label>
          </div>
        </fieldset>
        <fieldset className="npc-editor__group"><legend>Hội thoại và nhiệm vụ</legend><label>Nhiệm vụ nhân vật giao<textarea className="npc-editor__textarea" aria-label="Nhiệm vụ nhân vật giao" maxLength={2000} value={selected.mission} onChange={event => patch({ mission: event.target.value })} /></label><label>Lời thoại khi tương tác<textarea className="npc-editor__textarea" aria-label="Lời thoại khi tương tác" maxLength={2000} value={selected.dialogue} onChange={event => patch({ dialogue: event.target.value })} /></label></fieldset>
        <fieldset className="npc-editor__group"><legend>Động tác NPC trên map</legend><p className="sprite-editor__hint">Giai đoạn đầu chỉ cần 4 hình cho một động tác đặc trưng hướng trước; NPC đứng tại vị trí đã đặt và phát động tác này trên map.</p><a className="npc-editor__schedule-sprite-link" href={`/debug/character-designer?npc=${encodeURIComponent(selected.id)}&action=${NPC_WORK_SPRITE_ACTION}`} target="_blank" rel="noreferrer">Thêm sprite động tác đặc trưng ↗</a></fieldset>
        <div className="npc-editor__actions"><button type="button" aria-pressed={placing} onClick={() => { setPlacing(value => !value); setOverview(true); }}>{placing ? 'Hủy chọn vị trí' : 'Chọn lại vị trí trên map'}</button><button type="button" onClick={() => { setFocusPoint({ ...selected.point }); setOverview(false); }}>Đến vị trí NPC · góc nhìn game</button><button type="button" onClick={() => patch({ hidden: true })}>Ẩn NPC</button>{DEFAULT_OPENING_MAP_NPCS.some(npc => npc.id === selected.id) && <button type="button" onClick={() => upsert(structuredClone(DEFAULT_OPENING_MAP_NPCS.find(npc => npc.id === selected.id)!))}>Khôi phục mẫu đã chọn</button>}</div>
      </section> : <section className="sprite-editor__panel"><p>Chưa có nhân vật đang hiển thị. Tạo NPC mới hoặc hiện lại nhân vật đã ẩn.</p></section>}
    </div>
    <div className="sprite-editor__panel npc-editor__actions"><button type="button" disabled={saving} onClick={() => void save(false)}>Lưu và áp dụng NPC vào game</button><button type="button" disabled={saving} onClick={() => void save(true)}>{saving ? 'Đang lưu…' : 'Ghi NPC vào source'}</button><button type="button" onClick={download}>Xuất JSON NPC</button><label>Nhập JSON NPC<input aria-label="Nhập JSON NPC" type="file" accept="application/json,.json" onChange={event => void importJson(event)} /></label><span className="sprite-editor__hint">Thay đổi được tự lưu trên trình duyệt. Ghi source để game trên máy khác dùng cùng bộ NPC.</span></div>
    {storageError && <p className="sprite-editor__status is-error" role="alert">{storageError}</p>}{notice && <p className="sprite-editor__status" role="status">{notice}</p>}
    <section id="npc-map-preview" className="npc-editor__map"><header className="npc-editor__map-toolbar"><div><h3>Map khởi đầu mới nhất · bố trí nhân vật phụ</h3><p>{placing && selected ? `Bấm vào vùng trống để đặt ${selected.name}.` : 'Chọn NPC trên map để sửa hồ sơ. Chế độ góc nhìn game dùng cùng camera và di chuyển như khi chơi.'}</p></div><button type="button" aria-pressed={overview} onClick={() => setOverview(value => !value)}>{overview ? 'Chuyển sang góc nhìn game 10×' : 'Xem toàn cảnh để bố trí NPC'}</button></header>
      <OpeningMapPage embedded overview={overview} npcs={npcs} selectedNpcId={selected?.id} placingNpc={placing} onNpcPlace={place} onNpcSelect={id => { setSelectedId(id); setPlacing(false); }} focusPoint={focusPoint} persistPlayerPosition={false} />
    </section>
  </section>;
}
