import { Stage } from "./ConfettiAnimation";
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

export function createConfettiParticle(stage: Stage) {
  const CYAN = "rgb(124,224,195)";
  const RED = "rgb(232,59,99)";
  const PINK = "rgb(169,46,245)";
  const YELLOW = "rgb(243,222,79)";
  const BLUE = "rgb(90,179,249)";

  let color = "orange"; // getRandomItem([CYAN, RED, PINK, YELLOW, BLUE]);
  let curve = getRandomCurveOnCircle(vector2(0, 0), 1);
  let rotationSpeed = 0; // getRandomFloat(-Math.PI * 8, Math.PI * 8);
  let scaleX = 1; // 1 + getRandomFloat(-0.5, 0.5);
  let scaleY = 1; // + getRandomFloat(-0.5, 0.5);
  let wobbleX = 0; // getRandomFloat(0.1, 0.5);
  let wobbleY = 0; // getRandomFloat(0.1, 0.5);
  let type = ConfettiParticleType.CIRCLE;
  //getRandomItem([ConfettiParticleType.CIRCLE,ConfettiParticleType.RECTANGLE,ConfettiParticleType.TRIANGLE,]);
  let progressOffset = 0; //getRandomFloat(-0.3, 0);

  if (stage >= Stage.DRAW_SHAPES) {
    type = getRandomItem([
      ConfettiParticleType.CIRCLE,
      ConfettiParticleType.RECTANGLE,
      ConfettiParticleType.TRIANGLE,
    ]);
  }
  if (stage >= Stage.DRAW_COLORS) {
    color = getRandomItem([CYAN, RED, PINK, YELLOW, BLUE]);
  }
  if (stage >= Stage.TIMING_OFFSET) {
    progressOffset = getRandomFloat(-0.3, 0);
  }
  if (stage >= Stage.ROTATION) {
    rotationSpeed = getRandomFloat(-Math.PI * 8, Math.PI * 8);
  }
  if (stage >= Stage.SIZE_WOBBLE) {
    scaleX = 1 + getRandomFloat(-0.5, 0.5);
    scaleY = 1 + getRandomFloat(-0.5, 0.5);
    wobbleX = getRandomFloat(0.1, 0.5);
    wobbleY = getRandomFloat(0.1, 0.5);
  }

  const particle: ConfettiParticle = {
    type,
    progressOffset,
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

let gravitySpeed = 0;
let bigG = 0.9;
const floor = 1;

export function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: ConfettiParticle,
  externalProgress: number,
  circleRadius: number,
  particleSize: number,
  stage: Stage
) {
  const progress = externalProgress + particle.progressOffset;
  if (progress < 0) {
    return;
  }

  let opacityFactor = 1; // Math.max(0, 1 - (progress * 2.5 - 1) ** 4);
  let bezierFactor = progress; // (progress / (progress + 0.1)) * 1.1;
  if (stage < Stage.MOVEMENT_SPEED_FUNCTION) {
    bezierFactor = Math.min(progress, 1);
  }
  if (stage >= Stage.MOVEMENT_SPEED_FUNCTION) {
    bezierFactor = (progress / (progress + 0.1)) * 1.1;
  }
  if (stage >= Stage.OPACITY_FUNCTION) {
    opacityFactor = Math.max(0, 1 - (progress * 2.5 - 1) ** 4);
    // opacityFactor = Math.max(0, 10 - (progress * 2.5 - 1) ** 4);
  }

  let { x, y } = getBezierCoordinates(particle.curve, bezierFactor);
  // y += gravitySpeed;
  // gravitySpeed = bigG * progress ** 2;

  // if (y > floor) {
  //   y = floor;
  // }

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
