import { Container, Sprite } from "pixi.js";

export class Scene {
  container = new Container();
  frame_count = 100;
  fps = 30;
  loop = true;
  sprites: Sprite[] = [];
  ready = Promise.withResolvers<void>();

  constructor() {}

  *frames() {
    for (let i = 0; i < this.frame_count; i++) {
      yield this.getFrameAt(i);
    }
  }

  getFrameAt(i: number) {
    return this.container;
  }
}
