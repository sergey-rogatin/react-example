import React, { useEffect, useRef } from 'react';

export type CanvasLoop = (params: {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  deltaTime: number; // time per frame in seconds
}) => void;

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
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) {
      return undefined;
    }

    let prevTime = performance.now();

    const loopWrapper = () => {
      const curTime = performance.now();
      const deltaTime = (curTime - prevTime) / 1000;
      prevTime = curTime;
      onLoop({ canvas, ctx, deltaTime });
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
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      onInit?.({ canvas, ctx, deltaTime: 0 });
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(canvas);
    return () => {
      observer.unobserve(canvas);
    };
  }, [onInit]);

  return <canvas data-testid={dataTestId} className={className} ref={ref} />;
};
