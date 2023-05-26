export interface Vector2 {
  x: number;
  y: number;
}

export interface BezierCurve {
  a: Vector2;
  b: Vector2;
  c: Vector2;
  d: Vector2;
}

let random = Math.random;

export function setRandomGenerator(generator: () => number) {
  random = generator;
}

export function getRandomFloat(min: number, max: number) {
  return random() * (max - min) + min;
}

export const getRandomInt = (min: number, max: number) => {
  const result = min + Math.floor(random() * (max + 1));
  return result;
};

export function getRandomItem<T>(arr: T[]) {
  const index = getRandomInt(0, arr.length - 1);
  return arr[index];
}

export function vector2(x: number, y: number): Vector2 {
  return { x, y };
}

export function getRandomPointOnCircle(
  center: Vector2,
  radius: number,
  arcStart: number,
  arcEnd: number
) {
  const angle = getRandomFloat(arcStart, arcEnd);
  const lengthRatio = getRandomFloat(0, 1);
  const length = Math.sqrt(lengthRatio) * radius;
  return vector2(
    center.x + length * Math.cos(angle),
    center.y + length * Math.sin(angle)
  );
}

export function lerp(a: number, b: number, t: number) {
  return a * (1 - t) + b * t;
}

export function lerpVector2(a: Vector2, b: Vector2, t: number) {
  return vector2(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
}

export function getAngleBetweenVectors(a: Vector2, b: Vector2) {
  const dot = a.x * b.x + a.y * b.y;
  const cross = a.x * b.y + a.y * b.x;
  return Math.atan2(cross, dot);
}

export function getBezierCoordinates(curve: BezierCurve, t: number) {
  const ab = lerpVector2(curve.a, curve.b, t);
  const bc = lerpVector2(curve.b, curve.c, t);
  const cd = lerpVector2(curve.c, curve.d, t);
  const abc = lerpVector2(ab, bc, t);
  const bcd = lerpVector2(bc, cd, t);
  const abcd = lerpVector2(abc, bcd, t);

  return abcd;
}

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  center: Vector2,
  radius: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function getRandomCurveOnCircle(center: Vector2, radius: number) {
  const start = center;
  const end = getRandomPointOnCircle(center, radius, 0, Math.PI * 2);
  const angle = getAngleBetweenVectors(end, vector2(1, 0)) + Math.PI;
  const ANGLE_DIFF = Math.PI / 2;

  const startControl = start;
  const endControl = getRandomPointOnCircle(
    end,
    radius * 0.7,
    angle - ANGLE_DIFF,
    angle + ANGLE_DIFF
  );

  const curve: BezierCurve = {
    a: start,
    b: startControl,
    c: endControl,
    d: end,
  };
  return curve;
}

export function drawBezierCurve(
  ctx: CanvasRenderingContext2D,
  { a: p0, b: c0, c: c1, d: p1 }: BezierCurve
) {
  ctx.strokeStyle = "green";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.bezierCurveTo(c0.x, c0.y, c1.x, c1.y, p1.x, p1.y);
  ctx.stroke();
}
