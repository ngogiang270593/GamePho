import { describe, expect, it } from 'vitest';
import { openingMapLightPhase, openingMapLightPhaseLabel, openingMapWeather } from './openingMapAtmosphere';

describe('opening map atmosphere', () => {
  it('uses smooth, detailed light periods without changing the campaign activity periods', () => {
    expect([
      openingMapLightPhase(0),
      openingMapLightPhase(300),
      openingMapLightPhase(390),
      openingMapLightPhase(600),
      openingMapLightPhase(900),
      openingMapLightPhase(1050),
      openingMapLightPhase(1170),
    ]).toEqual(['night', 'dawn', 'morning', 'noon', 'afternoon', 'sunset', 'night']);
    expect(openingMapLightPhaseLabel('sunset')).toBe('Hoàng hôn');
    expect(openingMapLightPhase(-1)).toBe('night');
  });

  it('keeps the forecast stable for a day while changing it over the in-game day', () => {
    const day = '2026-11-06';
    const first = openingMapWeather(day, 0);
    expect(openingMapWeather(day, 0)).toEqual(first);
    const dayWeather = [300, 600, 900, 1200, 1380].map(time => openingMapWeather(day, time).type);
    expect(dayWeather).toHaveLength(5);
    expect(new Set(dayWeather).size).toBeGreaterThan(1);
    expect(openingMapWeather(day, 1440)).toEqual(first);
    expect(openingMapWeather('2026-11-09', 600).type).toBe('rain');
  });
});
