import { useId } from 'react';
import { CharacterSprite } from './CharacterSprite';
import { NeighborSprite } from './NeighborSprite';
import { NEIGHBORS } from '../game/npcs';
import { PetSprite } from './PetSprite';

export type RoomKind = 'journal' | 'upgrades' | 'statistics' | 'achievements' | 'settings' | 'backup' | 'help';
export function VillageIllustration({ kind, title, subtitle = '' }: { kind: RoomKind; title: string; subtitle?: string }) {
  const id = useId().replace(/:/g, '');
  const npc = NEIGHBORS[kind === 'upgrades' ? 4 : kind === 'statistics' ? 5 : kind === 'help' ? 1 : 0];
  return <div className={`village-illustration illustration-${kind}`}>
    <svg viewBox="0 0 1000 270" role="img" aria-label={title}>
      <defs><linearGradient id={`wall-${id}`} x2="0" y2="1"><stop stopColor="#e8dfbd" /><stop offset="1" stopColor="#f6edcf" /></linearGradient><pattern id={`floor-${id}`} width="95" height="34" patternUnits="userSpaceOnUse"><rect width="95" height="34" fill="#c4aa7a" /><path d="M0 33h95M94 0v34" stroke="#ad9468" strokeWidth="1" /></pattern></defs>
      <rect width="1000" height="270" fill={`url(#wall-${id})`} /><rect y="208" width="1000" height="62" fill={`url(#floor-${id})`} /><path d="M0 209H1000" stroke="#a18b64" strokeWidth="8" />
      <path d="M-20 35Q260 83 500 34T1020 35" fill="none" stroke="#8c7858" strokeWidth="2" />
      {[80, 260, 740, 920].map((x, i) => <g key={x} transform={`translate(${x} ${i % 2 ? 57 : 45})`} className="room-lantern"><path d="M0-10v10" stroke="#88724e" strokeWidth="2" /><ellipse cy="16" rx="17" ry="23" fill={i % 2 ? '#d9a65b' : '#b56a4d'} stroke="#996c48" /><path d="M-14 3h28M-14 30h28M0 39v12" stroke="#e9c47d" strokeWidth="3" /><ellipse cy="14" rx="9" ry="18" fill="#f5d493" opacity=".22" /></g>)}
      <g transform="translate(40 118)" stroke="#746e51" strokeWidth="2"><path d="M0 88V0h142v88M14 22h115M14 55h115" fill="#a5b18b" /><path d="M4 0l10-16h113l15 16" fill="#81916d" />{[0,1,2].map(i => <g key={i} transform={`translate(${20 + i * 44} 34)`}><path d="M0 0h22v18H0Z" fill={i % 2 ? '#b28567' : '#d5bd87'} /><path d="M3-3h16M6-9h10" stroke="#e3d9b4" strokeWidth="5" /></g>)}</g>
      <g transform="translate(810 151)" stroke="#7c6c50" strokeWidth="2"><path d="M0 27h139v49H0Z" fill="#d7b57e" /><path d="M-7 22h151v13H-7Z" fill="#e6c794" /><path d="M7 75v22M130 75v22" strokeWidth="7" />
        {kind === 'backup' ? <g><path d="M30-25h75v49H30Z" fill="#a67c53" /><path d="M27-25q40-35 81 0Z" fill="#bc9568" /><rect x="60" y="-9" width="13" height="21" rx="3" fill="#d7be7a" /><path d="M66-5v7" stroke="#786042" /></g> : kind === 'upgrades' ? <g><path d="M26-24h84v41Q69 42 26 17Z" fill="#839589" /><ellipse cx="68" cy="-24" rx="42" ry="13" fill="#c6cfb3" /><path d="M30-45q-8-15 0-26M64-45q-8-15 0-26M98-45q-8-15 0-26" fill="none" stroke="#fff9e9" strokeWidth="4" className="room-steam" /></g> : <g><path d="M23-11h90v30H23Z" fill="#fff0cc" /><path d="M28-4h78M28 3h65M28 10h72" stroke="#c1ac7d" /><path d="M58-35l24 23" stroke="#786550" strokeWidth="4" /></g>}
      </g>
      <NeighborSprite x="190" y="75" width="130" height="182" npcId={npc.id} pose="order" emotion="happy" />
      <PetSprite x="727" y="201" width="67" height="68" pet="cat" />
      <g transform="translate(350 84)"><path d="M-8-7H330V110H-8Z" fill="#c9ad78" /><path d="M0 0H322V102H0Z" fill="#fff4d6" stroke="#a38c60" strokeWidth="2" /><path d="M18 13h285M18 90h285" stroke="#decba1" strokeWidth="1" /><text x="161" y="49" textAnchor="middle" fill="#59694f" fontSize="25" fontWeight="800">{title}</text><text x="161" y="76" textAnchor="middle" fill="#9a8460" fontSize="13">{subtitle || 'HẺM 28 · NHỮNG NGÀY RẤT VUI'}</text></g>
      {kind === 'achievements' && [374,450,526,602].map((x,i) => <g key={x} transform={`translate(${x} 225)`}><path d="M-9-23l-5 22L0-8l15 7-6-22" fill={i%2 ? '#879c79' : '#b56c56'} /><circle cy="-28" r="14" fill="#e2bf73" stroke="#ad8c4e" strokeWidth="2" /><path d="M0-37l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#fff0ad" /></g>)}
    </svg>
  </div>;
}
