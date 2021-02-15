import { ShaderArtPlugin } from '@shader-art/plugin-base';

function clamp(x: number, minVal: number, maxVal: number) {
  const { min, max } = Math;
  return min(max(x, minVal), maxVal);
}

export type PointerEventSubscriber = (
  x: number,
  y: number,
  dragging: boolean
) => void;
export class PointerInteractionsPlugin implements ShaderArtPlugin {
  name = 'PointerInteractionsPlugin';
  initialized = false;

  hostElement: HTMLElement | null = null;
  gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  program: WebGLProgram | null = null;
  canvas: HTMLCanvasElement | null = null;

  startX = NaN;
  startY = NaN;
  dragging = false;
  pointerId = NaN;
  subscribers: PointerEventSubscriber[] = [];

  public setup(
    hostElement: HTMLElement,
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram,
    canvas: HTMLCanvasElement
  ): void {
    if (!hostElement) {
      throw new Error('host element not found.');
    }
    this.hostElement = hostElement;
    this.gl = gl;
    this.program = program;
    this.canvas = canvas;
    hostElement.addEventListener('pointerup', this.onPointerUp);
    hostElement.addEventListener('pointerdown', this.onPointerDown);
    hostElement.addEventListener('pointermove', this.onPointerMove);
  }

  subscribe(func: PointerEventSubscriber): PointerInteractionsPlugin {
    this.subscribers.push(func);
    return this;
  }

  onPointerUp = (e: PointerEvent): void => {
    if (!this.hostElement) {
      return;
    }
    if (e.pointerId !== this.pointerId) {
      return;
    }
    this.hostElement.releasePointerCapture(e.pointerId);
    this.pointerId = NaN;
    this.dragging = false;
    this.setUniformInt('dragging', 0);
    this.notifySubscribers(e.clientX, e.clientY, false);
  };

  onPointerDown = (e: PointerEvent): void => {
    const { hostElement } = this;
    if (!hostElement) {
      return;
    }
    if (!Number.isNaN(this.pointerId)) {
      return;
    }
    this.dragging = true;
    this.pointerId = e.pointerId;
    this.startX = e.clientX / hostElement.clientWidth;
    this.startY = e.clientY / hostElement.clientHeight;

    hostElement.setPointerCapture(e.pointerId);
    this.setUniformVec2('pointerStart', this.startX, this.startY);
    this.setUniformVec2('pointer', this.startX, this.startY);
    this.notifySubscribers(this.startX, this.startY, this.dragging);
  };

  onPointerMove = (e: PointerEvent): void => {
    const { hostElement } = this;
    if (!hostElement) {
      return;
    }
    if (e.pointerId !== this.pointerId) {
      return;
    }
    const x = clamp(e.clientX / hostElement.clientWidth, 0, 1);
    const y = clamp(e.clientY / hostElement.clientHeight, 0, 1);
    this.setUniformVec2('pointer', x, y);
    this.notifySubscribers(x, y, this.dragging);
  };

  private notifySubscribers(x: number, y: number, dragging: boolean): void {
    for (const subscriber of this.subscribers) {
      if (typeof subscriber === 'function') {
        subscriber(x, y, dragging);
      }
    }
  }

  public dispose(): void {
    if (!this.gl) {
      return;
    }
    this.gl = null;
    this.hostElement = null;
    this.canvas = null;
    this.program = null;
  }

  private setUniformVec2(variableName: string, x: number, y: number): void {
    const { gl, program } = this;
    if (gl && program) {
      const loc = gl.getUniformLocation(program, variableName);
      gl.uniform2fv(loc, [x, y]);
    }
  }

  private setUniformInt(variableName: string, i: number): void {
    const { gl, program } = this;
    if (gl && program) {
      const uVar = gl.getUniformLocation(program, variableName);
      gl.uniform1i(uVar, i);
    }
  }
}

export const PointerInteractionsPluginFactory = () =>
  new PointerInteractionsPlugin();
