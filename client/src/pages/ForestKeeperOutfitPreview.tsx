import { useState } from 'react';
import { CharacterSprite } from '../components/CharacterSprite';
import { ForestKeeperActionSprite, type CharacterPreviewAction } from '../components/ForestKeeperActionSprite';
import type { Facing } from '../game/character';
import { startingCharacterAppearance } from '../game/startingCharacters';
import '../styles/forest-keeper-preview.css';

const customization = {
  unlockedItems: ['clothes-forest-keeper', 'bottoms-ranger', 'shoes-ranger-boots', 'hat-forest-bandana', 'back-basket', 'front-herb-knife'],
  equipped: {
    clothes: 'clothes-forest-keeper',
    bottoms: 'bottoms-ranger',
    shoes: 'shoes-ranger-boots',
    hat: 'hat-forest-bandana',
    back: 'back-basket',
    front: 'front-herb-knife',
  },
  facing: 'front' as const,
};

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

export function ForestKeeperOutfitPreview() {
  const [showAlignment, setShowAlignment] = useState(false);
  const [action, setAction] = useState<CharacterPreviewAction>('walk');
  const [facing, setFacing] = useState<Facing>('down');
  return <main className="forest-keeper-preview">
    <header>
      <p className="forest-keeper-eyebrow">BỘ TRANG PHỤC KHỞI ĐẦU</p>
      <h1>Người giữ rừng</h1>
      <p>Trang phục dã ngoại gọn nhẹ, giữ nguyên gương mặt và vóc dáng của từng nhân vật.</p>
      <a className="forest-keeper-demo-link" href="/debug/character-designer">Mở tool thiết kế nhân vật ↗</a>
    </header>
    <label className="forest-keeper-debug-toggle">
      <input type="checkbox" checked={showAlignment} onChange={event => setShowAlignment(event.target.checked)} />
      Hiện khung căn chỉnh
    </label>
    <section className="forest-keeper-preview-grid" aria-label="Xem trước nhân vật nam và nữ">
      {(['male', 'female'] as const).map(gender => <article key={gender}>
        <div className="forest-keeper-scene">
          <span className="forest-keeper-scene-sun" aria-hidden="true" />
          <span className="forest-keeper-scene-hill" aria-hidden="true" />
          <CharacterSprite
            className="forest-keeper-preview-sprite"
            appearance={startingCharacterAppearance('forest-keeper', gender)}
            customization={customization}
            startingCharacter="forest-keeper"
            debugOutfitAlignment={showAlignment}
          />
        </div>
        <div className="forest-keeper-card-copy">
          <h2>{gender === 'male' ? 'Người giữ rừng · Nam' : 'Người giữ rừng · Nữ'}</h2>
          <p>Áo kiểm lâm · Quần túi hộp · Ủng đi rừng</p>
          <p>Băng đô lá · Giỏ thuốc · Dao hái thuốc</p>
        </div>
      </article>)}
    </section>
    <section className="forest-keeper-action-demo" aria-labelledby="forest-action-demo-title">
      <header>
        <p className="forest-keeper-eyebrow">DEMO SPRITE</p>
        <h2 id="forest-action-demo-title">Kiểm tra hành động nam trên map và màn tạo nhân vật</h2>
        <p>Đổi hướng hoặc hành động để kiểm tra đúng atlas sprite đang được dùng.</p>
      </header>
      <div className="forest-keeper-action-controls">
        <div role="group" aria-label="Hành động">
          {actions.map(item => <button key={item.value} type="button" aria-pressed={action === item.value} onClick={() => setAction(item.value)}>{item.label}</button>)}
        </div>
        <div role="group" aria-label="Hướng nhìn">
          {directions.map(item => <button key={item.value} type="button" aria-pressed={facing === item.value} onClick={() => setFacing(item.value)}>{item.label}</button>)}
        </div>
      </div>
      <div className="forest-keeper-action-grid">
        {(['male', 'female'] as const).map(gender => <article key={gender}>
          <h3>{gender === 'male' ? 'Nam · creator action atlas' : 'Nữ · creator action atlas'}</h3>
          <div className="forest-keeper-action-scene">
            <ForestKeeperActionSprite gender={gender} action={action} facing={facing} className="forest-keeper-action-sprite" />
          </div>
          <small data-testid={`demo-${gender}-action`}>{action} · {facing} · forest-rig-v2</small>
          {gender === 'male' && <>
            <h3>Nam · map sprite</h3>
            <div className="forest-keeper-action-scene forest-keeper-map-action-scene">
              <CharacterSprite
                appearance={startingCharacterAppearance('forest-keeper', 'male')}
                customization={customization}
                startingCharacter="forest-keeper"
                facing={facing}
                walking={action === 'walk'}
                running={action === 'run'}
                className="forest-keeper-action-sprite"
              />
            </div>
            <small data-testid="demo-male-map-action">{action === 'walk' || action === 'run' ? `${action} · ${facing} · forest-keeper-male-map-actions-v1` : 'Map dùng atlas khi đi bộ/chạy'}</small>
          </>}
        </article>)}
      </div>
    </section>
  </main>;
}
