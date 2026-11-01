import { useMemo, useState } from 'react';
import { CharacterSprite } from '../components/CharacterSprite';
import { ForestKeeperActionSprite, type CharacterPreviewAction } from '../components/ForestKeeperActionSprite';
import { WorldMap } from '../components/WorldMap';
import type { Facing } from '../game/character';
import { startingCharacterInventory } from '../game/characterInventory';
import { STARTING_CHARACTERS, startingCharacterAppearance, type StartingCharacterId } from '../game/startingCharacters';
import '../styles/character-designer-demo.css';

const actions: { value: CharacterPreviewAction; label: string }[] = [
  { value: 'idle', label: 'Đứng' },
  { value: 'walk', label: 'Đi bộ' },
  { value: 'turn', label: 'Xoay' },
  { value: 'run', label: 'Chạy' },
  { value: 'jump', label: 'Nhảy' },
];
const directions: { value: Facing; label: string }[] = [
  { value: 'down', label: 'Trước' },
  { value: 'right', label: 'Phải' },
  { value: 'up', label: 'Sau' },
  { value: 'left', label: 'Trái' },
];

export function CharacterDesignerDemo() {
  const [templateId, setTemplateId] = useState<StartingCharacterId>('forest-keeper');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [action, setAction] = useState<CharacterPreviewAction>('walk');
  const [facing, setFacing] = useState<Facing>('down');
  const [showMap, setShowMap] = useState(true);
  const template = STARTING_CHARACTERS.find(item => item.id === templateId) ?? STARTING_CHARACTERS[0];
  const appearance = useMemo(() => startingCharacterAppearance(template.id, gender), [gender, template.id]);
  const customization = useMemo(() => startingCharacterInventory(appearance, template), [appearance, template]);
  const moving = action === 'walk' || action === 'run';

  return <main className="character-designer-demo">
    <header className="character-designer-demo__header">
      <div>
        <span className="character-designer-demo__eyebrow">SOURCE CONNECTED · DEMO TOOL</span>
        <h1>Thiết kế nhân vật</h1>
        <p>Dùng trực tiếp component, dữ liệu mẫu và sprite đang có trong source. Không cần gửi lại ảnh khi kiểm tra.</p>
      </div>
      <a href="/debug/forest-keeper-outfit" className="character-designer-demo__link">Demo outfit ↗</a>
    </header>

    <section className="character-designer-demo__controls" aria-label="Điều khiển thiết kế nhân vật">
      <label><span>Mẫu nhân vật</span><select value={templateId} onChange={event => setTemplateId(event.target.value as StartingCharacterId)}>
        {STARTING_CHARACTERS.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
      </select></label>
      <div><span>Giới tính</span><div className="character-designer-demo__segmented" role="group" aria-label="Giới tính">
        {(['male', 'female'] as const).map(value => <button key={value} type="button" aria-pressed={gender === value} onClick={() => setGender(value)}>{value === 'male' ? 'Nam' : 'Nữ'}</button>)}
      </div></div>
      <div><span>Hành động</span><div className="character-designer-demo__segmented" role="group" aria-label="Hành động">
        {actions.map(item => <button key={item.value} type="button" aria-pressed={action === item.value} onClick={() => setAction(item.value)}>{item.label}</button>)}
      </div></div>
      <div><span>Hướng nhìn</span><div className="character-designer-demo__segmented" role="group" aria-label="Hướng nhìn">
        {directions.map(item => <button key={item.value} type="button" aria-pressed={facing === item.value} onClick={() => setFacing(item.value)}>{item.label}</button>)}
      </div></div>
      <button className="character-designer-demo__map-toggle" type="button" aria-pressed={showMap} onClick={() => setShowMap(value => !value)}>{showMap ? 'Ẩn map demo' : 'Hiện map demo'}</button>
    </section>

    <section className="character-designer-demo__previews" aria-label="Xem trước nhân vật">
      <article className="character-designer-demo__card">
        <div className="character-designer-demo__card-heading"><div><span>CREATOR PREVIEW</span><h2>{template.name} · {gender === 'male' ? 'Nam' : 'Nữ'}</h2></div><code>{template.id}</code></div>
        <div className="character-designer-demo__stage">
          {template.id === 'forest-keeper'
            ? <ForestKeeperActionSprite gender={gender} action={action} facing={facing} className="character-designer-demo__sprite" />
            : <CharacterSprite appearance={appearance} customization={customization} startingCharacter={template.id} facing={facing} walking={moving} running={action === 'run'} className={`character-designer-demo__sprite designer-action-${action}`} />}
        </div>
        <p className="character-designer-demo__meta"><b>{action}</b> · {facing} · {template.id === 'forest-keeper' ? 'forest-rig-v2' : 'CharacterSprite SVG'}</p>
      </article>

      {showMap && <article className="character-designer-demo__card character-designer-demo__map-card">
        <div className="character-designer-demo__card-heading"><div><span>MAP PREVIEW</span><h2>Di chuyển thật trên map</h2></div><code>{moving ? `${action} atlas` : 'idle'}</code></div>
        <div className="character-designer-demo__map"><WorldMap appearance={appearance} customization={customization} startingCharacter={template.id} playerName="Demo" compact persist={false} /></div>
        <p className="character-designer-demo__meta">Dùng WASD / phím mũi tên trong khung map. Nam forest keeper sẽ dùng sprite 4 hướng khi đi bộ/chạy.</p>
      </article>}
    </section>

    <details className="character-designer-demo__source" open>
      <summary>Thông tin source đang dùng</summary>
      <pre>{JSON.stringify({ template: template.id, gender, action, facing, appearance, equipped: customization.equipped }, null, 2)}</pre>
    </details>
  </main>;
}
