export type OpeningMapLightPhase = 'night' | 'dawn' | 'morning' | 'noon' | 'afternoon' | 'sunset';
export type OpeningMapWeather = 'clear' | 'breeze' | 'cloudy' | 'rain';

export interface OpeningMapWeatherInfo {
  type: OpeningMapWeather;
  icon: string;
  label: string;
}

const WEATHER_PROFILES: readonly (readonly OpeningMapWeather[])[] = [
  ['clear', 'clear', 'clear', 'breeze', 'clear'],
  ['breeze', 'breeze', 'clear', 'breeze', 'cloudy'],
  ['cloudy', 'cloudy', 'cloudy', 'rain', 'cloudy'],
  ['cloudy', 'rain', 'rain', 'rain', 'cloudy'],
];

const WEATHER_INFO: Record<OpeningMapWeather, Omit<OpeningMapWeatherInfo, 'type'>> = {
  clear: { icon: '☀', label: 'Trời quang' },
  breeze: { icon: '🍃', label: 'Gió nhẹ' },
  cloudy: { icon: '☁', label: 'Nhiều mây' },
  rain: { icon: '🌧', label: 'Mưa rào' },
};

export function openingMapLightPhase(timeMinutes: number): OpeningMapLightPhase {
  const minute = ((timeMinutes % 1440) + 1440) % 1440;
  if (minute < 300 || minute >= 1170) return 'night';
  if (minute < 390) return 'dawn';
  if (minute < 600) return 'morning';
  if (minute < 900) return 'noon';
  if (minute < 1050) return 'afternoon';
  return 'sunset';
}

function daySeed(day: string): number {
  let seed = 0;
  for (let index = 0; index < day.length; index += 1) {
    seed = (seed * 31 + day.charCodeAt(index)) >>> 0;
  }
  return seed;
}

export function openingMapWeather(day: string, timeMinutes: number): OpeningMapWeatherInfo {
  const minute = ((timeMinutes % 1440) + 1440) % 1440;
  const period = Math.min(4, Math.floor(minute / 300));
  const profile = WEATHER_PROFILES[daySeed(day) % WEATHER_PROFILES.length];
  const type = profile[period];
  return { type, ...WEATHER_INFO[type] };
}

export function openingMapLightPhaseLabel(phase: OpeningMapLightPhase): string {
  return {
    night: 'Đêm',
    dawn: 'Rạng sáng',
    morning: 'Buổi sáng',
    noon: 'Giữa trưa',
    afternoon: 'Xế chiều',
    sunset: 'Hoàng hôn',
  }[phase];
}
