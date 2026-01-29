import { autoDetectRenderer, Container, Matrix, Renderer } from "pixi.js";

export class RenderContext {
  renderer?: Renderer;

  constructor() {
    this.init();
  }

  async init() {
    this.renderer = await autoDetectRenderer({
      preference: "webgpu",
      multiView: true,
    });
  }

  // 渲染指定的容器到目标canvas
  render(container: Container, canvas: HTMLCanvasElement) {
    this.renderer?.render({
      container,
      target: canvas,
      transform: new Matrix(),
    });
  }
}
