# Character movement designer

Open `http://127.0.0.1:5173/debug/character-designer` (alias `/debug/sprite-sheet-designer`). Run locally from `client` with `npm run dev -- --host 127.0.0.1 --configLoader runner`.

The tool edits the actual game states: standing when movement stops, walking with WASD/arrows, running with Shift + movement. Directions use the same mapping as the map:

The only playable character currently being developed is **Người đi rừng**. The `farmer` and `village-scholar` folders under `client/assets/characters` provide static reference images only; they are not character-creation choices and have no editable or playable animation.

| Keys | Stored direction | Required artwork |
| --- | --- | --- |
| W / ↑ | up | Back view |
| A / ← | left | Left profile |
| S / ↓ | down | Front view |
| D / → | right | Right profile |

Each action/direction has **8 real image frames**. A complete movement action has 32 frames across four directions, but each finished direction can be saved/applied independently. Other unfinished directions do not block it. An unfinished view uses the original character renderer on the test map instead of showing an imported image at the wrong angle.

1. Choose gender, action and direction for Người đi rừng.
2. Import exactly 8 PNG/JPEG/WebP files. Files sort naturally by name (`walk-down-01.png` … `walk-down-08.png`). Alternatively, explicitly enable repeating 4 poses and import 4 files: the order becomes **1,2,3,4,1,2,3,4**. You can replace, move or remove individual slots.
3. For walking: left foot forward/right arm forward; weight transfer/feet close; right foot forward/left arm forward; weight transfer/feet close. Frames 5–8 repeat those poses. Every frame has a matching prompt to use with the same reference artwork.
4. An individual 256×256 image stays a full 256×256 frame at slot 1. It is not cut into a guessed 4×4 grid or presented as a finished walking cycle. Add the missing poses. For an actual sprite sheet, adjust rows, columns, cells, offsets and gaps, select the first cell, then use 8 consecutive cells for the current action/direction.
5. Check FPS, looping, play/pause and each frame in creator preview. The map defaults to real movement: click the map and use WASD/arrows/Shift. Turning follows input; stopping keeps the same facing. Until separately authored, idle uses that direction's first walking frame and running uses that direction's walking sequence at running FPS. Distinct authored idle/run sequences are preserved.
6. **Lưu bản nháp** saves all imported images, empty slots, action settings and the atlas being cut, even at 1/8 frames. Drafts auto-save after edits and restore on page reload, separately for each Người đi rừng gender. Storage uses IndexedDB with a localStorage fallback; storage errors are displayed rather than reporting success.
7. **Lưu và áp dụng vào game** applies the completed directions and persists on this browser/origin. **Ghi ảnh + hành động vào source** saves the compiled PNG and manifest through local Vite; this endpoint is unavailable on static hosting. Incomplete images remain in the draft and are never discarded by applying another direction. Commit both asset and manifest to carry finished changes to GitHub/another machine. **Xuất JSON kèm ảnh** also works for partial drafts and includes every image and empty slot; import it elsewhere or ask AI to edit it. Older JSON files containing a sheet are still accepted.

The tool arranges supplied artwork; it does not generate new poses or camera angles from a single reference image. Importing another action or direction preserves existing sequences.

For each NPC, the initial sprite set is only **one front-facing signature action with 4–8 images**. Four images repeat into an eight-frame loop. NPCs stay at their placed map positions; no walk cycle, patrol, extra directions, or time-of-day action variants are needed for this first pass. The preview and game use the same NPC appearance, scale, foot anchor, and map renderer.

The opening-map NPC roster now contains 20 characters: the original five, ten village characters, and Hắc Lang, Mụ Độc Bà, A Cẩu, Huyết Đao Phượng and Quản Gia Triệu. Every profile links to its own front-facing sprite target. The ten village additions use persistent, first-pass interactions for their described quests, shops, rewards, affinity and unlocks; their actions do not use a time-of-day schedule. The five latest characters currently have map dialogue and scenery, without separate quest or combat logic.

The NPC profile editor has one **Thêm sprite động tác đặc trưng** link per character. It opens the NPC editor directly on the front-facing action. Import 4 or 8 ordered images, then use **Lưu và áp dụng vào game** to preview the result on the map. The action is saved in that NPC's own sprite sheet and does not alter the protagonist.

The map preview opens in a separate browser tab from **Mở map thử ở tab mới**. It uses the same watercolor `OpeningMapPage` and current NPC roster as gameplay, showing the character currently selected in the editor. NPC sheets use their own `opening-map-npc:<npc-id>` source keys; protagonist sheets use `forest-keeper:<gender>`. The preview never reads or writes the gameplay player position.

The **Mẫu ảnh tham khảo** gallery and all tool sections below it (NPC profile editing, roster management, NPC placement map, and NPC JSON controls) are intentionally not shown on this screen. NPC sprite sheets can still be edited through the character selector at the top using the compact front-facing four-to-eight-image workflow described above.

Main source files:

- `client/src/pages/SpriteSheetDesignerDemo.tsx` — editor and game preview.
- `client/src/components/CharacterDesignerMap.tsx` — full-width opening-map player and animation preview.
- `client/src/pages/OpeningMapPage.tsx` — map shared with gameplay and the separate movement-preview tab.
- `client/src/pages/CharacterDesignerMapPreview.tsx` — isolated map preview for the selected character.
- `client/src/game/openingMapNpcs.ts` and `openingMapNpcs.json` — shared NPC defaults, source overrides and live subscriptions.
- `client/src/game/mapCharacterDraft.ts` and `mapCharacterDraftValidation.mjs` — browser draft storage and validation shared with the NPC source endpoint.
- `client/src/game/openingMap.ts` — current map identity and dimensions shared by gameplay and draft validation.
- `client/src/game/characterActionFrames.ts` — eight-frame sequences, poses, atlas packing and extraction.
- `client/src/game/characterSpriteSheet.ts` — schema, validation, browser storage and live subscriptions.
- `client/src/game/characterDesignerDraft.ts` — independent draft validation/storage, including partial frame sets and ordered writes.
- `client/src/components/CharacterSprite.tsx` — shared creator/map rendering and movement state.
- `client/src/components/SpriteSheetCharacter.tsx` — full-cell display, frame timing and directions.
- `client/src/styles/character-designer-demo.css` — editor layout.
- `client/scripts/character-designer-source.mjs` — local source-write endpoint.
- `client/scripts/opening-map-npc-source.mjs` — local NPC source-write endpoint.
- `client/src/game/characterSpriteSheets.json` and `client/public/assets/character-designer/` — saved source manifest and images.

Validation: `npm exec vitest -- run src/game/characterActionFrames.test.ts src/components/SpriteSheetCharacter.test.tsx src/components/AppliedCharacterSprite.test.tsx --configLoader runner`, `node --test scripts/character-designer-source.node-check.mjs`, and `npm run build` from `client`. Browser check from repository root: `node scripts/check-eight-frame-designer.mjs --save-source` (Windows Chrome, local Vite port 5173). It checks full-frame import, eight-frame ordering, all four real map directions, browser persistence, source save and desktop/mobile layout. Its colored fixture atlas is restored/removed after checking; it does not replace production artwork.

NPC checks from `client`: `npm exec vitest -- run src/game/openingMapNpcs.test.tsx src/components/MapCharacterCreator.test.tsx src/pages/OpeningMapPage.test.tsx src/game/riverCampaign.test.ts --configLoader runner` and `node --test scripts/opening-map-npc-source.node-check.mjs`. These cover all 20 identities, source/browser precedence, hidden NPC restoration, rich draft round-trips, immediate game updates, coordinate validation, side-quest progress/rewards, atomic source merging and local endpoint access checks.
