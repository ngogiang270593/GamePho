import { useJourney } from '../context/JourneyContext';
import { timeOfDay } from '../game/journey';

export function NeighborhoodLife({minute}:{minute?:number} = {}) {
  const { journey } = useJourney();
  const night = timeOfDay(minute ?? journey?.minute ?? 480) === 'night';
  return <g className={`neighborhood-life${night ? ' lights-on' : ''}`} aria-hidden="true">
    <path d="M530 230Q760 330 1000 232" fill="none" stroke="#7f7358" strokeWidth="2.5" />
    {[570,645,720,795,870,945].map((x,i) => <g key={x} transform={`translate(${x} ${260 + Math.sin(i / 5 * Math.PI) * 34})`} className="map-hanging-lantern"><circle cy="16" r="48" fill="#f6cb74" opacity={night ? .16 : 0} /><path d="M0-13V0" stroke="#79604a" strokeWidth="2" /><ellipse cy="16" rx="15" ry="22" fill={i%2 ? '#dba961' : '#bc6a4b'} stroke="#9e7048" strokeWidth="2" /><ellipse cy="16" rx="8" ry="19" fill="#ffe3a0" opacity={night ? .8 : .18} /><path d="M-12 0H12M-12 33H12M0 38V49" stroke="#e3bc72" strokeWidth="3" /></g>)}
    {[{x:194,y:295},{x:506,y:295},{x:645,y:286},{x:848,y:286},{x:1020,y:298},{x:1260,y:298},{x:110,y:875}].map((p,i) => <g key={i} transform={`translate(${p.x} ${p.y})`}><ellipse cy="13" rx="60" ry="29" fill="#ffe1a0" opacity={night ? .2 : 0} /><rect x="-8" y="-9" width="16" height="21" rx="4" fill={night ? '#ffe5a6' : '#c5a97a'} stroke="#96734d" /><path d="M-12-10H12M-11 12H11M0-17V-12" stroke="#93704f" strokeWidth="3" /></g>)}
    <g transform="translate(770 341)" stroke="#8d7956" strokeWidth="2"><path d="M-44-8H44V0H-44Z" fill="#bd9b6b" /><path d="M-37 0v19M36 0v19" strokeWidth="5" /><path d="M-26-14q26-13 52 0V-5H-26Z" fill="#fff2cc" /><path d="M0-23v17M-21-15h16M5-15h16" stroke="#bdb08c" strokeWidth="1.5" /></g>
    {journey?.decoration !== 'none' && journey && [{x:282,y:342},{x:420,y:342},{x:669,y:327}].map((p,i) => <g key={i} transform={`translate(${p.x} ${p.y})`}><path d="M-16-12H16L11 9H-11Z" fill="#af7959" stroke="#8d674c" strokeWidth="2" /><path d="M0-13v-31M-1-20l-10-8M1-22l10-9" fill="none" stroke="#779262" strokeWidth="3" />{[-12,0,12].map((x,j) => <g key={x} transform={`translate(${x} ${-30-j%2*12})`} fill={i%2 ? '#e0b56c' : '#c98b80'}><circle cx="-4" r="5" /><circle cx="4" r="5" /><circle cy="-4" r="5" /><circle cy="4" r="5" /><circle r="3" fill="#f8dfa1" /></g>)}</g>)}
  </g>;
}
