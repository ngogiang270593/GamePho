import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HistoryGamePage } from './pages/HistoryGamePage';
import { ForestKeeperOutfitPreview } from './pages/ForestKeeperOutfitPreview';
import { SpriteSheetDesignerDemo } from './pages/SpriteSheetDesignerDemo';
import { OpeningMapPage } from './pages/OpeningMapPage';
import { CharacterDesignerMapPreview } from './pages/CharacterDesignerMapPreview';
import { SceneryStudyPage } from './pages/SceneryStudyPage';

function OpeningMapRoute() {
  const navigate = useNavigate();
  return <OpeningMapPage onChapterEntry={entry => navigate('/chapter-1', { state: { riverCampaignEntry: entry } })} />;
}

export function AppRoutes() {
  return <Routes>
    <Route path="/debug/forest-keeper-outfit" element={<ForestKeeperOutfitPreview />} />
    <Route path="/debug/character-designer" element={<SpriteSheetDesignerDemo />} />
    <Route path="/debug/sprite-sheet-designer" element={<SpriteSheetDesignerDemo />} />
    <Route path="/debug/character-designer/map" element={<CharacterDesignerMapPreview />} />
    <Route path="/debug/scenery-study" element={<SceneryStudyPage />} />
    <Route element={<Layout />}>
    <Route index element={<HistoryGamePage />} />
    <Route path="uno" element={<HistoryGamePage />} />
    <Route path="chapter-1" element={<HistoryGamePage />} />
    <Route path="map" element={<OpeningMapRoute />} />
    <Route path="map/*" element={<OpeningMapRoute />} />
    <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>;
}
