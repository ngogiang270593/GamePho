import { useState } from 'react';
import type { CharacterAppearance, Facing } from '../game/character';
import type { CharacterSpriteSheet, SpriteAction } from '../game/characterSpriteSheet';
import type { PlayableCharacterId } from '../game/startingCharacters';
import { OpeningMapPage } from '../pages/OpeningMapPage';
import type { OpeningMapNpc } from '../game/openingMapNpcs';

export function CharacterDesignerMap({ appearance, startingCharacter, npc, sheet, realMap, onRealMap, previewMotion }: {
  appearance: CharacterAppearance;
  startingCharacter: PlayableCharacterId | null;
  npc?: OpeningMapNpc;
  sheet: CharacterSpriteSheet | null;
  realMap: boolean;
  onRealMap: (value: boolean) => void;
  previewMotion: { action: SpriteAction; facing: Facing; frame?: number; playing?: boolean };
}) {
  const [resetRevision, setResetRevision] = useState(0);

  return <section id="character-designer-map" className="sprite-editor__card sprite-editor__map-section" aria-label="Thử nhân vật trên bản đồ mới">
    <header>
      <div>
        <span className="sprite-editor__eyebrow">BẢN ĐỒ MỚI · LÀNG QUÊ MÀU NƯỚC</span>
        <h2>Thử nhân vật trên bản đồ mới</h2>
        <p className="sprite-editor__hint">Thử nhân vật giữa chợ làng và khám phá phong cảnh ở bốn hướng.</p>
      </div>
    </header>
    <div className="sprite-editor__map-toolbar">
      <label className="sprite-editor__check">
        <input type="checkbox" checked={realMap} onChange={event => onRealMap(event.target.checked)} />
        <span>Đi thử bằng WASD trên map</span>
      </label>
      <button type="button" onClick={() => setResetRevision(value => value + 1)}>Đặt lại vị trí thử</button>
    </div>
    <p className="sprite-editor__hint">{realMap
      ? 'Bấm vào bản đồ để bắt đầu. Dùng WASD / phím mũi tên, giữ Shift để chạy hoặc chạm đường để đi.'
      : 'Đang xem hành động, hướng và frame đã chọn trong trình thiết kế.'}</p>
    <OpeningMapPage key={resetRevision} embedded persistPlayerPosition={false}
      appearance={appearance} startingCharacter={startingCharacter}
      playerSpriteSheet={sheet} playerName="Nhân vật thử"
      previewNpc={npc}
      interactive={realMap} previewMotion={realMap ? undefined : previewMotion} />
    <p className="sprite-editor__hint">Vị trí trong phiên thử được giữ riêng với nhân vật đang chơi.</p>
  </section>;
}
