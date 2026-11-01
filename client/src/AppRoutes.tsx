import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HistoryGamePage } from './pages/HistoryGamePage';
import { ForestKeeperOutfitPreview } from './pages/ForestKeeperOutfitPreview';
import { CharacterDesignerDemo } from './pages/CharacterDesignerDemo';
import { SpriteSheetDesignerDemo } from './pages/SpriteSheetDesignerDemo';

export function AppRoutes() {
  return <Routes>
    <Route path="/debug/forest-keeper-outfit" element={<ForestKeeperOutfitPreview />} />
    <Route path="/debug/character-designer" element={<SpriteSheetDesignerDemo />} />
    <Route path="/debug/sprite-sheet-designer" element={<SpriteSheetDesignerDemo />} />
    <Route element={<Layout />}>
    <Route index element={<HistoryGamePage />} />
    <Route path="uno" element={<HistoryGamePage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>;
}
