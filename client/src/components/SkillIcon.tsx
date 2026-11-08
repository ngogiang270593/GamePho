import { useId, type SVGProps } from 'react';
import type { SkillVfxSkill } from '../game/skillVfx';
import '../styles/skill-vfx.css';

const iconColors: Record<SkillVfxSkill, [string, string]> = {
  'ha-ba-tuc-cong': ['#9effed', '#2ba9ce'],
  'ca-coc-phon-thuy': ['#a8ffff', '#257ed4'],
  'rai-ca-quan-thuy': ['#e7ffcf', '#37c9b9'],
  'rua-dam-lay-thu': ['#c5edb0', '#4b8c68'],
  'ha-ba-cuon-luu': ['#a7ffff', '#238cd7'],
  'bay-tre-gai': ['#f3d996', '#6a9c51'],
};

export function SkillIcon({ skill, ...props }: SVGProps<SVGSVGElement> & { skill: SkillVfxSkill }) {
  const [light, dark] = iconColors[skill];
  const gradient = `skill-${useId().replace(/:/g, '')}`;
  return <svg
    {...props}
    className={`skill-icon${props.className ? ` ${props.className}` : ''}`}
    viewBox="0 0 48 48"
    role="img"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor={light} />
        <stop offset="1" stopColor={dark} />
      </linearGradient>
    </defs>
    <path d="M24 2.8 41.3 13v21.8L24 45.2 6.7 34.8V13z" fill="#172c3c" stroke="#d8c797" strokeWidth="1.5" />
    <path d="M24 6.8 37.6 15v17.8L24 40.9 10.4 32.8V15z" fill="none" stroke="#8c9d87" strokeOpacity=".52" />
    {skill === 'ha-ba-tuc-cong' && <>
      <path d="M11 26c5-13 18-17 26-10 5 5 2 14-8 17-8 2-15-1-18-7" fill="none" stroke={`url(#${gradient})`} strokeWidth="3" strokeLinecap="round" />
      <path d="M17 25c2 4 7 6 11 4 4-2 5-6 2-9-3-3-8-2-10 1" fill="none" stroke="#f4ffff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24 13c-4 5-4 7 0 10 4-3 4-5 0-10" fill={`url(#${gradient})`} />
    </>}
    {skill === 'ca-coc-phon-thuy' && <>
      <path d="M9 29c7-8 15-11 24-8l6 4-6 5c-9 4-17 2-24-1z" fill={`url(#${gradient})`} stroke="#eaffff" strokeWidth="1.3" />
      <circle cx="28" cy="23" r="2" fill="#efffff" /><circle cx="28" cy="23" r=".8" fill="#194b70" />
      <path d="M10 28 5 24m6 7-5 2m25-10 5-5m-4 10 8 2" fill="none" stroke="#bafcff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M15 27c4-5 8-7 12-6" fill="none" stroke="#fff" strokeWidth="1" />
    </>}
    {skill === 'rai-ca-quan-thuy' && <>
      <path d="M9 29c3-10 12-15 21-12 5 2 7 7 4 11-2 3-6 4-10 2" fill="none" stroke={`url(#${gradient})`} strokeWidth="4" strokeLinecap="round" />
      <path d="M30 13c5 1 9 5 10 10M13 34c5 4 12 5 18 2" fill="none" stroke="#eaffd0" strokeWidth="1.6" strokeLinecap="round" />
      <path d="m31 18 5-1-1 5" fill="none" stroke="#f8ffe9" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="18" cy="21" r="2" fill="#fff" />
    </>}
    {skill === 'rua-dam-lay-thu' && <>
      <path d="M11 29c0-9 6-15 13-15s13 6 13 15c-7 5-19 5-26 0z" fill={`url(#${gradient})`} stroke="#eaffd0" strokeWidth="1.5" />
      <path d="M24 15v17m-11-7 11 3 11-3m-17-7 6 7 6-7" fill="none" stroke="#f3ffdf" strokeWidth="1.3" />
      <path d="M10 31 6 34m32-3 4 3M17 35v3m14-3v3" stroke="#dfcf9e" strokeWidth="2" strokeLinecap="round" />
    </>}
    {skill === 'ha-ba-cuon-luu' && <>
      <path d="M9 26c4-11 17-15 25-8 6 6 2 15-7 16-6 1-10-3-8-7 1-3 5-4 7-2" fill="none" stroke={`url(#${gradient})`} strokeWidth="4" strokeLinecap="round" />
      <path d="M12 32c5 4 15 5 23 0M18 14c5-4 14-3 19 2" fill="none" stroke="#e5ffff" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m31 11 6 2-4 5" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="23" cy="25" r="2" fill="#f3ffff" />
    </>}
    {skill === 'bay-tre-gai' && <>
      <path d="M24 36V12m0 14L13 16m11 16 12-13m-12-3-8-6m8 17 9 7" fill="none" stroke={`url(#${gradient})`} strokeWidth="3" strokeLinecap="round" />
      <path d="m24 8-3 6 6-1m-18 1 7 1-2 6m20-5-6 1 2 6m7 11-7-2 1-5" fill="#eaffcf" stroke="#d4eaa7" strokeWidth="1" />
      <circle cx="24" cy="35" r="2" fill="#f6e2aa" />
    </>}
    <path d="M8 16h3m26 16h3" stroke="#fff5cf" strokeWidth="1" strokeLinecap="round" opacity=".8" />
  </svg>;
}
