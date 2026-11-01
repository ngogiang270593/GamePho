import type { SVGProps } from 'react';

interface MountSpriteProps extends SVGProps<SVGSVGElement> {
  mountId: string;
}

function Buffalo({ golden = false }: { golden?: boolean }) {
  const coat = golden ? '#d9ae45' : '#9b6742';
  return <g stroke="#514238" strokeWidth="2" strokeLinejoin="round">
    <ellipse cx="62" cy="39" rx="28" ry="17" fill={coat} />
    <path d="M44 28Q63 21 80 29L77 39Q61 35 46 40Z" fill="#bd8a52" stroke="#74563d" />
    <path d="M52 27L55 17M70 27L73 17" stroke="#74563d" strokeWidth="2" />
    <circle cx="90" cy="31" r="13" fill={golden ? '#e2bc5c' : '#a9754d'} />
    <path d="M98 22Q109 7 110 18L101 29M83 22Q73 8 73 18L86 29" fill="none" stroke="#e8d2a0" strokeWidth="4" />
    <circle cx="94" cy="30" r="2" fill="#29322d" />
    <path d="M45 51L42 61M74 52L77 61M95 43L97 57" fill="none" strokeWidth="4" />
  </g>;
}

function Bicycle({ flowers = false }: { flowers?: boolean }) {
  return <g stroke="#55483d" strokeWidth="2">
    <circle cx="30" cy="48" r="16" fill="none" />
    <circle cx="88" cy="48" r="16" fill="none" />
    <path d="M30 48L48 25L67 48H30L57 48L72 25L88 48M48 25H72" fill="none" stroke="#85634a" strokeWidth="3" />
    <path d="M46 22H58M69 22H80M51 48L58 57M83 48L77 56" fill="none" />
    {flowers && <g fill="#e58e71" stroke="#9e5e4d"><circle cx="72" cy="20" r="5" /><circle cx="80" cy="22" r="4" /><circle cx="76" cy="15" r="4" /></g>}
  </g>;
}

export function MountSprite({ mountId, ...props }: MountSpriteProps) {
  let artwork;
  if (mountId.includes('buffalo')) {
    artwork = <Buffalo golden={mountId.includes('golden')} />;
  } else if (mountId.includes('dragon')) {
    artwork = <g stroke="#66845c" strokeWidth="2" strokeLinejoin="round">
      <path d="M18 45Q8 35 20 29L29 32Q39 18 53 28Q63 16 75 28L91 25Q108 27 107 40L93 45L83 52H35Z" fill="#91b676" />
      <path d="M25 35L12 23L32 29M90 31L106 17L101 38M43 48L38 58M73 48L77 58" fill="#9ec880" />
      <circle cx="97" cy="34" r="2" fill="#354537" />
    </g>;
  } else if (mountId.includes('phoenix')) {
    artwork = <g stroke="#a55e45" strokeWidth="2">
      <ellipse cx="57" cy="41" rx="26" ry="13" fill="#e2a56b" />
      <path d="M42 43Q19 37 20 18Q39 25 52 37M66 39Q84 16 103 20Q95 37 72 46M80 35Q92 27 101 31L91 43M46 51L39 61M69 51L75 61" fill="#e9bd73" />
      <circle cx="82" cy="37" r="2" fill="#3f3b35" />
    </g>;
  } else if (mountId.includes('koi')) {
    artwork = <g stroke="#986348" strokeWidth="2">
      <path d="M19 38Q39 18 69 29Q89 37 101 26L111 21L108 35L114 48L100 44Q80 57 57 50Q34 59 19 38Z" fill="#e58d65" />
      <path d="M49 29Q58 20 67 31M67 47Q78 38 86 47M98 31L105 33" fill="none" stroke="#fff1d2" strokeWidth="4" />
      <circle cx="37" cy="36" r="2" fill="#333" />
    </g>;
  } else if (mountId.includes('spirit')) {
    artwork = <g stroke="#6b9880" strokeWidth="2">
      <path d="M18 47Q8 44 15 34Q18 27 28 30Q29 19 42 19Q54 18 58 30Q72 23 80 34Q91 34 90 44Q88 53 76 53H25Z" fill="#dff7e7" />
      <circle cx="37" cy="37" r="3" fill="#f2d879" /><circle cx="62" cy="33" r="3" fill="#f2d879" /><circle cx="76" cy="44" r="2" fill="#f2d879" />
    </g>;
  } else if (mountId.includes('cloud')) {
    artwork = <g>
      <path d="M20 45Q8 44 14 33Q17 26 26 29Q27 17 41 18Q54 18 57 29Q71 22 78 33Q90 33 90 43Q88 52 76 52H25Z" fill="#fff3cf" stroke="#b89966" strokeWidth="2" />
      <path d="M37 39H77" stroke="#a57e4f" strokeWidth="3" /><circle cx="31" cy="54" r="3" fill="#f3c86b" />
    </g>;
  } else if (mountId.includes('cart')) {
    artwork = <g stroke="#6e5238" strokeWidth="3">
      <circle cx="34" cy="52" r="10" fill="#b68b53" /><circle cx="88" cy="52" r="10" fill="#b68b53" />
      <path d="M20 31H94L87 48H34ZM28 28L22 20M88 31L103 27" fill="#d0a56b" />
    </g>;
  } else if (mountId.includes('tractor')) {
    artwork = <g stroke="#4c5d42" strokeWidth="3">
      <circle cx="35" cy="51" r="14" fill="#607b50" /><circle cx="87" cy="52" r="9" fill="#879563" />
      <path d="M22 30H83L92 47H43L35 39H24Z" fill="#8ba65b" /><path d="M61 28V18H82V31M67 18H86" fill="none" />
    </g>;
  } else if (mountId.includes('horse')) {
    artwork = <g stroke="#6b5544" strokeWidth="2" strokeLinejoin="round">
      <path d="M30 43Q24 30 36 25L47 12L61 19L77 18Q88 18 91 30L101 34L96 44L83 43L76 54H63L59 43L47 44L43 59H36L36 42Z" fill="#f3e8cc" />
      <path d="M46 15Q52 5 61 12L62 21M77 21L83 11L87 25M32 29L22 24L28 35" fill="#fff7e6" />
      <path d="M41 29Q54 34 71 29M47 36L64 36" fill="none" stroke="#c6ab83" />
      <path d="M56 22H76L80 28H55Z" fill="#bd8a52" stroke="#74563d" />
      <circle cx="87" cy="28" r="2" fill="#413c36" />
    </g>;
  } else {
    artwork = <Bicycle flowers={mountId.includes('flower-bike')} />;
  }

  return <svg viewBox="0 0 120 68" role="img" aria-label="Thú cưỡi đang trang bị" data-mount={mountId} {...props}>{artwork}</svg>;
}
