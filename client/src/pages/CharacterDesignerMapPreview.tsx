import { useState } from 'react';
import { OpeningMapPage } from './OpeningMapPage';
import { createOpeningMapVillagers, DEFAULT_OPENING_MAP_NPCS, OPENING_MAP_NPC_IDS, OPENING_MAP_VILLAGER_SPRITE_NPCS, openingMapNpcSpriteTarget, useOpeningMapNpcs } from '../game/openingMapNpcs';
import { startingCharacterAppearance } from '../game/startingCharacters';
import { spriteSheetTarget, useAppliedSpriteSheet } from '../game/characterSpriteSheet';
import type { CharacterGender } from '../game/character';
import '../styles/character-designer-demo.css';

export function CharacterDesignerMapPreview() {
  const search = new URLSearchParams(window.location.search);
  const requestedNpc = search.get('npc');
  const npcId = [...OPENING_MAP_NPC_IDS, ...OPENING_MAP_VILLAGER_SPRITE_NPCS.map(npc => npc.id)].find(id => id === requestedNpc);
  const gender: CharacterGender = search.get('gender') === 'female' ? 'female' : 'male';
  const npcs = useOpeningMapNpcs();
  const villagerTemplate = npcs.find(character => character.id === 'messenger')
    ?? DEFAULT_OPENING_MAP_NPCS.find(character => character.id === 'messenger')
    ?? DEFAULT_OPENING_MAP_NPCS[0];
  const npc = npcId
    ? npcs.find(character => character.id === npcId)
      ?? DEFAULT_OPENING_MAP_NPCS.find(character => character.id === npcId)
      ?? createOpeningMapVillagers(villagerTemplate).find(character => character.id === npcId)
    : undefined;
  const target = npc ? openingMapNpcSpriteTarget(npc.id) : spriteSheetTarget('forest-keeper', gender);
  const sheet = useAppliedSpriteSheet(target);
  const [resetRevision, setResetRevision] = useState(0);

  return <main className="sprite-editor">
    <header className="sprite-editor__header">
      <div>
        <span className="sprite-editor__eyebrow">CHARACTER DESIGNER · MAP PREVIEW</span>
        <h1>Thử {npc?.name ?? `Người đi rừng · ${gender === 'male' ? 'Nam' : 'Nữ'}`} trên map</h1>
        <p>Map này mở riêng trong tab mới, dùng sprite đã lưu và không ghi đè vị trí đang chơi.</p>
      </div>
      <nav>
        <a href={`/debug/character-designer${npc ? `?npc=${encodeURIComponent(npc.id)}` : `?gender=${gender}`}`}>Quay lại chỉnh nhân vật</a>
        <button type="button" onClick={() => setResetRevision(value => value + 1)}>Đặt lại vị trí thử</button>
      </nav>
    </header>
    <section key={resetRevision} className="sprite-editor__map-preview" aria-label="Bản đồ thử nhân vật">
      <OpeningMapPage
        embedded
        appearance={npc?.appearance ?? startingCharacterAppearance('forest-keeper', gender)}
        startingCharacter={npc ? null : 'forest-keeper'}
        playerSpriteSheet={sheet}
        playerName={npc?.name ?? 'Người đi rừng'}
        previewNpc={npc}
        persistPlayerPosition={false}
      />
    </section>
  </main>;
}
