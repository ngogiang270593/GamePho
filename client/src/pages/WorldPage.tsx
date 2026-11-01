import { Suspense, lazy, useCallback } from 'react';
import { offlineGame, onlineGame } from '../services/gameMode';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../context/GameContext';
import { normalizeAppearance } from '../game/character';
import { asWorldFeature, featurePath, WORLD_FEATURES, type WorldFeature } from '../game/world';
import { CharacterSprite } from '../components/CharacterSprite';
import { WorldMap } from '../components/WorldMap';
import { MapDialog } from '../components/MapDialog';
import { GameSaveControl } from '../components/GameSaveControl';
import { ShopPage } from './ShopPage';
import { CharacterPage } from './CharacterPage';
import { UpgradesPage } from './UpgradesPage';
import { AchievementsPage } from './AchievementsPage';
import { StatisticsPage } from './StatisticsPage';
import { SettingsPage } from './SettingsPage';
import { MapHelpPage } from './MapHelpPage';
import { JourneyPage } from './JourneyPage';
import { useJourney, useJourneyPause } from '../context/JourneyContext';
import { formatClock, TIME_LABEL, timeOfDay, WEATHER_LABEL } from '../game/journey';
import { VillageIllustration } from '../components/VillageIllustration';

const CardRoomPage = lazy(() => import('./CardRoomPage').then(module => ({ default: module.CardRoomPage })));

function LocationContent({ feature }: { feature: WorldFeature }) {
  switch (feature) {
    case 'shop': return <ShopPage />;
    case 'character': return <CharacterPage />;
    case 'upgrades': return <UpgradesPage />;
    case 'achievements': return <AchievementsPage />;
    case 'statistics': return <StatisticsPage />;
    case 'settings': return <SettingsPage />;
    case 'backup': return <section className="village-page"><VillageIllustration kind="backup" title="Hòm lưu niệm" subtitle="GIỮ CẢ NHỮNG NGÀY CHƯA KỂ HẾT" /><div className="village-paper"><GameSaveControl /><p>Bản lưu gồm tiền quán, tiến độ bảy ngày, các lựa chọn và kết thúc đã mở.</p></div></section>;
    case 'help': return <MapHelpPage />;
    case 'journal': return <JourneyPage />;
  }
}

export function WorldPage() {
  const { character, gameState } = useGameStore();
  const { feature: featureName } = useParams();
  const feature = asWorldFeature(featureName);
  const navigate = useNavigate();
  const close = useCallback(() => navigate('/map', { replace: true }), [navigate]);
  const appearance = normalizeAppearance(character.appearance);
  const player = gameState?.player;
  const { journey, paused, error: journeyError } = useJourney();
  useJourneyPause(Boolean(feature && feature !== 'shop'));

  if (localStorage.getItem('pho-xom-started') !== 'yes') return <Navigate to="/" replace />;
  if (featureName === 'football') return <Navigate to="/map/cards" replace />;
  if (featureName && !feature) return <Navigate to="/map" replace />;
  if (feature === 'cards') return <Suspense fallback={<p role="status">Đang mở bàn bài…</p>}><CardRoomPage /></Suspense>;

  if (feature === 'shop') return <section className={`shop-full-page location-shop${offlineGame || onlineGame ? ' counter-shop-page' : ''}`} aria-label="Trang bán phở" onKeyDown={event => { if (event.key === 'Escape' && !event.defaultPrevented) close(); }}>
    <header className="location-panel-heading"><h1>🍜 Quán Xóm Nhà Lá</h1><button type="button" className="location-panel-close" onClick={close}>← Trở lại map</button></header>
    <div className="location-panel-content"><ShopPage /></div>
  </section>;

  return <section className="world-game" aria-label="Xóm Nhà Lá · cuộc sống trong hẻm">
    <div className="world-status" aria-hidden={Boolean(feature)}>
      <div className="header-character"><CharacterSprite className="header-character-portrait" appearance={appearance} portrait /><div><small>XÓM NHÀ LÁ · HẺM 28</small><span>{character.displayName || 'Chủ quán mới'}</span></div></div>
      <div className="world-status-stats" aria-label="Trạng thái quán"><span>Ngày {journey?.chapter ?? player?.currentDay ?? 1}{journey ? '/7' : ''}</span><strong>🪙 {player ? `${player.money.toLocaleString('vi-VN')}đ` : '—'}</strong><span>♡ {player?.reputation ?? '—'} uy tín</span><span className="world-viral">🔥 {player?.viralScore ?? '—'}</span></div>
    </div>
    {journey && !feature && <div className="world-journey-hud"><button type="button" className="world-clock" onClick={() => navigate('/map/journal')} aria-label="Mở nhật ký ngày và thời gian"><span className={`clock-orb orb-${timeOfDay(journey.minute)}`} aria-hidden="true" /><strong>{formatClock(journey.minute)}</strong><span>{TIME_LABEL[timeOfDay(journey.minute)]} · {WEATHER_LABEL[journey.weather]}</span><small>{paused ? 'Tạm nghỉ' : journey.isOpen ? 'Quán đang mở' : 'Quán nghỉ · mở sổ ngày mới'}</small></button><button type="button" className={`world-goal${journey.pendingEvents.length ? ' has-story' : ''}`} onClick={() => navigate('/map/journal')}><small>{journey.pendingEvents.length ? `✉ ${journey.pendingEvents.length} CHUYỆN MỚI` : `CHƯƠNG ${journey.chapter} · ${journey.theme.title.toUpperCase()}`}</small><strong>{journey.theme.goal}</strong><span><i style={{ width: `${Math.min(100, journey.goalProgress / journey.theme.target * 100)}%` }} /></span><em>{Math.min(journey.goalProgress, journey.theme.target)}/{journey.theme.target} · {journey.pendingEvents.length ? 'Đọc và lựa chọn →' : 'Mở nhật ký →'}</em></button>{journeyError && <p className="world-connection-note" role="status">{journeyError}</p>}</div>}
    <WorldMap appearance={appearance} playerName={character.displayName} suspended={Boolean(feature)} onInteract={location => { if (location.feature) navigate(featurePath(location.feature)); }} />
    {feature && <MapDialog key={feature} title={`${WORLD_FEATURES[feature].icon} ${WORLD_FEATURES[feature].title}`} subtitle={WORLD_FEATURES[feature].hint} onClose={close} className={`location-${feature}`}>
      <LocationContent feature={feature} />
    </MapDialog>}
  </section>;
}
