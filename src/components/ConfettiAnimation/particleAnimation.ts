import {
  BezierCurve,
  getBezierCoordinates,
  getRandomCurveOnCircle,
  getRandomFloat,
  getRandomItem,
  vector2,
} from "./animationUtils";

export enum ConfettiParticleType {
  TRIANGLE,
  RECTANGLE,
  CIRCLE,
}

export interface ConfettiParticle {
  type: ConfettiParticleType;
  curve: BezierCurve;
  color: string;
  progressOffset: number;
  rotationSpeed: number;
  scaleX: number;
  scaleY: number;
  wobbleX: number;
  wobbleY: number;
}

export function createConfettiParticle() {
  const CYAN = "rgb(124,224,195)";
  const RED = "rgb(232,59,99)";
  const PINK = "rgb(169,46,245)";
  const YELLOW = "rgb(243,222,79)";
  const BLUE = "rgb(90,179,249)";

  const color = getRandomItem([CYAN, RED, PINK, YELLOW, BLUE]);
  const curve = getRandomCurveOnCircle(vector2(0, 0), 1);
  const rotationSpeed = getRandomFloat(-Math.PI * 8, Math.PI * 8);
  const scaleX = 1 + getRandomFloat(-0.5, 0.5);
  const scaleY = 1 + getRandomFloat(-0.5, 0.5);
  const wobbleX = getRandomFloat(0.1, 0.5);
  const wobbleY = getRandomFloat(0.1, 0.5);
  const type = getRandomItem([
    ConfettiParticleType.CIRCLE,
    ConfettiParticleType.RECTANGLE,
    ConfettiParticleType.TRIANGLE,
  ]);

  const particle: ConfettiParticle = {
    type,
    progressOffset: getRandomFloat(-0.3, 0),
    color,
    rotationSpeed,
    scaleX,
    scaleY,
    curve,
    wobbleX,
    wobbleY,
  };

  return particle;
}

export function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: ConfettiParticle,
  externalProgress: number,
  circleRadius: number,
  particleSize: number
) {
  const progress = externalProgress + particle.progressOffset;
  if (progress < 0) {
    return;
  }

  const opacityFactor = Math.max(0, 1 - (progress * 2.5 - 1) ** 4);
  const bezierFactor = (progress / (progress + 0.1)) * 1.1;
  const { x, y } = getBezierCoordinates(particle.curve, bezierFactor);

  ctx.save();

  ctx.globalAlpha = opacityFactor;
  ctx.fillStyle = particle.color;
  ctx.translate(x * circleRadius, y * circleRadius);
  ctx.rotate(progress * particle.rotationSpeed);
  ctx.scale(
    particleSize *
      (particle.scaleX + particle.wobbleX * Math.cos(progress * 10)),
    particleSize *
      (particle.scaleY + particle.wobbleY * Math.sin(progress * 10))
  );

  switch (particle.type) {
    case ConfettiParticleType.TRIANGLE:
      ctx.beginPath();
      ctx.moveTo(-0.5, 0.5);
      ctx.lineTo(0, -0.5);
      ctx.lineTo(0.5, 0.5);
      ctx.fill();
      break;

    case ConfettiParticleType.RECTANGLE:
      ctx.fillRect(-0.5, -0.5, 1, 1);
      break;

    case ConfettiParticleType.CIRCLE:
      ctx.beginPath();
      ctx.arc(0, 0, 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;

    default:
  }

  ctx.restore();
}
