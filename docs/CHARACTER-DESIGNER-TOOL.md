# Character Designer Demo

The source-connected sprite editor is available at `/debug/character-designer` (alias: `/debug/sprite-sheet-designer`).

The entry point is `client/src/pages/SpriteSheetDesignerDemo.tsx`. It imports a sprite sheet, edits the grid and frame ranges, then applies the same sheet to creator preview and the map. `Ghi vào source` writes a hashed image plus `client/src/game/characterSpriteSheets.json` through the local Vite endpoint. The tool does not write a game save or move the player's real map position.

To run it locally:

```powershell
cd client
npm install
npm run dev -- --host 127.0.0.1 --configLoader runner
```

Then open `http://127.0.0.1:5173/debug/character-designer`.

The main files to edit are:

- `client/src/pages/CharacterDesignerDemo.tsx`
- `client/src/pages/SpriteSheetDesignerDemo.tsx`
- `client/src/styles/character-designer-demo.css`
- `client/src/components/SpriteSheetCharacter.tsx`
- `client/src/game/characterSpriteSheet.ts`
- `client/src/components/CharacterSprite.tsx`
- `client/src/components/ForestKeeperActionSprite.tsx`
- `client/src/components/ForestKeeperMapActionSprite.tsx`
- `client/src/components/ForestKeeperOutfit.tsx`
- `client/src/AppRoutes.tsx`

Forest keeper uses the reference action atlas and the male four-direction map atlas. Other templates continue to use the shared procedural `CharacterSprite` renderer.
