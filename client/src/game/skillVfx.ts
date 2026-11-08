export type SkillVfxPoint = { x: number; y: number };
export type SkillVfxSkill =
  | 'ha-ba-tuc-cong'
  | 'ca-coc-phon-thuy'
  | 'rai-ca-quan-thuy'
  | 'rua-dam-lay-thu'
  | 'ha-ba-cuon-luu'
  | 'bay-tre-gai';
export type SkillVfxPhase = 'prepare' | 'travel' | 'impact';
export type SkillVfxEffect = {
  id: number;
  skill: SkillVfxSkill;
  phase: SkillVfxPhase;
  from: SkillVfxPoint;
  to: SkillVfxPoint;
};

type Particle = {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number;
  size: number; hue: number; gravity: number;
};

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const easeOut = (value: number) => 1 - (1 - clamp(value)) ** 3;
const easeInOut = (value: number) => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
const TAU = Math.PI * 2;

export class SkillTimeline {
  private readonly durations: Record<SkillVfxPhase, number> = { prepare: 360, travel: 650, impact: 360 };
  constructor(private readonly skill: SkillVfxSkill, private readonly reducedMotion: boolean) {
    if (skill === 'ha-ba-cuon-luu') this.durations = { prepare: 420, travel: 1050, impact: 520 };
    else if (skill === 'rai-ca-quan-thuy') this.durations = { prepare: 220, travel: 560, impact: 300 };
    else if (skill === 'ha-ba-tuc-cong') this.durations = { prepare: 280, travel: 720, impact: 320 };
    else if (skill === 'bay-tre-gai') this.durations = { prepare: 250, travel: 430, impact: 300 };
    if (reducedMotion) {
      this.durations.prepare *= .6;
      this.durations.travel *= .6;
      this.durations.impact *= .6;
    }
  }
  duration(phase: SkillVfxPhase) { return this.durations[phase]; }
}

export abstract class SkillVFXBase {
  constructor(protected readonly ctx: CanvasRenderingContext2D) {}
  protected glow(color: string, blur: number) {
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = blur;
  }
  protected resetGlow() {
    this.ctx.shadowBlur = 0;
  }
  protected stroke(points: SkillVfxPoint[], color: string, width: number, alpha = 1, smooth = true) {
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.glow(color, width * 2.4);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    if (smooth && points.length > 2) {
      for (let index = 1; index < points.length - 1; index += 1) {
        const midX = (points[index].x + points[index + 1].x) / 2;
        const midY = (points[index].y + points[index + 1].y) / 2;
        ctx.quadraticCurveTo(points[index].x, points[index].y, midX, midY);
      }
      const last = points[points.length - 1];
      ctx.lineTo(last.x, last.y);
    } else {
      points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
    }
    ctx.stroke();
    ctx.restore();
  }
  protected bead(x: number, y: number, radius: number, color: string, alpha = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    this.glow(color, radius * 2.7);
    const gradient = ctx.createRadialGradient(x - radius * .3, y - radius * .38, 0, x, y, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(.24, color);
    gradient.addColorStop(1, `${color}00`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * .76, radius, -.25, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

export class SkillSpriteAnimation extends SkillVFXBase {
  drawCastPose(origin: SkillVfxPoint, direction: number, progress: number, phase: SkillVfxPhase) {
    const ctx = this.ctx;
    const pull = phase === 'prepare' ? 1 - easeOut(progress) : phase === 'travel' ? easeInOut(progress) : 1;
    ctx.save();
    ctx.translate(origin.x, origin.y);
    ctx.rotate(direction);
    ctx.globalAlpha = .22 + pull * .16;
    this.glow('#e8ffff', 14);
    ctx.strokeStyle = '#e8ffff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 13 + pull * 5, -.8, .8);
    ctx.stroke();
    ctx.restore();
  }
  drawRunner(point: SkillVfxPoint, cell: number, angle: number, progress: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.globalAlpha = .68 + Math.sin(progress * Math.PI) * .28;
    this.glow('#70fff0', 12);
    ctx.strokeStyle = '#d9ffff';
    ctx.fillStyle = '#64dddc';
    ctx.lineWidth = Math.max(2, cell * .045);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(0, 0, cell * .075, cell * .13, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -cell * .2, cell * .055, 0, TAU);
    ctx.fill();
    const stride = Math.sin(progress * Math.PI * 4) * cell * .1;
    ctx.beginPath();
    ctx.moveTo(-cell * .045, cell * .1);
    ctx.lineTo(-cell * .1, cell * .2 + stride);
    ctx.moveTo(cell * .045, cell * .1);
    ctx.lineTo(cell * .12, cell * .2 - stride);
    ctx.moveTo(-cell * .06, -cell * .02);
    ctx.lineTo(-cell * .17, cell * .045);
    ctx.moveTo(cell * .06, -cell * .02);
    ctx.lineTo(cell * .2, -cell * .11);
    ctx.stroke();
    ctx.restore();
  }
}

export class SkillParticleSystem extends SkillVFXBase {
  private readonly particles: Particle[];
  constructor(ctx: CanvasRenderingContext2D, private readonly reducedMotion: boolean) {
    super(ctx);
    this.particles = Array.from({ length: reducedMotion ? 28 : 64 }, () => ({
      x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 1, hue: 190, gravity: 0,
    }));
  }
  burst(x: number, y: number, hue = 190, power = 1) {
    const activeCount = this.reducedMotion ? 12 : 28;
    for (let index = 0; index < activeCount; index += 1) {
      const particle = this.particles[index];
      const angle = index / activeCount * TAU + Math.random() * .22;
      const speed = (.65 + Math.random() * 2.1) * power;
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed - Math.random() * .65;
      particle.life = .45 + Math.random() * .55;
      particle.maxLife = particle.life;
      particle.size = 1 + Math.random() * 3.2;
      particle.hue = hue;
      particle.gravity = .055 + Math.random() * .05;
    }
  }
  draw(delta: number) {
    for (const particle of this.particles) {
      if (particle.life <= 0) continue;
      particle.x += particle.vx * delta * 60;
      particle.y += particle.vy * delta * 60;
      particle.vy += particle.gravity * delta * 60;
      particle.life -= delta;
      const alpha = clamp(particle.life / particle.maxLife);
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsla(${particle.hue} 90% ${particle.hue > 160 ? '77%' : '70%'} / ${alpha})`;
      this.glow(`hsl(${particle.hue} 100% 72%)`, particle.size * 3);
      ctx.beginPath();
      ctx.ellipse(particle.x, particle.y, particle.size * .62, particle.size * 1.35, Math.atan2(particle.vy, particle.vx), 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  clear() {
    this.particles.forEach(particle => { particle.life = 0; });
  }
  get hasActiveParticles() { return this.particles.some(particle => particle.life > 0); }
}

export class SkillMotionTrail extends SkillVFXBase {
  private readonly points: SkillVfxPoint[] = [];
  add(point: SkillVfxPoint) {
    this.points.push(point);
    if (this.points.length > 16) this.points.shift();
  }
  clear() { this.points.length = 0; }
  draw(color: string, width: number, alpha = 1) {
    if (this.points.length < 2) return;
    this.stroke(this.points, color, width, alpha);
    this.stroke(this.points.slice(Math.floor(this.points.length / 3)), '#f2ffff', Math.max(1, width * .22), alpha * .9);
  }
}

export class SkillImpactEffect extends SkillVFXBase {
  drawAt(point: SkillVfxPoint, progress: number, color: string, power = 1) {
    const ctx = this.ctx;
    const eased = easeOut(progress);
    const radius = (8 + eased * 48) * power;
    ctx.save();
    ctx.globalAlpha = (1 - progress) * .85;
    this.glow(color, 18);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5 * (1 - progress) + .5;
    for (let index = 0; index < 3; index += 1) {
      ctx.beginPath();
      ctx.ellipse(point.x, point.y, radius * (1 + index * .26), radius * (.26 + index * .07), -.12, -.18 + index * .26, Math.PI * 1.55 + index * .22);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export class SkillVFXManager {
  private readonly contexts: [CanvasRenderingContext2D, CanvasRenderingContext2D];
  private readonly canvases: [HTMLCanvasElement, HTMLCanvasElement];
  private readonly particles: SkillParticleSystem;
  private readonly trail: SkillMotionTrail;
  private readonly sprite: SkillSpriteAnimation;
  private readonly impact: SkillImpactEffect;
  private effect: SkillVfxEffect | null = null;
  private timeline: SkillTimeline | null = null;
  private phaseStartedAt = 0;
  private previousFrameAt = 0;
  private animationFrame = 0;
  private resizeObserver: ResizeObserver;
  private reduceMotion = false;
  private disposed = false;

  constructor(private readonly host: HTMLElement, private readonly reducedQuality: boolean) {
    const makeCanvas = (layer: 'behind' | 'front') => {
      const canvas = document.createElement('canvas');
      canvas.className = `skill-vfx__canvas skill-vfx__canvas--${layer}`;
      canvas.setAttribute('aria-hidden', 'true');
      host.appendChild(canvas);
      return canvas;
    };
    this.canvases = [makeCanvas('behind'), makeCanvas('front')];
    const contexts = this.canvases.map(canvas => canvas.getContext('2d', { alpha: true, desynchronized: true }));
    if (!contexts[0] || !contexts[1]) {
      this.canvases.forEach(canvas => canvas.remove());
      throw new Error('Canvas 2D context is unavailable.');
    }
    this.contexts = contexts as [CanvasRenderingContext2D, CanvasRenderingContext2D];
    this.particles = new SkillParticleSystem(this.contexts[1], reducedQuality);
    this.trail = new SkillMotionTrail(this.contexts[0]);
    this.sprite = new SkillSpriteAnimation(this.contexts[1]);
    this.impact = new SkillImpactEffect(this.contexts[1]);
    this.reduceMotion = reducedQuality || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
  }

  setEffect(effect: SkillVfxEffect | null) {
    if (!effect) {
      this.effect = null;
      this.timeline = null;
      this.trail.clear();
      this.particles.clear();
      this.clear();
      return;
    }
    if (this.effect?.id !== effect.id) {
      this.trail.clear();
      this.timeline = new SkillTimeline(effect.skill, this.reduceMotion);
      this.phaseStartedAt = performance.now();
      this.previousFrameAt = this.phaseStartedAt;
    } else if (this.effect.phase !== effect.phase) {
      this.phaseStartedAt = performance.now();
      if (effect.phase === 'impact') {
        const point = this.pointToCanvas(effect.to);
        const hue = effect.skill === 'bay-tre-gai' ? 34 : effect.skill === 'rua-dam-lay-thu' ? 158 : 190;
        this.particles.burst(point.x, point.y, hue, effect.skill === 'ha-ba-cuon-luu' ? 1.5 : 1);
      } else if (effect.phase === 'travel' && effect.skill === 'ha-ba-cuon-luu') {
        const point = this.pointToCanvas(effect.to);
        this.particles.burst(point.x, point.y, 190, .16);
      }
    }
    this.effect = effect;
    this.startLoop();
  }

  private resize() {
    const rect = this.host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, this.reducedQuality ? 1 : 1.65);
    this.canvases.forEach(canvas => {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }

  private pointToCanvas(point: SkillVfxPoint): SkillVfxPoint {
    const rect = this.host.getBoundingClientRect();
    const pitchX = (rect.width - 43) / 6;
    const pitchY = (rect.height - 43) / 6;
    return { x: 9 + (point.x + .5) * pitchX + point.x * 5, y: 9 + (point.y + .5) * pitchY + point.y * 5 };
  }

  private startLoop() {
    if (this.animationFrame || this.disposed) return;
    this.animationFrame = requestAnimationFrame(this.render);
  }

  private render = (time: number) => {
    this.animationFrame = 0;
    if (this.disposed || !this.effect || !this.timeline) return;
    const delta = Math.min(.05, Math.max(0, (time - this.previousFrameAt) / 1000));
    this.previousFrameAt = time;
    this.clear();
    const elapsed = time - this.phaseStartedAt;
    const duration = this.timeline.duration(this.effect.phase);
    const progress = clamp(elapsed / duration);
    this.drawEffect(this.effect, progress, delta, time);
    this.particles.draw(delta);
    const hasParticles = this.particles.hasActiveParticles;
    if (elapsed < duration || hasParticles) {
      this.animationFrame = requestAnimationFrame(this.render);
    } else {
      this.clear();
      this.effect = null;
      this.timeline = null;
    }
  };

  private clear() {
    this.contexts.forEach((context, index) => {
      const canvas = this.canvases[index];
      context.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  private drawEffect(effect: SkillVfxEffect, progress: number, delta: number, time: number) {
    const from = this.pointToCanvas(effect.from);
    const to = this.pointToCanvas(effect.to);
    const cell = Math.min((this.host.clientWidth - 13) / 6, (this.host.clientHeight - 13) / 6);
    const ctx = this.contexts[1];
    const behind = this.contexts[0];
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const prepare = effect.phase === 'prepare';
    const travel = effect.phase === 'travel';
    const impact = effect.phase === 'impact';
    const p = easeInOut(progress);
    const px = (x: number) => x * cell;
    ctx.save();
    behind.save();
    ctx.globalCompositeOperation = 'lighter';
    behind.globalCompositeOperation = 'lighter';

    switch (effect.skill) {
      case 'ha-ba-tuc-cong':
        this.drawWaterBreath(ctx, behind, from, cell, progress, time, prepare, impact);
        break;
      case 'ca-coc-phon-thuy':
        this.drawWaterDart(ctx, behind, from, to, cell, angle, progress, p, prepare, travel, impact, time, delta);
        break;
      case 'rai-ca-quan-thuy':
        this.drawOtterDash(ctx, behind, from, to, cell, angle, progress, p, prepare, travel, impact, time);
        break;
      case 'rua-dam-lay-thu':
        this.drawTurtleGuard(ctx, behind, from, to, cell, angle, progress, prepare, travel, impact, time);
        break;
      case 'ha-ba-cuon-luu':
        this.drawWhirlpool(ctx, behind, from, to, cell, progress, p, prepare, travel, impact, time, delta);
        break;
      case 'bay-tre-gai':
        this.drawBambooTrap(ctx, behind, from, to, cell, progress, prepare, travel, impact, time);
        break;
    }
    if (prepare || travel) this.sprite.drawCastPose(from, angle, progress, effect.phase);
    if (impact) {
      const hue = effect.skill === 'bay-tre-gai' ? '#ffd486' : '#bcffff';
      this.impact.drawAt(to, progress, hue, effect.skill === 'ha-ba-cuon-luu' ? 1.5 : 1);
    }
    ctx.restore();
    behind.restore();
  }

  private drawWaterBreath(ctx: CanvasRenderingContext2D, behind: CanvasRenderingContext2D, origin: SkillVfxPoint, cell: number, p: number, time: number, prepare: boolean, impact: boolean) {
    const breath = Math.sin(time / 330) * .06;
    for (let layer = 0; layer < 4; layer += 1) {
      const target = layer % 2 ? behind : ctx;
      target.save();
      target.translate(origin.x, origin.y);
      target.rotate(time / 900 * (layer % 2 ? -1 : 1) + layer * .7);
      target.beginPath();
      target.ellipse(0, 0, cell * (.27 + layer * .045 + breath), cell * (.1 + layer * .012), 0, .35, Math.PI * 1.68);
      target.strokeStyle = layer % 2 ? '#65f5eb' : '#caffff';
      target.globalAlpha = prepare ? .8 : impact ? .28 : .55;
      target.lineWidth = layer === 0 ? 3 : 1.2;
      target.shadowColor = '#49e8e4';
      target.shadowBlur = 14;
      target.stroke();
      target.restore();
    }
    for (let index = 0; index < 7; index += 1) {
      const angle = index * TAU / 7 + time / 720;
      const radius = cell * (.25 + (index % 2) * .1);
      this.drawDroplet(ctx, origin.x + Math.cos(angle) * radius, origin.y + Math.sin(angle) * radius * .45 - (time / 90 + index * 9) % 18, 2.2 + index % 3, '#aaffff');
    }
    ctx.save();
    ctx.globalAlpha = impact ? .42 : .18;
    ctx.fillStyle = '#68e7de';
    ctx.font = `700 ${Math.max(9, cell * .2)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('+HP  +MP', origin.x, origin.y - cell * .42);
    ctx.restore();
  }

  private drawWaterDart(ctx: CanvasRenderingContext2D, behind: CanvasRenderingContext2D, from: SkillVfxPoint, to: SkillVfxPoint, cell: number, angle: number, progress: number, p: number, prepare: boolean, travel: boolean, impact: boolean, time: number, delta: number) {
    const start = { x: from.x + Math.cos(angle) * cell * .18, y: from.y + Math.sin(angle) * cell * .18 };
    const control = { x: (from.x + to.x) / 2 + Math.cos(angle + Math.PI / 2) * cell * .22, y: (from.y + to.y) / 2 + Math.sin(angle + Math.PI / 2) * cell * .22 };
    if (prepare) {
      this.drawGatheringWater(ctx, start, cell, progress, time);
      return;
    }
    if (travel) {
      const tip = this.quadratic(start, control, to, p);
      const trailPoints: SkillVfxPoint[] = [];
      for (let index = 0; index <= 8; index += 1) {
        const q = Math.max(0, p - index * .045);
        const point = this.quadratic(start, control, to, q);
        trailPoints.push({ x: point.x + Math.sin(time / 80 + index) * 2.2, y: point.y + Math.cos(time / 90 + index) * 2.2 });
      }
      this.stroke(behind, trailPoints, '#1689d7', 10, .45);
      this.stroke(ctx, trailPoints, '#4ef2ff', 5.2, .95);
      this.stroke(ctx, trailPoints.slice(0, 6), '#eeffff', 1.8, .9);
      this.trail.add(tip);
      this.trail.draw('#46deef', cell * .085, .7);
      const tangent = this.quadratic(start, control, to, Math.min(1, p + .02));
      const direction = Math.atan2(tangent.y - tip.y, tangent.x - tip.x);
      this.drawFrogProjectile(ctx, tip, direction, cell, time);
      for (let index = 0; index < 5; index += 1) {
        const trailPoint = this.quadratic(start, control, to, Math.max(0, p - index * .09));
        this.drawDroplet(ctx, trailPoint.x, trailPoint.y + Math.sin(time / 70 + index) * 3, 2 + index % 3, '#a7ffff');
      }
      return;
    }
    if (impact) {
      this.drawSplash(ctx, to, cell, progress, time);
      this.drawArmorCrack(ctx, to, cell, progress);
    }
  }

  private drawOtterDash(ctx: CanvasRenderingContext2D, behind: CanvasRenderingContext2D, from: SkillVfxPoint, to: SkillVfxPoint, cell: number, angle: number, progress: number, p: number, prepare: boolean, travel: boolean, impact: boolean, time: number) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (prepare) {
      this.drawSpeedLines(ctx, from, angle, cell, .5 + progress);
      this.drawWaterRing(behind, from, cell * (.18 + progress * .08), '#56e8df', .62);
      return;
    }
    if (travel) {
      const head = { x: from.x + dx * p, y: from.y + dy * p };
      this.sprite.drawRunner(head, cell, angle, progress);
      for (let index = 3; index >= 1; index -= 1) {
        const backProgress = clamp(p - index * .15);
        const ghost = { x: from.x + dx * backProgress - Math.sin(progress * Math.PI) * cell * .13, y: from.y + dy * backProgress + Math.cos(progress * Math.PI) * cell * .1 };
        this.drawAfterimage(behind, ghost, cell, angle, (4 - index) * .13);
      }
      const ribbon: SkillVfxPoint[] = [];
      for (let index = 0; index < 11; index += 1) {
        const q = clamp(p - index * .055);
        ribbon.push({ x: from.x + dx * q, y: from.y + dy * q + Math.sin(q * Math.PI * 2 + time / 100) * cell * .11 });
      }
      this.stroke(behind, ribbon, '#36bde6', cell * .16, .32);
      this.stroke(ctx, ribbon, '#71f4e3', cell * .065, .76);
      this.trail.add(head);
      this.trail.draw('#6bfff1', cell * .12, .48);
      this.drawSpeedLines(ctx, head, angle, cell, progress);
      return;
    }
    if (impact) {
      this.drawAfterimage(behind, to, cell, angle, .3);
      this.drawSlash(ctx, to, angle, cell, progress, '#fff3bc');
      this.drawSplash(ctx, to, cell * .72, progress, time);
    }
  }

  private drawTurtleGuard(ctx: CanvasRenderingContext2D, behind: CanvasRenderingContext2D, from: SkillVfxPoint, to: SkillVfxPoint, cell: number, angle: number, progress: number, prepare: boolean, travel: boolean, impact: boolean, time: number) {
    const center = { x: from.x + Math.cos(angle) * cell * .28, y: from.y + Math.sin(angle) * cell * .28 };
    const r = cell * (.25 + (prepare ? easeOut(progress) : 1) * .09);
    if (prepare || travel) {
      this.drawShell(behind, center, r * 1.17, time, .45);
      this.drawShell(ctx, center, r, time, .88);
      this.drawGroundSigil(behind, from, cell * .43, time, .38);
    }
    if (impact) {
      this.drawImpactSparks(ctx, to, cell, progress, '#a7f4da');
      this.drawWaterRing(ctx, to, cell * (.28 + progress * .34), '#b7fff1', 1 - progress);
      this.drawShell(ctx, center, r * 1.15, time, .7 * (1 - progress));
    }
  }

  private drawWhirlpool(ctx: CanvasRenderingContext2D, behind: CanvasRenderingContext2D, from: SkillVfxPoint, center: SkillVfxPoint, cell: number, progress: number, p: number, prepare: boolean, travel: boolean, impact: boolean, time: number, delta: number) {
    const grow = prepare ? .16 + progress * .16 : travel ? .34 + p * 1.02 : 1.36 + progress * .32;
    const rX = cell * grow;
    const rY = rX * .43;
    this.drawGroundSigil(behind, center, rX * .94, time, prepare ? .3 : .68);

    if (prepare) {
      this.drawWaterRibbon(behind, from, center, cell, progress, time, .22);
      this.drawGatheringWater(ctx, from, cell, progress, time);
      return;
    }

    if (travel) {
      this.drawWaterDragon(behind, center, cell * grow * 1.08, time + Math.PI, .36);
      for (let layer = 0; layer < 4; layer += 1) {
        const target = layer % 2 ? behind : ctx;
        target.save();
        target.translate(center.x, center.y);
        target.rotate(time / 420 * (layer % 2 ? -1 : 1) + layer * .55);
        target.beginPath();
        target.ellipse(0, 0, rX * (1 - layer * .09), rY * (1 - layer * .08), 0, .16 + layer * .16, Math.PI * 1.66 + layer * .08);
        target.strokeStyle = layer % 2 ? '#21bfe5' : layer % 3 ? '#66fff0' : '#f1ffff';
        target.lineWidth = layer === 0 ? cell * .065 : cell * .025;
        target.globalAlpha = .54 - layer * .075;
        target.shadowColor = '#43e7f0';
        target.shadowBlur = 11;
        target.stroke();
        target.restore();
      }
      this.drawWaterRibbon(behind, from, center, cell, progress, time, .75);
      this.drawPullStreaks(ctx, center, cell, progress, time);
      this.drawWaterDragon(ctx, center, cell * grow * 1.12, time, .94);
      return;
    }
    if (impact) {
      this.drawImpactSparks(ctx, center, cell * 1.5, progress, '#dcffff');
      this.drawSplash(ctx, center, cell * 1.65, progress, time);
      for (let index = 0; index < 6; index += 1) {
        const angle = index / 6 * TAU + time / 120;
        this.drawDroplet(ctx, center.x + Math.cos(angle) * rX * 1.1, center.y + Math.sin(angle) * rY * 1.2, 2 + (index % 3), '#abffff');
      }
      if (progress < .72) this.drawWaterDragon(behind, center, cell * .82, time, .5 * (1 - progress));
      return;
    }
    void delta;
  }

  private drawBambooTrap(ctx: CanvasRenderingContext2D, behind: CanvasRenderingContext2D, from: SkillVfxPoint, to: SkillVfxPoint, cell: number, progress: number, prepare: boolean, travel: boolean, impact: boolean, time: number) {
    if (prepare) {
      this.drawGroundSigil(behind, to, cell * (.23 + progress * .06), time, .35 + progress * .25);
      this.drawKneelLines(ctx, from, cell, progress);
      return;
    }
    if (travel) {
      this.drawGroundSigil(behind, to, cell * .32, time, .48);
      const height = cell * easeOut(progress) * .62;
      for (let index = 0; index < 7; index += 1) {
        const angle = index * TAU / 7;
        const x = to.x + Math.cos(angle) * cell * .15;
        const y = to.y + Math.sin(angle) * cell * .12;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle - Math.PI / 2);
        ctx.fillStyle = '#86b767';
        ctx.shadowColor = '#a5dc81';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, -height);
        ctx.lineTo(cell * .055, 0);
        ctx.lineTo(-cell * .055, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      return;
    }
    if (impact) {
      this.drawGroundSigil(behind, to, cell * (.32 + progress * .28), time, .62 * (1 - progress));
      this.drawBambooBurst(ctx, to, cell, progress);
      this.drawImpactSparks(ctx, to, cell * .8, progress, '#e3b46b');
    }
  }

  private drawGatheringWater(ctx: CanvasRenderingContext2D, point: SkillVfxPoint, cell: number, progress: number, time: number) {
    for (let index = 0; index < 4; index += 1) {
      const radius = cell * (.06 + progress * (.08 + index * .035));
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(time / 180 * (index % 2 ? -1 : 1) + index);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.3, radius * .48, 0, .3, Math.PI * 1.65);
      ctx.strokeStyle = index % 2 ? '#43d9f7' : '#cfffff';
      ctx.lineWidth = 2.4 - index * .3;
      ctx.globalAlpha = .85 - index * .11;
      ctx.shadowColor = '#4feaff';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    }
    for (let index = 0; index < 4; index += 1) {
      const angle = index * TAU / 4 + time / 210;
      this.drawDroplet(ctx, point.x + Math.cos(angle) * cell * .2, point.y + Math.sin(angle) * cell * .1, 2.5, '#a8ffff');
    }
  }

  private drawFrogProjectile(ctx: CanvasRenderingContext2D, point: SkillVfxPoint, angle: number, cell: number, time: number) {
    const size = cell * .11;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.scale(1.35, .9);
    ctx.shadowColor = '#6effff';
    ctx.shadowBlur = 16;
    const gradient = ctx.createRadialGradient(-size * .3, -size * .35, 0, 0, 0, size);
    gradient.addColorStop(0, '#f4ffff');
    gradient.addColorStop(.3, '#74f5ff');
    gradient.addColorStop(1, '#168bc9');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.15, size * .72, 0, 0, TAU);
    ctx.fill();
    for (const eyeX of [-.6, .6]) {
      ctx.fillStyle = '#c9ffff';
      ctx.beginPath();
      ctx.arc(size * eyeX, -size * .48, size * .22, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#175a85';
      ctx.beginPath();
      ctx.arc(size * eyeX, -size * .48, size * .1, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    this.drawDroplet(ctx, point.x - Math.cos(angle) * size * 1.8, point.y - Math.sin(angle) * size * 1.8 + Math.sin(time / 45) * 2, 2, '#caffff');
  }

  private drawSplash(ctx: CanvasRenderingContext2D, point: SkillVfxPoint, cell: number, progress: number, time: number) {
    const radius = cell * (.09 + easeOut(progress) * .43);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(time / 200);
    for (let layer = 0; layer < 4; layer += 1) {
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (1 + layer * .19), radius * (.28 + layer * .07), 0, -.2 + layer * .4, Math.PI * 1.45 + layer * .26);
      ctx.strokeStyle = layer % 2 ? '#3bbff3' : '#e5ffff';
      ctx.lineWidth = Math.max(.8, 3.2 - layer * .6);
      ctx.globalAlpha = (1 - progress) * (.9 - layer * .12);
      ctx.shadowColor = '#71f7ff';
      ctx.shadowBlur = 12;
      ctx.stroke();
    }
    ctx.restore();
    for (let index = 0; index < 10; index += 1) {
      const angle = index * TAU / 10 + time / 150;
      const r = radius * (1.1 + (index % 3) * .15);
      this.drawDroplet(ctx, point.x + Math.cos(angle) * r, point.y + Math.sin(angle) * r * .6, 2 + index % 3, index % 2 ? '#63eaff' : '#efffff');
    }
    if (progress < .55) {
      ctx.save();
      ctx.globalAlpha = (1 - progress / .55) * .5;
      ctx.fillStyle = '#faffff';
      ctx.beginPath();
      ctx.arc(point.x, point.y, cell * .14, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawArmorCrack(ctx: CanvasRenderingContext2D, point: SkillVfxPoint, cell: number, progress: number) {
    if (progress > .82) return;
    const alpha = 1 - progress / .82;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(-.3);
    ctx.strokeStyle = '#a6faff';
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#d7ffff';
    ctx.shadowBlur = 8;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -cell * .19);
      ctx.lineTo(side * cell * .07, -cell * .06);
      ctx.lineTo(0, cell * .02);
      ctx.lineTo(side * cell * .1, cell * .13);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawAfterimage(ctx: CanvasRenderingContext2D, point: SkillVfxPoint, cell: number, angle: number, alpha: number) {
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#7df8ee';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#a8fff1';
    ctx.beginPath();
    ctx.ellipse(0, 0, cell * .08, cell * .19, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -cell * .23, cell * .055, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#d5ffff';
    ctx.lineWidth = cell * .027;
    ctx.beginPath();
    ctx.moveTo(-cell * .1, -cell * .02);
    ctx.lineTo(cell * .1, -cell * .02);
    ctx.moveTo(-cell * .05, cell * .13);
    ctx.lineTo(-cell * .12, cell * .23);
    ctx.moveTo(cell * .05, cell * .13);
    ctx.lineTo(cell * .12, cell * .23);
    ctx.stroke();
    ctx.restore();
  }

  private drawSpeedLines(ctx: CanvasRenderingContext2D, point: SkillVfxPoint, angle: number, cell: number, progress: number) {
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.globalAlpha = .25 + progress * .48;
    ctx.strokeStyle = '#b3fff7';
    ctx.lineWidth = 1.5;
    for (let index = 0; index < 5; index += 1) {
      const offset = (index - 2) * cell * .075;
      ctx.beginPath();
      ctx.moveTo(-cell * (.12 + progress * .2), offset);
      ctx.quadraticCurveTo(-cell * .3, offset + cell * .035, -cell * (.48 + progress * .12), offset);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawSlash(ctx: CanvasRenderingContext2D, point: SkillVfxPoint, angle: number, cell: number, progress: number, color: string) {
    const radius = cell * (.12 + progress * .34);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle + Math.PI);
    ctx.globalAlpha = 1 - progress * .7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#faffd8';
    ctx.lineWidth = cell * .11 * (1 - progress * .5);
    ctx.beginPath();
    ctx.moveTo(-radius, radius * .56);
    ctx.quadraticCurveTo(-radius * .1, -radius * .72, radius, -radius * .33);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = cell * .045;
    ctx.beginPath();
    ctx.moveTo(-radius * .92, radius * .68);
    ctx.quadraticCurveTo(-radius * .05, -radius * .85, radius * 1.1, -radius * .28);
    ctx.stroke();
    ctx.restore();
  }

  private drawShell(ctx: CanvasRenderingContext2D, point: SkillVfxPoint, radius: number, time: number, alpha: number) {
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(time / 1600);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#8ff7cb';
    ctx.shadowBlur = 16;
    const gradient = ctx.createRadialGradient(-radius * .24, -radius * .4, radius * .08, 0, 0, radius);
    gradient.addColorStop(0, '#f0ffe4');
    gradient.addColorStop(.35, '#7be2b8');
    gradient.addColorStop(1, '#256d62');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#c9ffe1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-radius, radius * .25);
    ctx.quadraticCurveTo(-radius * 1.08, -radius * .65, 0, -radius);
    ctx.quadraticCurveTo(radius * 1.06, -radius * .6, radius, radius * .25);
    ctx.quadraticCurveTo(0, radius * .92, -radius, radius * .25);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#d9ffe9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -radius * .88);
    ctx.lineTo(0, radius * .67);
    ctx.moveTo(-radius * .66, -radius * .36);
    ctx.lineTo(0, radius * .03);
    ctx.lineTo(radius * .66, -radius * .36);
    ctx.moveTo(-radius * .82, radius * .18);
    ctx.lineTo(0, radius * .43);
    ctx.lineTo(radius * .82, radius * .18);
    ctx.stroke();
    ctx.restore();
  }

  private drawWaterRing(ctx: CanvasRenderingContext2D, point: SkillVfxPoint, radius: number, color: string, alpha: number) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, radius, radius * .38, -.12, .05, Math.PI * 1.78);
    ctx.stroke();
    ctx.restore();
  }

  private drawGroundSigil(ctx: CanvasRenderingContext2D, point: SkillVfxPoint, radius: number, time: number, alpha: number) {
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(-time / 1300);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#83fff0';
    ctx.shadowColor = '#5cf2df';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.5;
    for (let ring = 0; ring < 2; ring += 1) {
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (1 - ring * .18), radius * (.36 - ring * .06), 0, ring ? .2 : -.25, ring ? Math.PI * 1.7 : Math.PI * 1.55);
      ctx.stroke();
    }
    for (let index = 0; index < 8; index += 1) {
      const angle = index * TAU / 8;
      const x = Math.cos(angle) * radius * .78;
      const y = Math.sin(angle) * radius * .28;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * 4, y + Math.sin(angle) * 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawImpactSparks(ctx: CanvasRenderingContext2D, point: SkillVfxPoint, size: number, progress: number, color: string) {
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    for (let index = 0; index < 9; index += 1) {
      const angle = index * TAU / 9;
      const inner = size * (.14 + progress * .08);
      const outer = size * (.42 + progress * .28);
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner * .55);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer * .55);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawWaterDragon(ctx: CanvasRenderingContext2D, center: SkillVfxPoint, radius: number, time: number, alpha: number) {
    const r = Math.max(radius, 1);
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(time / 1600);
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const body = new Path2D();
    body.moveTo(-r * .58, r * .68);
    body.bezierCurveTo(-r * .92, r * .36, -r * .8, -r * .12, -r * .4, -r * .43);
    body.bezierCurveTo(-r * .04, -r * .78, r * .51, -r * .73, r * .64, -r * .34);
    body.bezierCurveTo(r * .74, -r * .04, r * .58, r * .1, r * .47, r * .04);
    ctx.shadowColor = '#128bd5';
    ctx.shadowBlur = Math.max(8, r * .15);
    ctx.strokeStyle = '#167fc2';
    ctx.lineWidth = Math.max(5, r * .2);
    ctx.beginPath();
    ctx.stroke(body);
    const bodyFill = ctx.createLinearGradient(-r * .7, r * .4, r * .5, -r * .5);
    bodyFill.addColorStop(0, '#21a9e3');
    bodyFill.addColorStop(.48, '#5cf5ff');
    bodyFill.addColorStop(1, '#eaffff');
    ctx.shadowColor = '#57eaff';
    ctx.shadowBlur = Math.max(5, r * .09);
    ctx.strokeStyle = bodyFill;
    ctx.lineWidth = Math.max(3, r * .13);
    ctx.beginPath();
    ctx.stroke(body);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#e5ffff';
    ctx.lineWidth = Math.max(1.2, r * .035);
    ctx.beginPath();
    ctx.stroke(body);

    ctx.fillStyle = '#55e8f4';
    ctx.strokeStyle = '#d9ffff';
    ctx.lineWidth = Math.max(1.2, r * .025);
    ctx.beginPath();
    ctx.moveTo(-r * .6, r * .64);
    ctx.quadraticCurveTo(-r * .82, r * .76, -r * .86, r * .94);
    ctx.quadraticCurveTo(-r * .67, r * .82, -r * .49, r * .82);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.fill();

    const head = new Path2D();
    head.moveTo(r * .42, -r * .12);
    head.quadraticCurveTo(r * .57, -r * .38, r * .77, -r * .37);
    head.lineTo(r * .91, -r * .28);
    head.quadraticCurveTo(r * .79, -r * .2, r * .9, -r * .12);
    head.quadraticCurveTo(r * .68, -r * .08, r * .47, r * .13);
    head.closePath();
    ctx.fillStyle = bodyFill;
    ctx.strokeStyle = '#d9ffff';
    ctx.lineWidth = Math.max(1.2, r * .025);
    ctx.beginPath();
    ctx.fill(head);
    ctx.stroke();

    ctx.strokeStyle = '#d9ffff';
    ctx.lineWidth = Math.max(1.5, r * .035);
    ctx.beginPath();
    ctx.moveTo(r * .55, -r * .3);
    ctx.quadraticCurveTo(r * .49, -r * .56, r * .68, -r * .48);
    ctx.moveTo(r * .68, -r * .32);
    ctx.quadraticCurveTo(r * .81, -r * .55, r * .83, -r * .35);
    ctx.stroke();
    ctx.fillStyle = '#edffff';
    ctx.beginPath();
    ctx.arc(r * .74, -r * .28, Math.max(1.4, r * .035), 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#176a9b';
    ctx.beginPath();
    ctx.arc(r * .75, -r * .28, Math.max(.7, r * .015), 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#eaffff';
    ctx.lineWidth = Math.max(1, r * .018);
    ctx.beginPath();
    ctx.quadraticCurveTo(r * .87, -r * .16, r * .99, -r * .2);
    ctx.moveTo(r * .86, -r * .16);
    ctx.quadraticCurveTo(r * .94, -r * .08, r * .98, -r * .1);
    ctx.stroke();
    for (let index = 0; index < 3; index += 1) {
      const x = r * (-.26 + index * .19);
      const y = r * (-.48 - Math.sin(index * 1.3) * .06);
      ctx.strokeStyle = '#dfffff';
      ctx.lineWidth = Math.max(1, r * .018);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + r * .07, y - r * .08, x + r * .12, y - r * .02);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawWaterRibbon(behind: CanvasRenderingContext2D, from: SkillVfxPoint, to: SkillVfxPoint, cell: number, progress: number, time: number, alpha: number) {
    const points: SkillVfxPoint[] = [];
    for (let index = 0; index <= 12; index += 1) {
      const t = index / 12;
      points.push({
        x: from.x + (to.x - from.x) * t + Math.sin(time / 150 + t * 9) * cell * .1,
        y: from.y + (to.y - from.y) * t + Math.cos(time / 140 + t * 8) * cell * .13,
      });
    }
    this.stroke(behind, points, '#34bfe8', cell * (.04 + progress * .04), alpha * .45);
    this.stroke(behind, points.slice(2, 11), '#bdffff', cell * .018, alpha);
  }

  private drawPullStreaks(ctx: CanvasRenderingContext2D, center: SkillVfxPoint, cell: number, progress: number, time: number) {
    ctx.save();
    ctx.strokeStyle = '#d3ffff';
    ctx.shadowColor = '#49eaff';
    ctx.shadowBlur = 10;
    ctx.globalAlpha = .25 + progress * .4;
    ctx.lineWidth = 1.5;
    for (let index = 0; index < 12; index += 1) {
      const angle = index * TAU / 12 + time / 650;
      const radius = cell * (1.1 + (index % 3) * .13);
      ctx.beginPath();
      ctx.moveTo(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius * .5);
      ctx.quadraticCurveTo(center.x + Math.cos(angle + .18) * radius * .52, center.y + Math.sin(angle + .18) * radius * .27, center.x + Math.cos(angle + .35) * cell * .28, center.y + Math.sin(angle + .35) * cell * .16);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBambooBurst(ctx: CanvasRenderingContext2D, point: SkillVfxPoint, cell: number, progress: number) {
    const growth = easeOut(progress);
    for (let index = 0; index < 9; index += 1) {
      const angle = index * TAU / 9;
      const distance = cell * (.18 + growth * .24);
      const x = point.x + Math.cos(angle) * distance;
      const y = point.y + Math.sin(angle) * distance * .5;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle - Math.PI / 2);
      ctx.globalAlpha = 1 - progress * .48;
      ctx.fillStyle = index % 2 ? '#78a94c' : '#c5dd83';
      ctx.strokeStyle = '#f1f0be';
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.moveTo(0, -cell * .32 * growth);
      ctx.lineTo(cell * .055, 0);
      ctx.lineTo(-cell * .055, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    for (let index = 0; index < 8; index += 1) {
      const angle = index * TAU / 8 + .2;
      this.drawDroplet(ctx, point.x + Math.cos(angle) * cell * (.2 + progress * .25), point.y + Math.sin(angle) * cell * (.12 + progress * .14), 2 + index % 3, '#b8d990');
    }
  }

  private drawKneelLines(ctx: CanvasRenderingContext2D, point: SkillVfxPoint, cell: number, progress: number) {
    ctx.save();
    ctx.globalAlpha = .25 + progress * .45;
    ctx.strokeStyle = '#e5d19c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(point.x - cell * .18, point.y + cell * .16);
    ctx.quadraticCurveTo(point.x, point.y + cell * (.22 + progress * .08), point.x + cell * .18, point.y + cell * .16);
    ctx.stroke();
    ctx.restore();
  }

  private drawDroplet(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = radius * 2.3;
    ctx.beginPath();
    ctx.moveTo(x, y - radius * 1.45);
    ctx.bezierCurveTo(x + radius * 1.35, y - radius * .1, x + radius * .82, y + radius, x, y + radius);
    ctx.bezierCurveTo(x - radius * .82, y + radius, x - radius * 1.35, y - radius * .1, x, y - radius * 1.45);
    ctx.fill();
    ctx.restore();
  }

  private quadratic(a: SkillVfxPoint, control: SkillVfxPoint, b: SkillVfxPoint, t: number): SkillVfxPoint {
    const inverse = 1 - t;
    return { x: inverse * inverse * a.x + 2 * inverse * t * control.x + t * t * b.x, y: inverse * inverse * a.y + 2 * inverse * t * control.y + t * t * b.y };
  }

  private stroke(context: CanvasRenderingContext2D, points: SkillVfxPoint[], color: string, width: number, alpha: number) {
    if (points.length < 2) return;
    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.shadowColor = color;
    context.shadowBlur = Math.max(4, width * 1.8);
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length - 1; index += 1) {
      const midX = (points[index].x + points[index + 1].x) / 2;
      const midY = (points[index].y + points[index + 1].y) / 2;
      context.quadraticCurveTo(points[index].x, points[index].y, midX, midY);
    }
    const last = points[points.length - 1];
    context.lineTo(last.x, last.y);
    context.stroke();
    context.restore();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver.disconnect();
    this.canvases.forEach(canvas => canvas.remove());
    this.effect = null;
    this.timeline = null;
  }
}
