import { useJourney } from '../context/JourneyContext';
import { timeOfDay } from '../game/journey';

// Screen-sized layers keep weather out of the controls and the speech panels.
export function WorldAtmosphere({ indoors = false, minute: overrideMinute, weather: overrideWeather }: { indoors?: boolean; minute?: number; weather?: string }) {
  const { journey } = useJourney();
  const minute = overrideMinute ?? journey?.minute ?? 480;
  const weather = overrideWeather ?? journey?.weather ?? 'clear';
  const stage = timeOfDay(minute);
  return <div className={`world-atmosphere atmosphere-${stage}${indoors ? ' is-indoors' : ''}`} data-time={stage} data-weather={weather} aria-hidden="true">
    <div className="atmosphere-shade" />
    {!indoors && <>
      <div className="atmosphere-sunrays" />
      {weather === 'rain' && <div className="atmosphere-rain">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ left: `${i * 4.6}%`, animationDelay: `${-i * .19}s`, animationDuration: `${.6 + i % 4 * .16}s` }} />)}<div className="rain-ripples" /></div>}
      {weather === 'breeze' && <div className="atmosphere-leaves">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ left: `${i * 15}%`, top: `${i % 4 * 23}%`, animationDelay: `${-i * 1.7}s` }} />)}</div>}
      {stage === 'night' && <div className="atmosphere-fireflies">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ left: `${7 + i * 6}%`, top: `${22 + i % 5 * 15}%`, animationDelay: `${-i * .37}s` }} />)}</div>}
    </>}
    {(stage === 'sunset' || stage === 'night') && <div className="atmosphere-lamplight"><i /><i /><i /></div>}
  </div>;
}
