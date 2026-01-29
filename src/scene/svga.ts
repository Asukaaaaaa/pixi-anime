import { Assets, Matrix, Sprite, Texture } from "pixi.js";
import { Downloader, Parser, VideoEntity } from "svga-web";
import { Scene } from ".";

const downloader = new Downloader();
const parser = new Parser();
let id = 0;

export class SceneSVGA extends Scene {
  id = `svga${id++}`;
  src: string;
  video?: VideoEntity;
  sprites: (Sprite & { key: number })[] = [];

  constructor(src: string) {
    super();
    this.src = src;
    this.init();
  }

  async init() {
    const raw = await downloader.get(this.src);
    const video = await parser.do(raw);

    this.video = video;
    this.frame_count = video.frames;
    this.fps = video.FPS;

    const texture_map = {} as Record<string, Texture>;
    for (const [k, v] of Object.entries(video.images)) {
      if (v instanceof ArrayBuffer) {
        const blob = new Blob([v], { type: "image/png" });
        const bitmap = await createImageBitmap(blob);
        texture_map[k] = Texture.from(bitmap);
      }
    }
    for (let i = 0; i < video.sprites.length; i++) {
      const sp = video.sprites[i];
      if (sp.imageKey && texture_map[sp.imageKey]) {
        const s = new Sprite(texture_map[sp.imageKey]);
        this.sprites.push(Object.assign(s, { key: i }));
        this.container.addChild(s);
      }
    }

    this.container.setSize(video.videoSize.width, video.videoSize.height);

    console.log(video, texture_map, this.sprites);

    this.ready.resolve();
  }

  getFrameAt(i: number) {
    if (!this.video) return this.container;
    this.video.sprites.forEach((sprite, j) => {
      const frame = sprite.frames[i];
      const target = this.sprites.find((s) => s.key === j);
      if (frame && target) {
        target.visible = !!frame.alpha;
        target.x = frame.layout.x;
        target.y = frame.layout.y;
        target.width = frame.layout.width;
        target.height = frame.layout.height;
        const { a, b, c, d, tx, ty } = frame.transform;
        target.setFromMatrix(new Matrix(a, b, c, d, tx, ty));
      }
    });
    return this.container;
  }
}
