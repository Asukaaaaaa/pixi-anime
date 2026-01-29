import { Assets, Sprite } from "pixi.js";
import { Scene } from ".";

export class SceneBunnies extends Scene {
  type:
    | "basic_rotation"
    | "wave_rotation"
    | "pulse_scaling"
    | "spiral_rotation"
    | "alternating_rotation"
    | "bouncing_rotation"
    | "progressive_rotation"
    | "random_rotation"
    | "swinging_rotation"
    | "fast_rotation" = "basic_rotation";

  constructor() {
    super();
    this.init();
  }

  async init() {
    this.container.x = 150;
    this.container.y = 150;

    const texture = await Assets.load("https://pixijs.com/assets/bunny.png");

    for (let i = 0; i < 25; i++) {
      const bunny = new Sprite(texture);
      bunny.x = (i % 5) * 30;
      bunny.y = Math.floor(i / 5) * 30;

      this.sprites.push(bunny);
      this.container.addChild(bunny);
    }

    this.ready.resolve();
  }

  getFrameAt(i: number) {
    switch (this.type) {
      case "basic_rotation":
        {
          const progress = i / this.frame_count;
          const rotation = progress * Math.PI * 2;
          this.sprites.forEach((bunny, index) => {
            bunny.rotation = rotation + index * 0.1;
          });
        }
        break;
      case "wave_rotation":
        {
          const progress = i / this.frame_count;
          this.sprites.forEach((bunny, index) => {
            const wave = Math.sin(progress * Math.PI * 4 + index * 0.5);
            bunny.rotation = wave * Math.PI;
          });
        }
        break;
      case "pulse_scaling":
        {
          const progress = i / this.frame_count;
          const scale = 0.5 + Math.sin(progress * Math.PI * 2) * 0.5;
          this.sprites.forEach((bunny) => {
            bunny.scale.set(scale);
          });
        }
        break;
      case "spiral_rotation":
        {
          const progress = i / this.frame_count;
          this.sprites.forEach((bunny, index) => {
            const spiralRotation = progress * Math.PI * 4 + index * 0.2;
            bunny.rotation = spiralRotation;
          });
        }
        break;
      case "alternating_rotation":
        {
          const progress = i / this.frame_count;
          const rotation = progress * Math.PI * 2;
          this.sprites.forEach((bunny, index) => {
            bunny.rotation = index % 2 === 0 ? rotation : -rotation;
          });
        }
        break;
      case "bouncing_rotation":
        {
          const progress = i / this.frame_count;
          const bounce = Math.abs(Math.sin(progress * Math.PI * 6));
          this.sprites.forEach((bunny, index) => {
            bunny.rotation = bounce * Math.PI * 2 + index * 0.1;
          });
        }
        break;
      case "progressive_rotation":
        {
          const progress = i / this.frame_count;
          const [cx, cy] = [2, 2]; // 5x5网格的中心
          this.sprites.forEach((bunny, index) => {
            const x = index % 5;
            const y = Math.floor(index / 5);
            const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            bunny.rotation = progress * Math.PI * 2 + distance * 0.3;
          });
        }
        break;
      case "random_rotation":
        {
          const progress = i / this.frame_count;
          const rotation = progress * Math.PI * 2;
          this.sprites.forEach((bunny, index) => {
            bunny.rotation = rotation + index * 0.25;
          });
        }
        break;
      case "swinging_rotation":
        {
          const progress = i / this.frame_count;
          const swing = Math.sin(progress * Math.PI * 2);
          this.sprites.forEach((bunny, index) => {
            bunny.rotation = swing * Math.PI + index * 0.15;
          });
        }
        break;
      case "fast_rotation":
        {
          const progress = i / this.frame_count;
          const rotation = progress * Math.PI * 8; // 4倍速
          this.sprites.forEach((bunny, index) => {
            bunny.rotation = rotation + index * 0.1;
          });
        }
        break;

      default:
        break;
    }

    return this.container;
  }
}
