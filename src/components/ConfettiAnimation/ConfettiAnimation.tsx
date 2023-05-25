import React, { useCallback, useRef } from "react";

import { Canvas, CanvasLoop } from "../Canvas";

import {
  ConfettiParticle,
  createConfettiParticle,
  drawParticle,
} from "./particleAnimation";
import { drawBezierCurve } from "./animationUtils";

const ANIMATION_LENGTH = 1; // in seconds
const PARTICLE_SIZE = 16;
const PARTICLE_DENSITY = 0.0002;

export interface ConfettiAnimationProps {
  className?: string;
  isLooping?: boolean;
  dataTestId?: string;
}

enum Stage {
  QUADRATIC_BEZIER,
  CUBIC_BEZIER,
  RANDOM_POINTS_ON_CIRCLE,
  RANDOM_POINTS_ON_CIRCLE_NORMALIZED,
  RANDOM_CURVES_ON_CIRCLE,
  MOVE_ALONG_CURVE,
  DRAW_RECTANGLE,
  DRAW_COLORS,
  MOVEMENT_SPEED_FUNCTION,
  OPACITY_FUNCTION,
  ROTATION,
  SIZE_WOBBLE,
}

export const ConfettiAnimation = ({
  className,
  isLooping,
  dataTestId,
}: ConfettiAnimationProps) => {
  const canvasState = useRef({
    particles: [] as ConfettiParticle[],
    t: 0,
  });

  const initAnimation: CanvasLoop = useCallback(({ canvas }) => {
    const CIRCLE_RADIUS = canvas.width * 0.5;
    const PARTICLE_COUNT = PARTICLE_DENSITY * Math.PI * CIRCLE_RADIUS ** 2;
    canvasState.current.particles.length = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = createConfettiParticle();
      canvasState.current.particles.push(particle);
    }
  }, []);

  const isLoopingRef = useRef(isLooping);

  const loopAnimation: CanvasLoop = useCallback(
    ({ canvas, ctx, deltaTime }) => {
      const CIRCLE_RADIUS = canvas.width * 0.5;

      ctx.save();
      ctx.translate(canvas.width * 0.5, canvas.height * 0.5);

      ctx.clearRect(
        -canvas.width * 0.5,
        -canvas.height * 0.5,
        canvas.width,
        canvas.height
      );

      canvasState.current.particles.forEach((particle) => {
        drawParticle(
          ctx,
          particle,
          canvasState.current.t,
          CIRCLE_RADIUS,
          PARTICLE_SIZE
        );
        ctx.save();
        ctx.scale(CIRCLE_RADIUS, CIRCLE_RADIUS);
        // drawBezierCurve(ctx, particle.curve);
        ctx.restore();
      });
      canvasState.current.t += deltaTime * ANIMATION_LENGTH;
      if (isLoopingRef.current && canvasState.current.t >= 1.2) {
        canvasState.current.t = 0;
      }

      ctx.restore();
    },
    [isLoopingRef]
  );

  return (
    <Canvas
      onLoop={loopAnimation}
      onInit={initAnimation}
      className={className}
      dataTestId={dataTestId}
    />
  );
};
