import { memo, useId, type SVGProps } from 'react';
import type { CharacterEmotion, CharacterPose } from './CharacterSprite';
import type { Facing } from '../game/character';

export interface VillagerDesign {
  age: number; female: boolean; skin: string; hair: string; shirt: string; pants: string;
  hairStyle: 'crop' | 'sidepart' | 'bob' | 'braid' | 'bun' | 'quiff';
  build: 'slim' | 'sturdy' | 'round'; outfit: 'baba' | 'shirt' | 'jacket' | 'jersey' | 'tuthan' | 'nguthan';
  prop: 'scarf' | 'helmet' | 'phone' | 'glasses' | 'backpack' | 'cap' | 'flower' | 'nonla' | 'none';
  accent: string; facialHair?: boolean; pattern?: boolean;
}
interface VillagerProps extends SVGProps<SVGSVGElement> {
  design: VillagerDesign; facing?: Facing; walking?: boolean; running?: boolean; portrait?: boolean;
  emotion?: CharacterEmotion; pose?: CharacterPose;
}
const shade = (hex: string, amount: number) => '#' + [1,3,5].map(i => Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)+amount)).toString(16).padStart(2,'0')).join('');

// A separate drawing system for the cast: age affects anatomy, clothes and gait.
export const VillagerSprite = memo(function VillagerSprite({ design: d, facing = 'down', walking = false, running = false, portrait = false, emotion = 'neutral', pose = 'idle', className = '', ...props }: VillagerProps) {
  const id = `villager-${useId().replace(/:/g,'')}`;
  const kid = d.age < 13, elder = d.age >= 60, teen = d.age < 23;
  const back = facing === 'up', side = facing === 'left' || facing === 'right';
  const headTop = kid ? 51 : elder ? 26 : 22;
  const chin = kid ? 130 : elder ? 112 : 111;
  const eyeY = kid ? 94 : elder ? 75 : 70;
  const mouthY = kid ? 116 : elder ? 101 : 98;
  const cheek = kid ? 37 : d.build === 'slim' ? 40 : d.build === 'round' ? 32 : 35;
  const headWidth = 80-cheek;
  const shoulder = kid ? 50 : d.build === 'slim' ? 43 : d.build === 'round' ? 30 : 35;
  const shoulderY = kid ? 132 : elder ? 126 : 119;
  const hem = kid ? 181 : d.outfit === 'tuthan' || d.outfit === 'nguthan' ? 184 : 176;
  const hairColor = elder ? '#a3a29a' : d.hair;
  const outline = '#51473d';
  const smile = emotion === 'happy' || emotion === 'neutral' && (elder || kid);
  const raised = pose === 'order' || pose === 'cheer';
  const eating = pose === 'eat';
  const gossip = pose === 'gossip' || pose === 'complain';
  function Eye({ x, width = 1 }: { x: number; width?: number }) {
    return <g data-eye={x < 80 ? 'left' : 'right'} transform={`translate(${x} ${eyeY}) scale(${width} 1)`}>
      <path d={emotion === 'angry' ? 'M-9-12L8-7' : emotion === 'surprised' ? 'M-9-14Q0-19 9-13' : elder ? 'M-8-10Q0-13 8-10' : 'M-8-12Q0-15 8-12'} fill="none" stroke={elder ? '#77796f' : d.hair} strokeWidth={d.female ? 2 : 3} />
      {smile ? <path d="M-8 1Q0-9 8 1" fill="none" stroke="#4c413a" strokeWidth={kid ? 2.7 : 2.2} /> : <><ellipse rx={kid ? 8 : 7} ry={kid ? 10 : elder ? 5 : 7.5} fill="#fff9e9" stroke="none" /><ellipse cy=".5" rx={kid ? 5 : 4.2} ry={kid ? 8 : elder ? 4.2 : 6.1} fill="#4c3d32" stroke="none" /><ellipse cx="-1.5" cy="-2.5" rx="1.6" ry="2" fill="#fff5d8" stroke="none" /><path d="M-8-4Q0-8 8-4" fill="none" stroke="#514236" strokeWidth={d.female ? 2.2 : 1.8} /></>}
      {elder && <path d="M-8 7Q0 11 8 7M-14 0l-3-2M13 1l3-2" fill="none" stroke={shade(d.skin,-26)} strokeWidth="1.1" />}
    </g>;
  }
  const head = `M${cheek} ${headTop+35}C${cheek-3} ${headTop-12} ${160-cheek+3} ${headTop-12} ${160-cheek} ${headTop+35}L${160-cheek-3} ${chin-24}Q${160-cheek-6} ${chin-5} 80 ${chin}Q${cheek+6} ${chin-5} ${cheek+3} ${chin-24}Z`;
  const hairPath = d.hairStyle === 'crop' ? `M${cheek-1} ${headTop+40}Q${cheek-8} ${headTop-8} 80 ${headTop-6}Q${160-cheek+10} ${headTop-7} ${160-cheek+1} ${headTop+38}L${143-cheek} ${headTop+26}L${120-cheek} ${headTop+31}L80 ${headTop+24}L${cheek+20} ${headTop+30}L${cheek+10} ${headTop+26}L${cheek+5} ${headTop+46}Z`
    : d.hairStyle === 'bob' || d.hairStyle === 'braid' ? `M${cheek-2} ${headTop+42}Q${cheek-10} ${headTop-10} 80 ${headTop-8}Q${160-cheek+10} ${headTop-8} ${160-cheek+3} ${headTop+46}L${150-cheek} ${headTop+37}L${146-cheek} ${headTop+24}Q80 ${headTop+41} ${cheek+18} ${headTop+22}L${cheek+10} ${headTop+44}L${cheek+3} ${headTop+58}Z`
    : d.hairStyle === 'quiff' ? `M${cheek} ${headTop+42}Q${cheek-13} ${headTop+3} ${cheek+16} ${headTop-7}Q72 ${headTop-27} 93 ${headTop-11}Q${159-cheek} ${headTop-11} ${161-cheek} ${headTop+31}Q${128-cheek} ${headTop+19} 84 ${headTop+30}L${cheek+16} ${headTop+25}L${cheek+7} ${headTop+48}Z`
    : `M${cheek} ${headTop+43}Q${cheek-12} ${headTop-12} 80 ${headTop-9}Q${161-cheek} ${headTop-10} ${161-cheek} ${headTop+35}L${150-cheek} ${headTop+40}L${145-cheek} ${headTop+24}Q85 ${headTop+25} 76 ${headTop+37}L${cheek+18} ${headTop+30}L${cheek+8} ${headTop+49}Z`;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={portrait ? `8 ${kid ? 43 : 0} 144 137` : '0 0 160 224'} className={`villager-sprite age-${kid ? 'child' : elder ? 'elder' : teen ? 'young' : 'adult'} build-${d.build} facing-${facing} pose-${pose} emotion-${emotion}${walking ? ' is-walking' : ''}${running ? ' is-running' : ''} ${className}`} aria-hidden="true" focusable="false" data-age={d.age} {...props}>
    <defs><linearGradient id={`${id}-skin`} x2=".8" y2="1"><stop stopColor={shade(d.skin,24)} /><stop offset=".5" stopColor={d.skin} /><stop offset="1" stopColor={shade(d.skin,-8)} /></linearGradient><linearGradient id={`${id}-cloth`} x2="1" y2="1"><stop stopColor={shade(d.shirt,18)} /><stop offset=".6" stopColor={d.shirt} /><stop offset="1" stopColor={shade(d.shirt,-22)} /></linearGradient><linearGradient id={`${id}-hair`} x2=".5" y2="1"><stop stopColor={shade(hairColor,18)} /><stop offset="1" stopColor={shade(hairColor,-17)} /></linearGradient><pattern id={`${id}-plaid`} width="13" height="13" patternUnits="userSpaceOnUse"><path d="M0 3H13M3 0V13" stroke="#fff5db" opacity=".16" strokeWidth="3" /></pattern></defs>
    <ellipse cx="80" cy="215" rx={kid ? 27 : 38} ry="7" fill="#465c4230" />
    <g transform={facing === 'left' ? 'translate(160 0) scale(-1 1)' : undefined} stroke={outline} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <g className="villager-body">
        {(d.hairStyle === 'bob' || d.hairStyle === 'braid') && <path d={`M${cheek} ${headTop+32}Q${cheek-16} ${headTop+69} ${cheek+2} ${shoulderY+9}H${158-cheek}Q${176-cheek} ${headTop+66} ${160-cheek} ${headTop+25}Z`} fill={`url(#${id}-hair)`} />}
        {d.prop === 'backpack' && <g fill={d.accent} stroke={shade(d.accent,-40)}><rect x={shoulder-8} y={shoulderY+4} width={160-2*shoulder+16} height={hem-shoulderY-4} rx="13" /><path d={`M${shoulder+6} ${hem-14}H${154-shoulder}`} stroke={shade(d.accent,25)} strokeWidth="3" /></g>}
        <g className="villager-leg villager-leg-left"><path d={`M${kid ? 58 : 51} ${hem-5}H78L76 207H${kid ? 59 : 51}Z`} fill={d.pants} /><path d={`M${kid ? 59 : 51} 204H76L79 213Q64 220 ${kid ? 51 : 44} 213Z`} fill="#756349" /><path d={`M${kid ? 58 : 52} 207H73`} stroke="#c1aa7e" strokeWidth="2.5" /></g>
        <g className="villager-leg villager-leg-right"><path d={`M82 ${hem-5}H${kid ? 103 : 109}L${kid ? 102 : 110} 207H84Z`} fill={shade(d.pants,8)} /><path d={`M85 204H${kid ? 103 : 110}L${kid ? 113 : 120} 213Q102 220 82 213Z`} fill="#756349" /><path d={`M88 207H${kid ? 102 : 109}`} stroke="#c1aa7e" strokeWidth="2.5" /></g>
        <path d={`M${shoulder+9} ${shoulderY-2}Q80 ${shoulderY-15} ${151-shoulder} ${shoulderY-2}L${163-shoulder} ${hem-4}Q80 ${hem+9} ${shoulder-3} ${hem-4}Z`} fill={`url(#${id}-cloth)`} />
        {d.pattern && <path d={`M${shoulder+9} ${shoulderY-2}Q80 ${shoulderY-15} ${151-shoulder} ${shoulderY-2}L${163-shoulder} ${hem-4}Q80 ${hem+9} ${shoulder-3} ${hem-4}Z`} fill={`url(#${id}-plaid)`} stroke="none" />}
        {!back && <>
          <path d={`M69 ${shoulderY-10}L72 ${shoulderY+2}L80 ${shoulderY+7}L89 ${shoulderY+1}L91 ${shoulderY-10}`} fill={d.skin} />
          <path d={`M66 ${shoulderY-5}L72 ${shoulderY+8}L80 ${shoulderY+3}L89 ${shoulderY+8}L95 ${shoulderY-5}`} fill={shade(d.shirt,22)} />
          {d.outfit === 'jersey' ? <><path d={`M${shoulder+15} ${shoulderY+9}V${hem-7}M${145-shoulder} ${shoulderY+9}V${hem-7}`} stroke={d.accent} strokeWidth="8" opacity=".6" /><text x="80" y={hem-15} textAnchor="middle" fontSize={kid ? '19' : '25'} fontWeight="900" fill="#f6e6b5" stroke="none">{d.age % 19 + 1}</text></>
          : d.outfit === 'tuthan' ? <><path d={`M60 ${shoulderY}L80 ${shoulderY+11}L99 ${shoulderY}L105 ${hem}H55Z`} fill="#b88076" /><path d={`M${shoulder+9} ${shoulderY}L66 ${shoulderY+7}L62 ${hem}H${shoulder}M${151-shoulder} ${shoulderY}L94 ${shoulderY+7}L98 ${hem}H${160-shoulder}`} fill={d.shirt} /><path d={`M44 ${hem-29}Q81 ${hem-22} 116 ${hem-30}`} stroke={d.accent} strokeWidth="6" /></>
          : <><path d={`M80 ${shoulderY+9}V${hem-6}`} stroke={shade(d.shirt,-24)} strokeWidth="1.8" />{[0,1,2,3].map(i => <circle key={i} cx="83" cy={shoulderY+15+i*10} r="1.4" fill={d.accent} stroke="none" />)}{d.outfit !== 'nguthan' && <g stroke={shade(d.shirt,-22)} strokeWidth="1.5"><path d={`M${shoulder+12} ${hem-27}H${shoulder+31}V${hem-10}Q${shoulder+20} ${hem-6} ${shoulder+12} ${hem-10}ZM${129-shoulder} ${hem-27}H${148-shoulder}V${hem-10}Q${140-shoulder} ${hem-6} ${129-shoulder} ${hem-10}Z`} fill={shade(d.shirt,10)} /></g>}</>}
          {d.outfit === 'jacket' && <path d={`M${shoulder+6} ${shoulderY+22}H${154-shoulder}`} stroke="#e1d3a3" strokeWidth="7" opacity=".85" />}
          {d.prop === 'backpack' && <path d={`M${shoulder+12} ${shoulderY-2}L${shoulder+16} ${hem-8}M${148-shoulder} ${shoulderY-2}L${144-shoulder} ${hem-8}`} stroke={d.accent} strokeWidth="5" />}
        </>}
        {back && <path d={`M80 ${shoulderY+11}V${hem-9}M${shoulder+15} ${shoulderY+4}Q80 ${shoulderY+20} ${145-shoulder} ${shoulderY+4}`} fill="none" stroke={shade(d.shirt,-17)} strokeWidth="1.6" />}
        <g className="villager-arm villager-arm-left">
          <path d={raised ? `M${shoulder+10} ${shoulderY}Q${shoulder-9} ${shoulderY-4} ${shoulder-13} ${shoulderY-26}L${shoulder-24} ${shoulderY-22}Q${shoulder-23} ${shoulderY+15} ${shoulder+1} ${shoulderY+24}Z` : `M${shoulder+8} ${shoulderY}Q${shoulder-9} ${shoulderY+7} ${shoulder-10} ${hem-12}L${shoulder+4} ${hem-9}Q${shoulder+5} ${shoulderY+25} ${shoulder+15} ${shoulderY+14}Z`} fill={shade(d.shirt,4)} />
          <ellipse cx={raised ? shoulder-18 : shoulder-3} cy={raised ? shoulderY-28 : hem-5} rx={kid ? 6 : 7} ry={kid ? 7 : 9} fill={`url(#${id}-skin)`} />
          {raised && <path d={`M${shoulder-22} ${shoulderY-32}l-2-7M${shoulder-16} ${shoulderY-34}v-7M${shoulder-11} ${shoulderY-31}l3-6`} stroke={shade(d.skin,-23)} strokeWidth="1.5" fill="none" />}
        </g>
        <g className="villager-arm villager-arm-right">
          <path d={eating || gossip ? `M${151-shoulder} ${shoulderY}Q${177-shoulder} ${shoulderY+8} ${169-shoulder} ${shoulderY+34}Q${160-shoulder} ${shoulderY+41} ${133-shoulder} ${shoulderY+17}L${142-shoulder} ${shoulderY+7}L${155-shoulder} ${shoulderY+18}Q${158-shoulder} ${shoulderY+8} ${148-shoulder} ${shoulderY+8}Z` : pose === 'cheer' ? `M${151-shoulder} ${shoulderY}Q${174-shoulder} ${shoulderY-3} ${175-shoulder} ${shoulderY-25}L${186-shoulder} ${shoulderY-21}Q${184-shoulder} ${shoulderY+19} ${158-shoulder} ${shoulderY+23}Z` : `M${151-shoulder} ${shoulderY}Q${170-shoulder} ${shoulderY+7} ${170-shoulder} ${hem-12}L${156-shoulder} ${hem-9}Q${153-shoulder} ${shoulderY+25} ${145-shoulder} ${shoulderY+14}Z`} fill={shade(d.shirt,-6)} />
          <ellipse cx={eating || gossip ? 137-shoulder : pose === 'cheer' ? 181-shoulder : 163-shoulder} cy={eating || gossip ? shoulderY+10 : pose === 'cheer' ? shoulderY-29 : hem-5} rx={kid ? 6 : 7} ry={kid ? 7 : 9} fill={`url(#${id}-skin)`} />
          {eating && <g stroke="#866747" strokeWidth="2" fill="none"><path d={`M${141-shoulder} ${shoulderY+6}L86 ${mouthY+2}M${143-shoulder} ${shoulderY+11}L89 ${mouthY+6}`} /><path className="villager-noodle" d={`M87 ${mouthY+2}Q79 ${mouthY+14} 85 ${mouthY+24}`} stroke="#f7dfaa" strokeWidth="2.2" /></g>}
        </g>
        <g className="villager-head">
          {d.hairStyle === 'bun' && <g fill={`url(#${id}-hair)`}><ellipse cx={side ? 43 : 81} cy={headTop+4} rx="21" ry="18" /><path d={side ? `M30 ${headTop}Q42 ${headTop-12} 56 ${headTop}` : `M64 ${headTop-1}Q80 ${headTop-13} 98 ${headTop}`} fill="none" stroke={shade(hairColor,40)} strokeWidth="2" /></g>}
          <ellipse cx={cheek+1} cy={eyeY+3} rx="7" ry="10" fill={d.skin} /><ellipse cx={159-cheek} cy={eyeY+3} rx="7" ry="10" fill={d.skin} />
          <path d={head} fill={`url(#${id}-skin)`} />
          {back ? <path d={`M${cheek} ${headTop+34}Q${cheek-8} ${headTop-10} 80 ${headTop-8}Q${168-cheek} ${headTop-10} ${160-cheek} ${headTop+36}L${156-cheek} ${chin-14}Q80 ${chin+1} ${cheek+4} ${chin-14}Z`} fill={`url(#${id}-hair)`} /> : <>
            {side ? <><Eye x={74} width={.76} /><Eye x={102} /><path d={`M${153-cheek} ${eyeY-2}q13 9 2 15l-8 1`} fill={d.skin} /><path d={`M109 ${mouthY}q8 5 13-1`} fill="none" stroke="#a3715c" strokeWidth="2" /></> : <><Eye x={kid ? 59 : 58} /><Eye x={kid ? 101 : 102} /><path d={`M78 ${eyeY+12}q-5 7 4 6`} fill="none" stroke={shade(d.skin,-28)} strokeWidth="1.5" />
              {emotion === 'surprised' ? <ellipse cx="80" cy={mouthY} rx="5" ry="6" fill="#8b5b52" /> : emotion === 'angry' ? <path d={`M70 ${mouthY+4}Q80 ${mouthY-5} 90 ${mouthY+4}`} fill="none" stroke="#976557" strokeWidth="2" /> : smile ? <g><path d={`M70 ${mouthY-3}Q80 ${mouthY+11} 90 ${mouthY-3}Q80 ${mouthY} 70 ${mouthY-3}`} fill="#a26a60" stroke="#945d52" strokeWidth="1.2" /><path d={`M75 ${mouthY-1}H85`} stroke="#fff2d3" strokeWidth="2" /></g> : <path d={`M73 ${mouthY}Q80 ${mouthY+5} 88 ${mouthY-1}`} fill="none" stroke="#a06b58" strokeWidth="1.7" />}
              <ellipse cx={cheek+12} cy={eyeY+19} rx={kid ? 9 : 8} ry="4" fill="#ce8370" stroke="none" opacity={kid ? .45 : .23} /><ellipse cx={148-cheek} cy={eyeY+19} rx={kid ? 9 : 8} ry="4" fill="#ce8370" stroke="none" opacity={kid ? .45 : .23} />
              {d.age >= 45 && <path d={`M${cheek+12} ${eyeY+24}l-3 8M${148-cheek} ${eyeY+24}l3 8M65 ${headTop+30}q15-5 30 0M68 ${headTop+35}q13-3 25 0`} fill="none" stroke={shade(d.skin,-23)} strokeWidth={elder ? 1.1 : .65} opacity={elder ? 1 : .55} />}
              {d.facialHair && <path d={`M78 ${mouthY-7}q-5-3-13 4q10 5 15-1q5 6 15 1q-8-7-13-4`} fill={elder ? '#9c9b8f' : shade(hairColor,10)} stroke="none" />}
            </>}
            <path d={hairPath} fill={`url(#${id}-hair)`} />
            <path d={`M${cheek+10} ${headTop+22}Q70 ${headTop-2} 95 ${headTop+9}`} fill="none" stroke={shade(hairColor,35)} strokeWidth="2.5" opacity=".55" />
            {elder && <path d={`M${cheek+4} ${headTop+36}l7 10M${155-cheek} ${headTop+33}l-5 12`} stroke="#e2dcc8" strokeWidth="3" />}
            {!elder && d.age >= 50 && <path d={`M${cheek+5} ${headTop+35}l5 8M${154-cheek} ${headTop+33}l-3 9`} stroke="#bfb8a6" strokeWidth="2" />}
            {d.hairStyle === 'braid' && [0,1,2].map(i => <g key={i} fill={hairColor}><ellipse cx={cheek+5} cy={chin-5+i*9} rx="7" ry="8" /><ellipse cx={155-cheek} cy={chin-5+i*9} rx="7" ry="8" /></g>)}
            {d.prop === 'glasses' && !side && <g fill="#f9f5d51a" stroke="#647266" strokeWidth="2.2"><rect x="44" y={eyeY-9} width="28" height="22" rx={elder ? 9 : 5} /><rect x="88" y={eyeY-9} width="28" height="22" rx={elder ? 9 : 5} /><path d={`M72 ${eyeY-2}Q80 ${eyeY-5} 88 ${eyeY-2}M${cheek} ${eyeY-3}H44M116 ${eyeY-3}H${160-cheek}`} fill="none" /></g>}
            {d.prop === 'glasses' && side && <g fill="#f9f5d51a" stroke="#647266" strokeWidth="2.2"><rect x="64" y={eyeY-8} width="20" height="20" rx={elder ? 7 : 4} /><rect x="91" y={eyeY-9} width="24" height="22" rx={elder ? 8 : 5} /><path d={`M84 ${eyeY-2}Q88 ${eyeY-4} 91 ${eyeY-2}M64 ${eyeY-3}L${cheek+8} ${eyeY-8}M115 ${eyeY-3}l8 2`} fill="none" /></g>}
          </>}
          {d.prop === 'helmet' && <g><path d={`M${cheek-6} ${headTop+31}Q${cheek-8} ${headTop-17} 80 ${headTop-18}Q${168-cheek} ${headTop-17} ${166-cheek} ${headTop+31}Z`} fill={d.accent} /><path d={`M${cheek+3} ${headTop+21}Q80 ${headTop+7} ${157-cheek} ${headTop+21}`} fill="none" stroke="#f2e2b8" strokeWidth="7" /><path d={`M${cheek-8} ${headTop+29}Q80 ${headTop+43} ${168-cheek} ${headTop+29}L${173-cheek} ${headTop+35}Q80 ${headTop+50} ${cheek-13} ${headTop+35}Z`} fill={shade(d.accent,-12)} /><path d={`M${cheek-1} ${headTop+43}L${cheek+5} ${chin-8}M${161-cheek} ${headTop+43}L${155-cheek} ${chin-8}`} stroke="#736650" strokeWidth="3" /></g>}
          {d.prop === 'nonla' && <g><path d={`M6 ${headTop+34}L80 ${headTop-21}L154 ${headTop+34}Q80 ${headTop+54} 6 ${headTop+34}Z`} fill="#d9bb7c" /><path d={`M19 ${headTop+31}L80 ${headTop-15}L141 ${headTop+31}M40 ${headTop+36}L80 ${headTop-15}L120 ${headTop+36}M80 ${headTop-15}V${headTop+39}`} fill="none" stroke="#bda066" strokeWidth="1.5" /><path d={`M28 ${headTop+40}Q80 ${chin+22} 132 ${headTop+40}`} fill="none" stroke={d.accent} strokeWidth="4" /></g>}
          {d.prop === 'cap' && <g fill={d.accent}><path d={`M${cheek} ${headTop+21}Q${cheek+4} ${headTop-13} 80 ${headTop-12}Q${156-cheek} ${headTop-13} ${160-cheek} ${headTop+22}Z`} /><path d={`M${cheek-2} ${headTop+21}Q80 ${headTop+12} ${162-cheek} ${headTop+21}L${174-cheek} ${headTop+31}Q80 ${headTop+27} ${cheek-7} ${headTop+32}Z`} /><path d={`M80 ${headTop-9}V${headTop+16}`} stroke={shade(d.accent,30)} strokeWidth="1.5" /></g>}
          {d.prop === 'flower' && !back && <g transform={`translate(${150-cheek} ${headTop+37})`} fill={d.accent} stroke="#f7e7c1" strokeWidth=".8"><ellipse cy="-5" rx="4" ry="6" /><ellipse cy="5" rx="4" ry="6" /><ellipse cx="-5" rx="6" ry="4" /><ellipse cx="5" rx="6" ry="4" /><circle r="3" fill="#e6bf6a" /></g>}
        </g>
        {d.prop === 'scarf' && <g fill={d.accent} stroke={shade(d.accent,-26)} strokeWidth="1.3"><path d={`M60 ${shoulderY-4}Q80 ${shoulderY+9} 101 ${shoulderY-4}L101 ${shoulderY+11}Q80 ${shoulderY+22} 59 ${shoulderY+10}Z`} /><path d={`M65 ${shoulderY+9}L57 ${hem-4}H70L81 ${shoulderY+14}`} /><path d={`M61 ${shoulderY+20}l14 3M60 ${shoulderY+28}l12 3M59 ${shoulderY+36}l10 3`} stroke="#f2dfb2" strokeWidth="2" /></g>}
        {d.prop === 'phone' && !back && <g className="villager-phone" transform={`translate(${153-shoulder} ${shoulderY+22}) rotate(-8)`}><rect x="-9" y="-22" width="19" height="33" rx="4" fill="#6a7a6d" /><rect x="-6" y="-17" width="13" height="21" rx="2" fill="#d5d7b5" stroke="none" /><circle cx="1" cy="7" r="1.3" fill="#f6e2ac" stroke="none" /><path d="M-4-11H4M-4-6H4" stroke={d.accent} strokeWidth="2" /></g>}
      </g>
    </g>
  </svg>;
});
