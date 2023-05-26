import React, { useCallback, useEffect, useRef } from "react";

import { Canvas, CanvasLoop } from "../Canvas";

import {
  ConfettiParticle,
  createConfettiParticle,
  drawParticle,
} from "./particleAnimation";
import {
  Vector2,
  drawBezierCurve,
  drawCircle,
  getBezierCoordinates,
  getRandomCurveOnCircle,
  lerp,
  lerpVector2,
  setRandomGenerator,
  vector2,
} from "./animationUtils";

const ANIMATION_LENGTH = 1; // in seconds
const PARTICLE_SIZE = 16;
const PARTICLE_DENSITY = 0.0002;

export interface ConfettiAnimationProps {
  className?: string;
  isLooping?: boolean;
  dataTestId?: string;
}

export enum Stage {
  LERP_LINE,
  QUADRATIC_BEZIER_LINES,
  QUADRATIC_BEZIER_LERPS_1,
  QUADRATIC_BEZIER_LERPS_2,
  QUADRATIC_BEZIER_CURVE,
  QUADRATIC_BEZIER_NO_LINES,

  CUBIC_BEZIER_DOTS,
  CUBIC_BEZIER_LINES,
  CUBIC_BEZIER_LERPS_1,
  CUBIC_BEZIER_LERPS_2,
  CUBIC_BEZIER_LERPS_3,
  CUBIC_BEZIER_CURVE,
  CUBIC_BEZIER_CURVE_NO_LINES,

  CIRCLE,
  RANDOM_POINTS_ON_CIRCLE_LINE,
  RANDOM_POINTS_ON_CIRCLE_ROTATED,
  RANDOM_POINTS_ON_CIRCLE_ROTATED_MANY,
  RANDOM_POINTS_ON_CIRCLE_NORMALIZED,
  RANDOM_CURVES_ON_CIRCLE_DOTS,
  RANDOM_CURVES_ON_CIRCLE,
  MOVE_ALONG_CURVE,

  DRAW_PARTICLES,
  DRAW_SHAPES,
  DRAW_COLORS,
  MOVEMENT_SPEED_FUNCTION,
  OPACITY_FUNCTION,
  TIMING_OFFSET,
  ROTATION,
  SIZE_WOBBLE,
  FULL_ANIMATION,
}

let stage = Stage.LERP_LINE;

let pointA: Vector2 = { x: -450, y: 100 };
let pointB: Vector2 = { x: 500, y: -100 };
let pointC: Vector2 = { x: -100, y: -400 };
let pointD: Vector2 = { x: 100, y: 400 };
let t = 0;

let dragged: Vector2 = null;

function pointInRadius(
  x: number,
  y: number,
  pX: number,
  pY: number,
  r: number
) {
  return (pX - x) ** 2 + (pY - y) ** 2 < r ** 2;
}

let timeSpeed = 0.01;
let paused = true;

const slider = document.createElement("input");
slider.type = "range";
document.body.appendChild(slider);
slider.min = "0";
slider.max = "1";
slider.step = "0.001";
slider.value = t.toString();
slider.oninput = () => {
  paused = true;
  t = parseFloat(slider.value);
};

function setTime(newT: number) {
  t = newT;
  slider.value = newT.toString();
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

  const isLoopingRef = useRef(isLooping);

  const initAnimation: CanvasLoop = useCallback(() => {
    const CIRCLE_RADIUS = 500;
    const PARTICLE_COUNT = PARTICLE_DENSITY * Math.PI * CIRCLE_RADIUS ** 2;
    canvasState.current.particles.length = 0;
    const randomSeeded = mulberry32(1332 ^ 0xdeadbeef);

    setRandomGenerator(randomSeeded);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = createConfettiParticle(stage);
      canvasState.current.particles.push(particle);
    }
  }, []);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        stage++;
        setTime(0);
        initAnimation({} as any);
      } else if (e.key === "ArrowLeft") {
        stage--;
        setTime(0);
        initAnimation({} as any);
      } else if (e.key === "ArrowUp") {
        timeSpeed += 0.001;
      } else if (e.key === "ArrowDown") {
        timeSpeed -= 0.001;
      } else if (e.key === " ") {
        paused = !paused;
      }
    };
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keyup", handleKeyUp);
    };
  });

  const loopAnimation: CanvasLoop = useCallback(
    ({ canvas, ctx, deltaTime, mouse }) => {
      const CIRCLE_RADIUS = 500;

      ctx.save();
      ctx.translate(canvas.width * 0.5, canvas.height * 0.5);

      ctx.clearRect(
        -canvas.width * 0.5,
        -canvas.height * 0.5,
        canvas.width,
        canvas.height
      );

      if (
        stage >= Stage.LERP_LINE &&
        stage <= Stage.CUBIC_BEZIER_CURVE_NO_LINES
      ) {
        drawCircle(ctx, pointA, 10, "green");
        drawCircle(ctx, pointB, 10, "green");

        if (mouse.left.wentDown) {
          if (pointInRadius(mouse.x, mouse.y, pointA.x, pointA.y, 10)) {
            dragged = pointA;
          }
          if (pointInRadius(mouse.x, mouse.y, pointB.x, pointB.y, 10)) {
            dragged = pointB;
          }
          if (pointInRadius(mouse.x, mouse.y, pointC.x, pointC.y, 10)) {
            dragged = pointC;
          }
          if (pointInRadius(mouse.x, mouse.y, pointD.x, pointD.y, 10)) {
            dragged = pointD;
          }
        }

        if (dragged) {
          dragged.x = mouse.x;
          dragged.y = mouse.y;
        }

        if (mouse.left.wentUp) {
          dragged = null;
        }

        ctx.lineWidth = 4;
        ctx.strokeStyle = "green";

        if (stage === Stage.LERP_LINE) {
          const end = lerpVector2(pointA, pointB, t);
          ctx.beginPath();
          ctx.moveTo(pointA.x, pointA.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }

        if (stage >= Stage.QUADRATIC_BEZIER_LINES) {
          drawCircle(ctx, pointC, 10, "green");
        }

        if (
          stage >= Stage.QUADRATIC_BEZIER_LINES &&
          stage <= Stage.QUADRATIC_BEZIER_CURVE
        ) {
          ctx.beginPath();
          ctx.moveTo(pointA.x, pointA.y);
          ctx.lineTo(pointC.x, pointC.y);
          ctx.lineTo(pointB.x, pointB.y);
          ctx.stroke();
        }

        const ac = lerpVector2(pointA, pointC, t);
        const cb = lerpVector2(pointC, pointB, t);

        if (
          stage >= Stage.QUADRATIC_BEZIER_LERPS_1 &&
          stage <= Stage.QUADRATIC_BEZIER_CURVE
        ) {
          drawCircle(ctx, ac, 10, "orange");
          drawCircle(ctx, cb, 10, "orange");
        }

        if (
          stage >= Stage.QUADRATIC_BEZIER_LERPS_2 &&
          stage <= Stage.QUADRATIC_BEZIER_CURVE
        ) {
          ctx.save();
          ctx.strokeStyle = "orange";
          ctx.beginPath();
          ctx.moveTo(ac.x, ac.y);
          ctx.lineTo(cb.x, cb.y);
          ctx.stroke();

          const acb = lerpVector2(ac, cb, t);
          drawCircle(ctx, acb, 10, "red");

          ctx.restore();
        }

        if (
          stage >= Stage.QUADRATIC_BEZIER_CURVE &&
          stage <= Stage.QUADRATIC_BEZIER_NO_LINES
        ) {
          ctx.save();
          ctx.beginPath();

          ctx.strokeStyle = "red";
          ctx.moveTo(pointA.x, pointA.y);
          for (let i = 0; i < t; i += timeSpeed) {
            const ac = lerpVector2(pointA, pointC, i);
            const bc = lerpVector2(pointC, pointB, i);
            const p = lerpVector2(ac, bc, i);
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          ctx.restore();
        }

        if (stage >= Stage.CUBIC_BEZIER_DOTS) {
          drawCircle(ctx, pointD, 10, "green");
        }

        if (
          stage >= Stage.CUBIC_BEZIER_LINES &&
          stage <= Stage.CUBIC_BEZIER_CURVE
        ) {
          ctx.beginPath();
          ctx.moveTo(pointA.x, pointA.y);
          ctx.lineTo(pointC.x, pointC.y);
          ctx.lineTo(pointD.x, pointD.y);
          ctx.lineTo(pointB.x, pointB.y);
          ctx.stroke();
        }

        const cd = lerpVector2(pointC, pointD, t);
        const db = lerpVector2(pointD, pointB, t);

        if (
          stage >= Stage.CUBIC_BEZIER_LERPS_1 &&
          stage <= Stage.CUBIC_BEZIER_CURVE
        ) {
          drawCircle(ctx, ac, 10, "orange");
          drawCircle(ctx, cd, 10, "orange");
          drawCircle(ctx, db, 10, "orange");
        }

        const acd = lerpVector2(ac, cd, t);
        const cdb = lerpVector2(cd, db, t);

        if (
          stage >= Stage.CUBIC_BEZIER_LERPS_2 &&
          stage <= Stage.CUBIC_BEZIER_CURVE
        ) {
          ctx.save();
          ctx.strokeStyle = "orange";
          ctx.beginPath();
          ctx.moveTo(ac.x, ac.y);
          ctx.lineTo(cd.x, cd.y);
          ctx.lineTo(db.x, db.y);
          ctx.stroke();

          drawCircle(ctx, acd, 10, "red");
          drawCircle(ctx, cdb, 10, "red");

          ctx.restore();
        }

        if (
          stage >= Stage.CUBIC_BEZIER_LERPS_3 &&
          stage <= Stage.CUBIC_BEZIER_CURVE
        ) {
          ctx.save();
          ctx.strokeStyle = "red";
          ctx.beginPath();
          ctx.moveTo(acd.x, acd.y);
          ctx.lineTo(cdb.x, cdb.y);
          ctx.stroke();

          const acdb = lerpVector2(acd, cdb, t);
          drawCircle(ctx, acdb, 10, "cyan");

          ctx.restore();
        }

        if (
          stage >= Stage.CUBIC_BEZIER_CURVE &&
          stage <= Stage.CUBIC_BEZIER_CURVE_NO_LINES
        ) {
          ctx.save();

          ctx.beginPath();
          ctx.strokeStyle = "cyan";
          ctx.moveTo(pointA.x, pointA.y);
          for (let i = 0; i < t; i += timeSpeed) {
            const p = getBezierCoordinates(
              { a: pointA, b: pointC, c: pointD, d: pointB },
              i
            );
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();

          ctx.restore();
        }

        if (t > 1) {
          t = 0;
        }
        if (t < 0) {
          t = 1;
        }
        if (!paused) setTime(t + timeSpeed);
      }

      if (stage >= Stage.CIRCLE && stage < Stage.DRAW_PARTICLES) {
        if (stage >= Stage.CIRCLE && stage < Stage.FULL_ANIMATION) {
          ctx.save();
          ctx.strokeStyle = "white";
          ctx.beginPath();
          ctx.arc(0, 0, CIRCLE_RADIUS, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        const randomSeeded = mulberry32(1332 ^ 0xdeadbeef);

        if (
          stage >= Stage.RANDOM_POINTS_ON_CIRCLE_LINE &&
          stage <= Stage.RANDOM_POINTS_ON_CIRCLE_ROTATED
        ) {
          const randomAngles = [];
          for (let i = 0; i < 100; i++) {
            randomAngles.push(randomSeeded() * Math.PI * 2);
          }

          for (let i = 0; i < 100; i++) {
            const p = vector2(randomSeeded() * CIRCLE_RADIUS, 0);
            if (stage >= Stage.RANDOM_POINTS_ON_CIRCLE_ROTATED) {
              const rotatedP = vector2(
                p.x * Math.cos(randomAngles[i] * t),
                p.x * Math.sin(randomAngles[i] * t)
              );
              drawCircle(ctx, rotatedP, 3, "green");
            } else {
              drawCircle(ctx, p, 3, "green");
            }
          }
        }

        if (
          stage >= Stage.RANDOM_POINTS_ON_CIRCLE_ROTATED_MANY &&
          stage <= Stage.RANDOM_POINTS_ON_CIRCLE_NORMALIZED
        ) {
          const randomAngles = [];
          for (let i = 0; i < 4000; i++) {
            randomAngles.push(randomSeeded() * Math.PI * 2);
          }

          for (let i = 0; i < 4000; i++) {
            let offset = randomSeeded();
            if (stage >= Stage.RANDOM_POINTS_ON_CIRCLE_NORMALIZED) {
              offset = lerp(offset, Math.sqrt(offset), t);
            }
            const p = vector2(offset * CIRCLE_RADIUS, 0);
            const rotatedP = vector2(
              p.x * Math.cos(randomAngles[i]),
              p.x * Math.sin(randomAngles[i])
            );
            drawCircle(ctx, rotatedP, 3, "green");
          }
        }

        if (
          stage >= Stage.RANDOM_CURVES_ON_CIRCLE_DOTS &&
          stage <= Stage.MOVE_ALONG_CURVE
        ) {
          setRandomGenerator(randomSeeded);

          for (let i = 0; i < 20; i++) {
            const curve = getRandomCurveOnCircle(vector2(0, 0), CIRCLE_RADIUS);
            drawCircle(ctx, curve.d, 3, "green");

            if (stage >= Stage.RANDOM_CURVES_ON_CIRCLE) {
              drawBezierCurve(ctx, curve);
            }

            if (stage >= Stage.MOVE_ALONG_CURVE) {
              const p = getBezierCoordinates(curve, t);
              drawCircle(ctx, p, 10, "orange");
            }
          }
        }

        if (t > 1) {
          t = 0;
        }
        if (t < 0) {
          t = 1;
        }
        if (!paused) setTime(t + timeSpeed);
      }

      if (stage >= Stage.DRAW_PARTICLES) {
        if (stage >= Stage.CIRCLE && stage < Stage.FULL_ANIMATION) {
          ctx.save();
          ctx.strokeStyle = "white";
          ctx.beginPath();
          ctx.arc(0, 0, CIRCLE_RADIUS, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        canvasState.current.particles.forEach((particle) => {
          drawParticle(ctx, particle, t, CIRCLE_RADIUS, PARTICLE_SIZE, stage);
          ctx.save();
          ctx.scale(CIRCLE_RADIUS, CIRCLE_RADIUS);
          ctx.restore();
        });

        if (t > 1.2) {
          // if (t > 2) {
          t = 0;
        }
        if (t < 0) {
          t = 1;
        }
        if (!paused) setTime(t + timeSpeed);
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

function mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
