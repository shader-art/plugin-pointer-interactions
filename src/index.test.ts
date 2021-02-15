import { PointerInteractionsPlugin } from './index';
import { ShaderArtShim } from './test-utils/shader-art-shim';

function wait(timeout = 0): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
}

describe('Pointer interactions test', () => {
  // const subscriber = jest.fn();

  beforeAll(async () => {
    if (!('PointerEvent' in window)) {
      // @ts-ignore ts2306 not a module, fuck you typescript
      await import('@wessberg/pointer-events');
    }
    ShaderArtShim.register([() => new PointerInteractionsPlugin()]);
  });

  beforeEach(() => {
    const art = document.createElement('shader-art');
    art.style.width = '400px';
    art.style.height = '300px';
    art.setAttribute('autoplay', '');
    document.body.appendChild(art);
  });

  test('test if pointer events plugin is active', async () => {
    const art = document.querySelector('shader-art');
    expect(art).toBeDefined();
    expect((<ShaderArtShim>art).activePlugins[0]).toBeInstanceOf(
      PointerInteractionsPlugin
    );
    const plugin = (<ShaderArtShim>art)
      .activePlugins[0] as PointerInteractionsPlugin;
    const subscriber = jest.fn();
    plugin.subscribe(subscriber);
    art?.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 250,
        clientY: 250,
        relatedTarget: art,
      })
    );
    art?.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        relatedTarget: art,
      })
    );
    art?.dispatchEvent(
      new PointerEvent('pointerup', {
        pointerId: 1,
        clientX: 250,
        clientY: 250,
        relatedTarget: art,
      })
    );
    await wait();
    expect(subscriber).toHaveBeenCalledTimes(3);
  });
});
