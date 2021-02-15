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

  start: [number, number] = [NaN, NaN];
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
    const [x, y] = this.getRelativePosition(e);
    this.setUniformInt('dragging', 0);
    this.notifySubscribers(x, y, false);
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
    this.start = this.getRelativePosition(e);

    hostElement.setPointerCapture(e.pointerId);
    this.setUniformVec2('pointerStart', this.start);
    this.setUniformVec2('pointer', this.start);
    this.notifySubscribers(this.start[0], this.start[1], this.dragging);
  };

  /**
   * Get pointer position relative to the element.
   * @param e pointer event containing clientX/clientY
   * @returns array containing x and y from (0..1)
   */
  private getRelativePosition(e: PointerEvent): [number, number] {
    const { hostElement } = this;
    if (!hostElement) {
      return [0, 0];
    }
    const rect = hostElement.getBoundingClientRect();
    const x = clamp((e.clientX - rect.top) / hostElement.clientWidth, 0, 1);
    const y = clamp((e.clientY - rect.left) / hostElement.clientHeight, 0, 1);
    return [x, y];
  }

  onPointerMove = (e: PointerEvent): void => {
    const { hostElement } = this;
    if (!hostElement) {
      return;
    }
    if (e.pointerId !== this.pointerId) {
      return;
    }
    const p = this.getRelativePosition(e);
    this.setUniformVec2('pointer', p);
    this.notifySubscribers(p[0], p[1], this.dragging);
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

  private setUniformVec2(variableName: string, vec2: [number, number]): void {
    const { gl, program } = this;
    if (gl && program) {
      const loc = gl.getUniformLocation(program, variableName);
      gl.uniform2fv(loc, vec2);
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

export const PointerInteractionsPluginFactory = (): PointerInteractionsPlugin =>
  new PointerInteractionsPlugin();
