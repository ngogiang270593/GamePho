import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FOREST_PROFILES, forestPose, forestKnee } from '../src/game/forestLocomotion.ts';

const mat = (color, roughness = .8) => new T.MeshStandardMaterial({ color, roughness });
const colors = { skin: '#efb88f', blush: '#d98678', hair: '#29201d', hairLight: '#493529', shirt: '#637c47', trim: '#8da269', pants: '#765339', leather: '#794627', sole: '#382d24', brass: '#bd9254', basket: '#bd8242', wicker: '#dfae6b' };
const materials = Object.fromEntries(Object.entries(colors).map(([key, color]) => [key, mat(color)]));

function mesh(parent, geometry, material, position, scale) {
  const object = new T.Mesh(geometry, material);
  if (position) object.position.set(...position);
  if (scale) object.scale.set(...scale);
  parent.add(object); return object;
}
function ball(parent, material, p, s) { return mesh(parent, new T.SphereGeometry(1, 28, 20), material, p, s); }
function box(parent, material, p, s, radius = .025) { return mesh(parent, new RoundedBoxGeometry(...s, 3, radius), material, p); }
function line(parent, material, points, radius = .008) {
  return mesh(parent, new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p))), 20, radius, 6, false), material);
}
function ring(parent, material, p, radius, tube, scale = [1, 1, 1]) {
  const object = mesh(parent, new T.TorusGeometry(radius, tube, 6, 48), material, p, scale);
  object.rotation.x = Math.PI / 2; return object;
}
function bandanaTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#728e4e'; ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#425f36'; ctx.lineWidth = 2;
  for (let i = 0; i < 32; i++) {
    const x = (i * 79) % 512, y = (i * 37) % 128;
    ctx.save(); ctx.translate(x, y); ctx.rotate(i * 1.7);
    ctx.beginPath(); ctx.moveTo(-7, 0); ctx.quadraticCurveTo(0, -7, 7, 0); ctx.quadraticCurveTo(0, 6, -7, 0); ctx.moveTo(-6, 0); ctx.lineTo(8, 0); ctx.stroke(); ctx.restore();
  }
  const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; return texture;
}

export function makeForestRig(gender) {
  const female = gender === 'female', profile = FOREST_PROFILES[gender];
  const root = new T.Group(), body = new T.Group(); root.add(body);
  const skin = mat(female ? '#ffd0ad' : '#f2bb92');
  const shirt = mat(female ? '#6e8550' : '#596f42');
  const face = new T.Group(); face.position.set(0, 2.45, 0); body.add(face);
  face.scale.set(female ? 1.17 : 1.28, 1.10, 1.12);
  ball(face, skin, [0, 0, 0], [.59, female ? .62 : .59, .49]);
  for (const side of [-1, 1]) {
    ball(face, skin, [side * .57, -.06, 0], [.12, .16, .09]);
    ball(face, materials.blush, [side * .59, -.06, .065], [.055, .095, .018]);
    const x = side * .23, eye = new T.Group(); eye.position.set(x, .025, .475); face.add(eye);
    eye.scale.setScalar(female ? 1.08 : 1.02);
    ball(eye, mat('#fff7e8', .22), [0, 0, 0], [.135, .17, .045]);
    ball(eye, mat(female ? '#63402a' : '#52311d', .2), [0, -.008, .038], [.085, .126, .025]);
    ball(eye, mat('#201a16', .16), [0, -.01, .059], [.046, .09, .014]);
    ball(eye, mat('#ffffff', .1), [-.027, .05, .075], [.026, .032, .012]);
    ball(eye, mat('#fff2c9', .1), [.026, -.06, .074], [.011, .014, .009]);
    line(face, materials.hair, [[x - .12, .24, .44], [x, female ? .285 : .27, .47], [x + .12, .245, .44]], female ? .018 : .028);
    if (female) for (let lash = 0; lash < 2; lash++) line(face, materials.hair, [[x + side * .10, .12 - lash * .02, .468], [x + side * (.15 + lash * .012), .16 - lash * .02, .46]], .008);
    ball(face, mat('#e9a291'), [side * .36, -.19, .377], [.085, .045, .015]);
    for (let f = 0; f < 3; f++) ball(face, mat('#bb805c'), [side * (.29 + f * .045), -.16 - (f % 2) * .03, .421 - f * .016], [.007, .007, .006]);
  }
  ball(face, skin, [0, -.15, .487], [.043, .057, .045]);
  line(face, mat('#98523a'), [[-.09, -.30, .415], [0, -.327, .434], [.09, -.30, .415]], .010);
  // Male: cropped temples and a small rear topknot. Female: tall bun and locks.
  ball(face, materials.hair, [0, .16, -.15], [.61, .59, .44]);
  const cap = mesh(face, new T.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI * .47), materials.hair, [0, .16, -.01], [.625, .54, .51]);
  cap.rotation.z = female ? -.10 : .035;
  for (const side of [-1, 1]) {
    ball(face, materials.hair, [side * .52, female ? -.015 : .05, -.03], [.105, female ? .34 : .20, .23]);
    if (female) line(face, materials.hair, [[side * .49, .21, .25], [side * .55, -.16, .22], [side * .48, -.38, .27]], .045);
  }
  const bunY = female ? .76 : .70;
  ball(face, materials.hair, [female ? .10 : -.08, bunY, -.16], female ? [.26, .28, .25] : [.18, .17, .18]);
  for (let i = 0; i < (female ? 7 : 0); i++) {
    const t = i / 7 * Math.PI * 2;
    line(face, materials.hairLight, [[Math.sin(t) * .05, bunY + .23, -.15], [Math.sin(t) * .21, bunY + .12, -.16 + Math.cos(t) * .21], [Math.sin(t) * .17, bunY - .10, -.16 + Math.cos(t) * .16]], .006);
  }
  const bandMaterial = new T.MeshStandardMaterial({ map: bandanaTexture(), roughness: 1 });
  const band = mesh(face, new T.CylinderGeometry(.66, .68, .20, 64, 1, true), bandMaterial, [0, .38, -.04], [1, 1, .86]);
  band.rotation.z = female ? -.10 : .025;
  ball(face, materials.trim, [0, .24, -.54], [.10, .07, .05]);
  for (const side of [-1, 1]) { const tail = ball(face, bandMaterial, [side * .11, .13, -.53], [.17, .065, .028]); tail.rotation.z = side * .7; }
  ball(body, skin, [0, 1.88, 0], [.11, .17, .11]);
  const torso = new T.Group(); body.add(torso);
  const shirtPoints = [[.31, -.36], [female ? .27 : .33, -.16], [female ? .31 : .37, .16], [female ? .35 : .40, .32]].map(([x, y]) => new T.Vector2(x, y));
  const jacket = mesh(torso, new T.LatheGeometry(shirtPoints, 40), shirt, [0, 1.49, 0], [1, 1, .70]);
  ball(torso, shirt, [0, 1.79, 0], [female ? .35 : .40, .045, .27]);
  // Close the shirt hem and top; all garment pieces move with the same torso.
  ball(torso, shirt, [0, 1.15, 0], [.31, .035, .22]);
  for (const side of [-1, 1]) {
    const collar = box(torso, materials.trim, [side * .105, 1.80, .20], [.18, .15, .045]); collar.rotation.z = side * .45;
    box(torso, materials.shirt, [side * .16, 1.52, .28], [.20, .22, .035]);
    box(torso, materials.trim, [side * .16, 1.61, .307], [.21, .065, .025]);
    ball(torso, materials.brass, [side * .16, 1.60, .326], [.018, .018, .009]);
  }
  line(torso, materials.trim, [[0, 1.18, .229], [0, 1.5, .265], [0, 1.73, .24]], .009);
  for (let i = 0; i < 4; i++) ball(torso, materials.brass, [0, 1.26 + i * .13, .268], [.015, .015, .01]);
  const belt = ring(body, materials.leather, [0, 1.12, 0], .30, .045, [1, .76, 1]);
  box(body, materials.brass, [0, 1.12, .245], [.09, .07, .035], .008);
  box(body, materials.leather, [-.37, 1.14, .04], [.19, .22, .13]);
  box(body, materials.brass, [-.37, 1.18, .115], [.025, .03, .02], .006);
  const sheath = box(body, materials.leather, [.37, 1.02, .01], [.075, .29, .06]); sheath.rotation.z = -.14;
  box(body, materials.pants, [.39, 1.22, .01], [.055, .12, .05]);
  const arms = [], legs = [];
  for (const side of [-1, 1]) {
    const arm = new T.Group(); arm.position.set(side * profile.shoulder, 1.74, 0); body.add(arm);
    ball(arm, shirt, [0, -.12, 0], [.145, .24, .145]);
    const cuff = ring(arm, materials.trim, [0, -.27, 0], .125, .035); cuff.rotation.x = Math.PI / 2;
    const elbow = new T.Group(); elbow.position.y = -.29; arm.add(elbow);
    ball(elbow, skin, [0, -.15, 0], [.078, .19, .075]);
    ball(elbow, skin, [0, -.33, .018], [.088, .105, .065]);
    ball(elbow, skin, [-side * .07, -.30, .045], [.035, .055, .035]);
    for (let f = 0; f < 3; f++) line(elbow, mat('#c48e6d'), [[-.045 + f * .028, -.35, .073], [-.045 + f * .028, -.39, .061]], .003);
    arms.push({ arm, elbow, side });
    const thigh = new T.Group(); root.add(thigh);
    ball(thigh, skin, [0, -profile.upperLeg / 2, 0], [.115, profile.upperLeg / 2 + .03, .115]);
    ball(thigh, materials.pants, [0, -.12, 0], [.17, .21, .16]);
    ring(thigh, materials.pants, [0, -.29, 0], .15, .027);
    box(thigh, materials.pants, [side * .16, -.14, .035], [.065, .17, .17]);
    box(thigh, materials.brass, [side * .197, -.10, .08], [.008, .018, .02], .003);
    const shin = new T.Group(); shin.position.y = -profile.upperLeg; thigh.add(shin);
    ball(shin, skin, [0, -profile.lowerLeg / 2, 0], [.108, profile.lowerLeg / 2 + .02, .103]);
    const foot = new T.Group(); foot.position.y = -profile.lowerLeg; shin.add(foot);
    box(foot, materials.sole, [0, -.19, .095], [.26, .08, .43]);
    ball(foot, materials.leather, [0, -.11, .11], [.13, .105, .235]);
    mesh(foot, new T.CylinderGeometry(.105, .12, .27, 24), materials.leather, [0, .035, -.005]);
    ring(foot, materials.leather, [0, .17, -.005], .107, .018);
    for (let lace = 0; lace < 5; lace++) {
      const y = .12 - lace * .045, z = .102 + lace * .017;
      line(foot, materials.brass, [[-.06, y, z], [.06, y - .026, z + .005]], .007);
      line(foot, materials.brass, [[.06, y, z], [-.06, y - .026, z + .005]], .007);
    }
    legs.push({ thigh, shin, foot, side });
  }
  const basket = new T.Group(); body.add(basket); basket.position.set(0, 1.47, -.42);
  mesh(basket, new T.CylinderGeometry(.34, .25, .61, 32), materials.basket, [0, -.10, -.05], [1, 1, .70]);
  for (let row = 0; row < 10; row++) ring(basket, row % 2 ? materials.wicker : materials.leather, [0, -.39 + row * .063, -.05], .255 + row * .009, .014, [1, .72, 1]);
  for (let i = 0; i < 18; i++) {
    const angle = i / 18 * Math.PI * 2;
    line(basket, materials.wicker, [[Math.cos(angle) * .25, -.40, -.05 + Math.sin(angle) * .18], [Math.cos(angle) * .34, .22, -.05 + Math.sin(angle) * .24]], .009);
  }
  ring(basket, materials.wicker, [0, .22, -.05], .34, .025, [1, .72, 1]);
  for (let i = 0; i < 17; i++) {
    const angle = i * 2.39996, x = Math.cos(angle) * .22, z = Math.sin(angle) * .16 - .05, h = .27 + (i % 5) * .045;
    line(basket, mat('#4c6830'), [[x, .18, z], [x * 1.2, h + .2, z * 1.1]], .009);
    for (const side of [-1, 1]) { const leaf = ball(basket, mat(i % 2 ? '#71914b' : '#4b733b'), [x + side * .06, h + .10, z], [.09, .035, .025]); leaf.rotation.z = side * .55; }
    if (i % 3 === 0) ball(basket, mat('#ad4431', .5), [x, h + .23, z], [.035, .035, .035]);
  }
  for (const side of [-1, 1]) line(body, materials.leather, [[side * .25, 1.18, -.30], [side * .34, 1.83, -.08], [side * .27, 1.82, .21], [side * .28, 1.25, .24]], .035);
  function pose(action, phase, heading = 0) {
    const sampled = forestPose(action, phase, gender);
    root.rotation.y = heading;
    root.position.y = sampled.height;
    body.position.y = sampled.hip - profile.hip - .13;
    body.rotation.x = sampled.lean;
    body.rotation.z = (action === 'walk' || action === 'run') ? Math.sin(phase * Math.PI * 2) * (female ? .018 : .012) : 0;
    basket.rotation.x = sampled.basketPitch;
    for (let i = 0; i < legs.length; i++) {
      const { thigh, shin, foot, side } = legs[i], target = sampled.feet[i];
      thigh.position.set(side * profile.stance, sampled.hip, 0);
      const ik = forestKnee(sampled.hip, target.y, target.z, profile.upperLeg, profile.lowerLeg);
      thigh.rotation.x = ik.thigh; shin.rotation.x = ik.shin; foot.rotation.x = ik.ankle + target.pitch;
      const { arm, elbow } = arms[i];
      arm.rotation.x = sampled.arm * (i ? -1 : 1) + sampled.armsUp;
      arm.rotation.z = side * (female ? .08 : .13);
      elbow.rotation.x = action === 'run' ? -1.12 : -.18;
    }
    return sampled;
  }
  pose('idle', 0);
  return { root, pose };
}

export function makeForestStudio(canvas) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(256, 320, false); renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const scene = new T.Scene();
  scene.add(new T.HemisphereLight('#fff2dc', '#687464', 1.8));
  const key = new T.DirectionalLight('#fff3de', 2.5); key.position.set(-3, 6, 7); scene.add(key);
  const fill = new T.DirectionalLight('#d5e7ff', .7); fill.position.set(4, 3, 1); scene.add(fill);
  const rim = new T.DirectionalLight('#ffe5b8', 1.2); rim.position.set(0, 4, -4); scene.add(rim);
  const height = 4.25, width = height * .8;
  const camera = new T.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, .1, 100);
  camera.position.set(0, 3.0, 9); camera.lookAt(0, 1.90, 0);
  let model;
  return {
    setGender(gender) { if (model) scene.remove(model.root); model = makeForestRig(gender); scene.add(model.root); },
    render(action, phase, heading) { model.pose(action, phase, heading); renderer.render(scene, camera); return canvas.toDataURL('image/png'); },
  };
}
