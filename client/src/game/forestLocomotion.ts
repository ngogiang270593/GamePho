import type { CharacterGender } from './character';

export type ForestAction = 'idle' | 'walk' | 'turn' | 'run' | 'jump';
export const FOREST_FRAMES = 12;
export const FOREST_PROFILES = {
  male: { hip: .93, upperLeg: .39, lowerLeg: .39, stance: .19, walkSpan: .62, runSpan: .86, shoulder: .43, armSwing: .43, walkSeconds: .72, runSeconds: .48 },
  female: { hip: .91, upperLeg: .38, lowerLeg: .38, stance: .165, walkSpan: .56, runSpan: .78, shoulder: .37, armSwing: .36, walkSeconds: .78, runSeconds: .52 },
} as const;
const wrap = (x: number) => ((x % 1) + 1) % 1;
const smooth = (x: number) => x * x * (3 - 2 * x);

export function forestFoot(phase: number, running: boolean, gender: CharacterGender) {
  const p = wrap(phase), profile = FOREST_PROFILES[gender];
  const contact = running ? .36 : .62;
  const span = running ? profile.runSpan : profile.walkSpan;
  const planted = p < contact;
  const t = planted ? p / contact : (p - contact) / (1 - contact);
  const z = planted ? span * (.5 - t) : span * (smooth(t) - .5);
  const lift = planted ? 0 : Math.sin(Math.PI * t) * (running ? .22 : .10);
  const pitch = planted ? -.10 * Math.max(0, 1 - t * 5) + .22 * Math.max(0, (t - .75) * 4) : -.18 * Math.sin(Math.PI * t);
  // Rotate the attached boot around its ankle, then compensate so the lowest
  // sole corner stays on the ground throughout the support phase.
  const soleOffset = .23 * Math.cos(pitch) + Math.max(.31 * Math.sin(pitch), -.12 * Math.sin(pitch));
  return { z, y: soleOffset + lift, pitch, planted, lift };
}

export function forestKnee(hip: number, ankleY: number, ankleZ: number, upper: number, lower: number) {
  const dy = ankleY - hip, dz = ankleZ;
  const rawDistance = Math.hypot(dy, dz);
  const distance = Math.min(upper + lower - .00001, Math.max(.0001, rawDistance));
  const uy = dy / rawDistance, uz = dz / rawDistance;
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, upper * upper - along * along));
  const y = hip + uy * along + uz * bend, z = uz * along - uy * bend;
  const thigh = Math.atan2(-z, hip - y);
  const shinWorld = Math.atan2(-(ankleZ - z), y - ankleY);
  return { y, z, thigh, shin: shinWorld - thigh, ankle: -shinWorld };
}

export function forestPose(action: ForestAction, phase: number, gender: CharacterGender) {
  const profile = FOREST_PROFILES[gender], p = wrap(phase), running = action === 'run';
  const moving = action === 'walk' || running;
  const bob = moving ? Math.cos(p * Math.PI * 4) * (running ? .026 : .012) : .004 * Math.sin(p * Math.PI * 2);
  let hip = profile.hip + bob - (running ? .10 : 0), height = 0, lean = running ? .14 : .025;
  const feet = [forestFoot(p, running, gender), forestFoot(p + .5, running, gender)];
  let arm = moving ? Math.sin(p * Math.PI * 2) * (running ? .86 : profile.armSwing) : 0;
  let armsUp = 0;
  if (!moving) for (const foot of feet) Object.assign(foot, { z: 0, y: .23, pitch: 0, lift: 0, planted: true });
  if (action === 'jump') {
    const anticipation = p < .24 ? Math.sin(p / .24 * Math.PI / 2) : 0;
    const flight = Math.max(0, Math.min(1, (p - .24) / .50));
    height = p >= .24 && p <= .74 ? 4 * .52 * flight * (1 - flight) : 0;
    const landing = p > .74 ? Math.sin((p - .74) / .26 * Math.PI) : 0;
    hip -= .20 * anticipation + .16 * Math.max(0, landing);
    armsUp = height > 0 ? -1.75 * Math.sin(Math.PI * flight) : .35 * anticipation;
    lean = .035;
    arm = 0;
    for (const foot of feet) {
      foot.y += height > 0 ? .12 * Math.sin(Math.PI * flight) : 0;
      foot.z = height > 0 ? -.10 * Math.sin(Math.PI * flight) : 0;
      foot.planted = height === 0;
    }
  }
  return { hip, height, lean, arm, armsUp, feet, basketPitch: moving ? .035 * Math.sin(p * Math.PI * 4 - .65) * (running ? 2 : 1) : height * .06 };
}
