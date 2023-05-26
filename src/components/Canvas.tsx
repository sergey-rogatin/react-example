import React, { useEffect, useRef } from "react";

export type CanvasLoop = (params: {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  deltaTime: number; // time per frame in seconds
  mouse: Mouse;
}) => void;

interface Button {
  isDown: boolean;
  wentDown: boolean;
  wentUp: boolean;
}

interface Mouse {
  x: number;
  y: number;
  left: Button;
  right: Button;
}

function createButton(): Button {
  return { isDown: false, wentDown: false, wentUp: false };
}

export interface CanvasProps {
  onLoop: CanvasLoop;
  onInit?: CanvasLoop;
  className?: string;
  dataTestId?: string;
}

export const Canvas = ({
  onLoop,
  onInit,
  className,
  dataTestId,
}: CanvasProps) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef<Mouse>({
    x: 0,
    y: 0,
    left: createButton(),
    right: createButton(),
  });

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) {
      return undefined;
    }

    let prevTime = performance.now();

    const loopWrapper = () => {
      const curTime = performance.now();
      const deltaTime = (curTime - prevTime) / 1000;
      prevTime = curTime;
      onLoop({ canvas, ctx, deltaTime, mouse: mouse.current });

      mouse.current.left.wentUp = false;
      mouse.current.left.wentDown = false;
      requestAnimationFrame(loopWrapper);
    };
    const request = requestAnimationFrame(loopWrapper);

    return () => {
      cancelAnimationFrame(request);
    };
  }, [onLoop]);

  useEffect(() => {
    if (!ref.current) {
      return undefined;
    }
    const canvas = ref.current;

    const handleResize = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      onInit?.({ canvas, ctx, deltaTime: 0, mouse: mouse.current });
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(canvas);
    return () => {
      observer.unobserve(canvas);
    };
  }, [onInit]);

  useEffect(() => {
    if (!ref.current) {
      return undefined;
    }
    const canvas = ref.current;
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x =
        (e.clientX - canvas.getBoundingClientRect().left) * devicePixelRatio -
        canvas.width * 0.5;
      mouse.current.y =
        (e.clientY - canvas.getBoundingClientRect().top) * devicePixelRatio -
        canvas.height * 0.5;
    };

    const handleMouseDown = (e: MouseEvent) => {
      mouse.current.left.wentDown = true;
      mouse.current.left.isDown = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      mouse.current.left.wentUp = true;
      mouse.current.left.isDown = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return <canvas data-testid={dataTestId} className={className} ref={ref} />;
};
