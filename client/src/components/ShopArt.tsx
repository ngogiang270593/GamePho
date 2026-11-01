import { memo, useId } from 'react';
import type { ShopLayout } from '../game/shop';

export function PhoBowl({ phoType = 0, toppings = [], broth = true }: { phoType?: number; toppings?: readonly string[]; broth?: boolean }) {
  return <g className="pho-bowl-drawing" stroke="#7c6550" strokeWidth="1.5" strokeLinejoin="round">
    <ellipse cy="23" rx="37" ry="7" fill="#4a554524" stroke="none" />
    <path d="M-43-3Q-39 30 0 30Q39 30 43-3Z" fill="#f8eed7" /><path d="M-32 14Q0 29 32 14M-25 22Q0 30 25 22" fill="none" stroke="#648c83" strokeWidth="2" />
    <ellipse cy="-3" rx="44" ry="18" fill="#fff6df" /><ellipse cy="-3" rx="37" ry="13" fill={broth ? '#c99357' : '#ede2bf'} stroke="none" />
    <g fill="none" stroke="#fff0bf" strokeWidth="2.4"><path d="M-25-5Q-15-17-4-7T21-5M-28 1Q-15-8-4 1T26-1M-20 5Q-6-2 5 5T24 3" /></g>
    <g fill={phoType === 2 ? '#f3d7a2' : phoType === 1 ? '#927054' : '#c58477'} stroke={phoType === 2 ? '#b89463' : '#9c655a'} strokeWidth="1"><path d="M-19-10Q-6-17 3-10L-3-1Q-19-1-19-10M6-7Q22-14 28-5L18 3L6 1Z" /></g>
    {toppings.map((name, i) => <g key={name} transform={`translate(${i * 11 - 19} ${i % 2 ? 0 : -8})`}><Ingredient name={name} tiny /></g>)}
    {broth && <g className="bowl-steam" fill="none" stroke="#fff9e6" strokeWidth="2.5" strokeLinecap="round"><path d="M-17-24Q-27-34-17-44M1-26Q-9-38 1-49M19-25Q9-35 19-43" /></g>}
  </g>;
}

export function Ingredient({ name, tiny = false }: { name: string; tiny?: boolean }) {
  const value = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return <g transform={tiny ? 'scale(.45)' : undefined} strokeWidth="1.5" strokeLinejoin="round">
    {value.includes('chanh') ? <g stroke="#7d9852"><path d="M-17 5Q0-24 18 5L0 15Z" fill="#c3d478" /><path d="M-12 5L0 10L12 5L0-7Z" fill="#eff0b9" /><path d="M0-7V10M-11 5H12" /></g>
      : value.includes('ot') || value.includes('sa te') ? <g><path d="M-17 9Q-3 9 0-4Q8-12 14-4Q12 16-17 9" fill="#c75b43" stroke="#9b4e3a" /><path d="M11-5Q12-13 19-11" fill="none" stroke="#5b8055" strokeWidth="3" /></g>
      : value.includes('trung') ? <g><ellipse rx="17" ry="13" fill="#fff3d8" stroke="#c0ac80" /><ellipse rx="8" ry="7" fill="#e6b55c" stroke="#c99544" /></g>
      : value.includes('bo') || value.includes('nam') || value.includes('gan') || value.includes('ga') || value.includes('thit') ? <g fill={value.includes('ga') ? '#eed3a1' : '#bd8170'} stroke="#9c6d57"><path d="M-22-6Q-7-18 7-7L-4 10Q-20 13-22-6M0 0L13-13L24-4L14 13Z" /><path d="M-15-5L-7 3M10-3L15 3" stroke="#efd4b4" /></g>
      : value.includes('quay') ? <g fill="#dcaf69" stroke="#b68b51"><path d="M-17-13L-8-16L11 10L2 16ZM-3-15L5-17L23 7L15 12Z" /><path d="M-10-6L-4-10M-5 2L1-2M10-3L16-7" /></g>
      : <g fill="#6b9a63" stroke="#487651"><path d="M0 14Q-29 3-20-10Q-3-15 0 14M0 14Q1-14 17-13Q31 2 0 14" /><path d="M-15-5L0 14L15-7M0 14V-17" fill="none" stroke="#a4ba73" strokeWidth="2" /></g>}
  </g>;
}

export function FoodIcon({ type, name }: { type?: number; name?: string }) {
  return <svg viewBox={name ? '-32 -25 64 48' : '-55 -40 110 84'} aria-hidden="true" className="shop-food-icon">{name ? <Ingredient name={name} /> : <PhoBowl phoType={type} />}</svg>;
}

export const ShopRoom = memo(function ShopRoom({ layout }: { layout: ShopLayout }) {
  const id = `shop-${useId().replace(/:/g, '')}`;
  const wall = Math.max(155, layout.home.y - 85);
  return <g>
    <defs>
      <pattern id={`${id}-tile`} width="78" height="56" patternUnits="userSpaceOnUse"><rect width="78" height="56" fill="#dbc89d" /><path d="M0 0H78V56H0Z" fill="none" stroke="#c5b18b" strokeWidth="1.5" /><path d="M5 6H72M6 10V48" stroke="#e9d9b3" strokeWidth="1" fill="none" /><path d="M35 22L43 28L35 34L28 28Z" fill="#b2b78c" opacity=".3" /></pattern>
      <linearGradient id={`${id}-wall`} x2="0" y2="1"><stop stopColor="#f3dfb4" /><stop offset="1" stopColor="#e4c996" /></linearGradient>
    </defs>
    <rect width={layout.width} height={layout.height} fill={`url(#${id}-tile)`} />
    <rect width={layout.width} height={wall} fill={`url(#${id}-wall)`} />
    <path d={`M0 18H${layout.width}M0 ${wall}H${layout.width}`} stroke="#8b6e4c" strokeWidth="14" /><path d={`M0 ${wall + 12}H${layout.width}`} stroke="#f3dfba" strokeWidth="5" />
    <rect x="65" y="54" width="150" height={Math.max(70, wall - 77)} rx="6" fill="#8aab89" stroke="#8d704f" strokeWidth="8" /><path d={`M76 68L198 ${wall - 35}M87 ${wall - 30}L199 72`} stroke="#d8dfb0" strokeWidth="10" opacity=".5" />
    <path d={`M140 58V${wall - 27}M70 ${Math.max(95, wall - 80)}H210`} stroke="#e4c896" strokeWidth="7" />
    <g transform={`translate(${layout.compact ? 365 : 450} 50)`} stroke="#836244" strokeWidth="2"><rect x="-115" width="230" height="90" rx="8" fill="#98523e" stroke="#d4ac70" strokeWidth="4" /><text y="43" textAnchor="middle" fill="#fff1ca" fontFamily="Georgia,serif" fontSize="35" fontWeight="900" stroke="none">XÓM NHÀ LÁ</text><text y="68" textAnchor="middle" fill="#e6c89b" fontSize="11" letterSpacing="2" stroke="none">NƯỚC DÙNG ẤM · TÌNH XÓM THƠM</text></g>
    <g transform={`translate(${layout.width - 137} ${wall - 123})`}><path d="M0 4Q48-27 96 4V182H0Z" fill="#78977b" stroke="#967149" strokeWidth="8" /><path d="M13 10H83V174H13Z" fill="#5a7d6a" /><path d="M48 10V174M13 69H83" stroke="#b7c29b" strokeWidth="5" /><path d="M15 141L81 91" stroke="#8eac89" strokeWidth="12" opacity=".5" /><circle cx="74" cy="105" r="4" fill="#f4d18e" /></g>
    {[30, layout.compact ? 655 : 1100].map((x, i) => <g key={x} transform={`translate(${x} 36)`}><path d="M0-36V1" stroke="#a38a5f" strokeWidth="2" /><ellipse cy="20" rx="23" ry="30" fill={i ? '#be6c4c' : '#b95340'} stroke="#976447" strokeWidth="2" /><path d="M-16-1Q-24 20-16 43M0-9V49M16-1Q24 20 16 43" stroke="#e5b56c" strokeWidth="1" fill="none" /><path d="M0 49V69" stroke="#cd9b54" strokeWidth="3" /></g>)}
    <g transform={`translate(${layout.compact ? 34 : 710} ${wall + 26})`} stroke="#715b43" strokeWidth="2"><ellipse cy="13" rx="29" ry="8" fill="#52614426" stroke="none" /><path d="M-20-22H20L14 12H-14Z" fill="#bc8357" /><path d="M0-23V-78M0-39Q-38-59-21-74Q-4-72 0-39M0-50Q15-89 32-75Q31-58 0-50" fill="#7d9b68" stroke="#547956" /></g>
    {!layout.compact && <g className="shop-room-note" transform="translate(665 65)" fill="#a18b65" fontSize="16" fontFamily="Georgia,serif"><text>Phở nóng mỗi ngày</text><path d="M0 16H178" stroke="#bfa77a" /><text y="42" fontSize="12">Thơm từ bếp, vui tới bàn.</text></g>}
  </g>;
});

export function KitchenCounter({ layout, blanching, pouring, toppings, phoType, bowlReady, broth }: { layout: ShopLayout; blanching: boolean; pouring: boolean; toppings: string[]; phoType?: number; bowlReady: boolean; broth: boolean }) {
  const { counter, pot, noodles, ingredients } = layout;
  const bowl = pouring ? { x: pot.x + 90, y: counter.y - 22 } : !broth ? { x: noodles.x + 62, y: counter.y - 25 } : { x: counter.x + counter.width - 37, y: counter.y - 45 };
  return <g stroke="#796247" strokeWidth="2" strokeLinejoin="round">
    <path d={`M${counter.x + 8} ${counter.y + 84}h${counter.width}v18h-${counter.width}Z`} fill="#7c6d4b" opacity=".15" stroke="none" />
    <rect x={counter.x} y={counter.y} width={counter.width} height="82" rx="5" fill="#b89060" /><path d={`M${counter.x} ${counter.y + 24}h${counter.width}M${counter.x + 13} ${counter.y + 67}h${counter.width - 26}`} stroke="#a27b50" />
    <rect x={counter.x - 9} y={counter.y - 7} width={counter.width + 18} height="21" rx="5" fill="#dbba83" />
    <g transform={`translate(${pot.x} ${pot.y - 15})`} className={`shop-stockpot${pouring ? ' is-pouring' : ''}`}>
      <ellipse cy="-2" rx="60" ry="19" fill="#6c8275" /><path d="M-57-22H57V13Q0 43-57 13Z" fill="#879e8c" /><ellipse cy="-23" rx="58" ry="19" fill="#c4ccb0" /><ellipse cy="-24" rx="49" ry="12" fill="#bd8f52" stroke="#e4d1a1" /><path d="M-66-11H-56M56-11H66" stroke="#5c7767" strokeWidth="7" />
      <g className="shop-pot-bubbles" fill="#e1c37d" stroke="none"><circle cx="-27" cy="-25" r="4" /><circle cx="8" cy="-29" r="3" /><circle cx="30" cy="-23" r="4" /></g>
      <g className="shop-pot-steam" fill="none" stroke="#fff5d8" strokeWidth="4" strokeLinecap="round"><path d="M-28-49Q-42-66-26-86M-4-50Q-18-73-2-92M23-49Q8-67 24-84" /></g>
      <g className="shop-ladle" transform="translate(35 -28)"><path d="M0 0L16-63" stroke="#756b53" strokeWidth="5" /><ellipse cy="3" rx="17" ry="8" fill="#b9c4ae" /></g>
      <g className="shop-flame" stroke="#bf7647" fill="#e2b45b"><path d="M-28 35Q-33 19-23 16Q-17 30-12 35M-3 38Q-14 17 0 12Q12 26 10 38M25 35Q17 25 28 16Q37 29 32 35" /></g>
    </g>
    <g transform={`translate(${noodles.x} ${noodles.y - 15})`} className={blanching ? 'shop-noodles is-blanching' : 'shop-noodles'}><ellipse rx="44" ry="14" fill="#dddbc0" /><path d="M-42 0L-31 27Q0 40 31 27L42 0" fill="#a4b3a1" /><ellipse cy="-1" rx="35" ry="9" fill="#e8d3a0" /><g className="shop-strainer"><path d="M17-4L42-58" stroke="#7d7156" strokeWidth="5" /><path d="M-22-12Q0 8 23-12L17 1Q0 19-17 1Z" fill="#d8cfaa" /><path d="M-13-7Q0-15 14-6M-12-2Q0-9 12-1" fill="none" stroke="#fff2ce" strokeWidth="3" /></g></g>
    <g transform={`translate(${ingredients.x} ${ingredients.y - 15})`}><path d="M-55-24H55L60 15H-60Z" fill="#e0d2ad" /><path d="M-18-24V15M19-24V15" stroke="#b4a582" /><g transform="translate(-36 -4) scale(.7)"><Ingredient name="Rau thơm" /></g><g transform="translate(0 -4) scale(.7)"><Ingredient name="Thịt bò" /></g><g transform="translate(37 -4) scale(.7)"><Ingredient name="Ớt" /></g></g>
    {bowlReady && <g transform={`translate(${bowl.x} ${bowl.y}) scale(.8)`}><PhoBowl toppings={toppings} phoType={phoType} broth={broth} /></g>}
    {pouring && <g className="shop-broth-stream" fill="none" stroke="#d6b06b" strokeWidth="5" strokeLinecap="round"><path d={`M${pot.x + 62} ${pot.y - 55}Q${bowl.x} ${pot.y - 45} ${bowl.x} ${bowl.y - 4}`} /><path d={`M${bowl.x - 12} ${bowl.y - 1}l-7-7M${bowl.x + 10} ${bowl.y - 1}l8-8`} strokeWidth="2" /></g>}
  </g>;
}

export function DiningTable({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`} stroke="#7c6044" strokeWidth="2.5" strokeLinejoin="round"><ellipse cy="60" rx="106" ry="18" fill="#53604326" stroke="none" /><path d="M-67 1V58M68 1V58" strokeWidth="9" /><path d="M-103-19H103V14H-103Z" fill="#bd9461" /><path d="M-103-43H103L118-15H-118Z" fill="#d8b681" /><path d="M-111-12H111" stroke="#edd5a4" strokeWidth="3" /><g transform="translate(76 -39)"><rect x="-10" y="-14" width="20" height="22" rx="3" fill="#e8dfc1" /><path d="M-6-13L-12-37M0-14L1-39M5-13L12-35" stroke="#77583c" strokeWidth="3" /></g><g transform="translate(-75 -36)"><rect x="-9" y="-12" width="18" height="18" rx="3" fill="#a85e45" /><path d="M-6-15H6" stroke="#dec8a2" strokeWidth="4" /></g></g>;
}
