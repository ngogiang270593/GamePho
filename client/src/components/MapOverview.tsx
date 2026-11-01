import { useId, useMemo } from 'react';
import { WORLD_FEATURES, WORLD_LOCATIONS, type HistoricalLandscape, type MapBuilding, type Point, type WorldFeature, type WorldFeatureInfo, type WorldLocation } from '../game/world';
import { NeighborhoodGround, neighborhoodScenery } from './NeighborhoodScene';
import { MapDialog } from './MapDialog';
import { MAP_ONE_WORLD_SIZE } from '../game/mapOneMap';

interface MapOverviewProps {
  point: Point;
  onClose: () => void;
  onSelect: (location: WorldLocation) => void;
  locations?: readonly WorldLocation[];
  featureLabels?: Partial<Record<WorldFeature, WorldFeatureInfo>>;
  worldName?: string;
  buildings?: readonly MapBuilding[];
  landscape?: HistoricalLandscape;
  historyMode?: boolean;
  fame?: number;
}

export function MapOverview({ point, onClose, onSelect, locations = WORLD_LOCATIONS, featureLabels, worldName = 'HẺM 28 · XÓM MÌNH', buildings, landscape, historyMode = false, fame = 0 }: MapOverviewProps) {
  const id = `overview-${useId().replace(/:/g, '')}`;
  const scenery = useMemo(() => neighborhoodScenery(buildings, historyMode, landscape), [buildings, historyMode, landscape]);
  const worldWidth = landscape === 'me-linh' ? MAP_ONE_WORLD_SIZE.width : 1440;
  const worldHeight = landscape === 'me-linh' ? MAP_ONE_WORLD_SIZE.height : 1040;
  const places = locations.filter(location => !location.id.startsWith('me-linh-hidden-') && (location.feature || location.destinationMapId));
  const legacyLabel = (location: WorldLocation, activity: string) => {
    const gateNote = location.unlockAt !== undefined && fame < location.unlockAt ? ` · Cần ${location.unlockAt} danh vọng` : '';
    if (location.id === 'hero-hai-ba-trung') return `Hai Bà Trưng · Gặp gỡ xóm làng${gateNote}`;
    return `${activity} · ${location.name}${gateNote}`;
  };
  const infoFor = (location: WorldLocation) => location.destinationMapId
    ? { title: location.name, activity: location.action, icon: location.unlockAt !== undefined && fame < location.unlockAt ? '🔒' : '🧭', hint: location.dialogue ?? location.action }
    : location.icon ? {title:location.name,activity:location.action,icon:location.icon,hint:location.action} : featureLabels?.[location.feature!] ?? WORLD_FEATURES[location.feature!];
  return <MapDialog title="Sơ đồ xóm" subtitle={historyMode ? 'Mỗi căn nhà giữ một chức năng. Chọn nơi muốn ghé hoặc tự đi bộ đến đó.' : 'Chọn một địa điểm để ghé ngay, hoặc trở lại map và tự đi khám phá.'} onClose={onClose} className="location-overview">
    <div className="neighborhood-overview">
      <div className="overview-drawing" aria-label={`Sơ đồ ${worldName}`}>
        <svg viewBox={`0 0 ${worldWidth} ${worldHeight}`} aria-hidden="true"><NeighborhoodGround id={id} label={worldName} landscape={landscape} />{scenery.map(item => <g key={item.id}>{item.element}</g>)}<circle cx={point.x} cy={point.y} r="22" fill="#bf4e38" stroke="#fff6d4" strokeWidth="8" /><text x={point.x} y={point.y - 34} textAnchor="middle" fill="#753f2f" stroke="#fff9e7" strokeWidth="7" paintOrder="stroke" fontSize="22" fontWeight="900">BẠN</text></svg>
        {places.map((location, index) => (
          <button key={location.id} className="overview-pin" type="button" style={{ left: `${location.point.x / worldWidth * 100}%`, top: `${location.point.y / worldHeight * 100}%` }} title={legacyLabel(location, historyMode ? location.action : infoFor(location).activity)} disabled={location.unlockAt !== undefined && fame < location.unlockAt} onClick={() => onSelect(location)}>{index + 1}</button>
        ))}
        <span className="overview-map-stamp">{worldName}</span>
      </div>
      <div className="overview-legend" aria-label="Chọn địa điểm">{places.map((location, index) => {
        const info = infoFor(location);
        const locked = location.unlockAt !== undefined && fame < location.unlockAt;
        const activity = historyMode ? location.action : info.activity;
        const buttonLabel = legacyLabel(location, activity);
        return <button type="button" key={location.id} data-feature={location.feature} disabled={locked} aria-label={buttonLabel} onClick={() => onSelect(location)}><span className="overview-number">{index + 1}</span><span className="overview-location-icon" aria-hidden="true">{info.icon}</span><span><strong>{activity}</strong><small>{location.name}</small></span><span className="overview-location-arrow" aria-hidden="true">↗</span></button>;
      })}</div>
      <p className="overview-note">Chấm đỏ là bạn. Đến gần người dân rồi nhấn <kbd>E</kbd> để trò chuyện.</p>
    </div>
  </MapDialog>;
}
