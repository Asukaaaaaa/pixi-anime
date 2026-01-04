import { Container, Sprite, Text, Assets } from 'pixi.js';

export type ElementType = 'image' | 'text' | 'audio';

export interface Frame {
  frame: number;
  x?: number;
  y?: number;
  alpha?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  // Make generic enough for extension
  [key: string]: any;
}

export interface ElementBase {
  id: string;
  type: ElementType;
  frames: Frame[];
}

export interface ImageElement extends ElementBase {
  type: 'image';
  src: string;
}

export interface TextElement extends ElementBase {
  type: 'text';
  content: string;
  style?: {
    fontSize?: number;
    fill?: string | number;
    fontFamily?: string;
  };
}

export interface AudioElement extends ElementBase {
  type: 'audio';
  src: string;
  startFrame?: number;
  endFrame?: number;
}

export type MovieElement = ImageElement | TextElement | AudioElement;

export interface MovieOptions {
  width: number;
  height: number;
  duration: number; // in frames
  loop?: boolean;
  fps?: number;
}

export class Movie {
  elements: MovieElement[];
  duration: number; // in frames
  width: number;
  height: number;
  loop: boolean;
  fps: number;
  container: Container;

  private elementMap: Map<string, Container>;

  constructor(elements: MovieElement[], options: MovieOptions) {
    this.elements = elements;
    this.duration = options.duration;
    this.width = options.width;
    this.height = options.height;
    this.loop = options.loop ?? true;
    this.fps = options.fps ?? 60;
    this.container = new Container();
    this.elementMap = new Map();
  }

  async init(interpolate: boolean = false) {
    if (interpolate) {
      this._precalculateFrames();
    }

    const promises = this.elements.map(async (element) => {
      if (element.type === 'audio') {
        return;
      }

      let pixiObject: Container;

      if (element.type === 'image') {
        const texture = await Assets.load(element.src);
        pixiObject = new Sprite(texture);
      } else if (element.type === 'text') {
        pixiObject = new Text({ text: element.content, style: element.style });
      } else {
        return;
      }

      this.container.addChild(pixiObject);
      this.elementMap.set(element.id, pixiObject);
    });

    await Promise.all(promises);
  }

  private _precalculateFrames() {
    for (const element of this.elements) {
      if (element.type === 'audio') continue;

      const keyframes = [...element.frames].sort((a, b) => a.frame - b.frame);
      if (keyframes.length === 0) continue;

      const fullFrames: Frame[] = [];
      const propsToInterpolate = new Set<string>();

      // Collect all numeric properties that appear in keyframes
      for (const kf of keyframes) {
        Object.keys(kf).forEach(key => {
          if (key !== 'frame' && typeof kf[key] === 'number') {
            propsToInterpolate.add(key);
          }
        });
      }

      for (let f = 0; f <= this.duration; f++) {
        // Check if exact keyframe exists
        const exact = keyframes.find(k => k.frame === f);
        if (exact) {
          fullFrames.push(exact);
          continue;
        }

        // Find surrounding keyframes
        let prev = keyframes[0];
        let next = keyframes[keyframes.length - 1];

        for (let i = 0; i < keyframes.length; i++) {
          if (keyframes[i].frame <= f) {
            prev = keyframes[i];
          } else {
            next = keyframes[i];
            break;
          }
        }

        // Handle edge cases (before first, after last) - clamp to nearest
        if (f < prev.frame) {
          fullFrames.push({ ...prev, frame: f });
          continue;
        }
        if (f > next.frame) {
          fullFrames.push({ ...next, frame: f });
          continue;
        }

        if (prev === next) {
          fullFrames.push({ ...prev, frame: f });
          continue;
        }

        // Interpolate
        const ratio = (f - prev.frame) / (next.frame - prev.frame);
        const interpolatedFrame: Frame = { ...prev, frame: f }; // Start with prev values for non-numeric

        propsToInterpolate.forEach(prop => {
          const v1 = prev[prop];
          const v2 = next[prop];
          if (typeof v1 === 'number' && typeof v2 === 'number') {
            interpolatedFrame[prop] = v1 + (v2 - v1) * ratio;
          }
        });

        fullFrames.push(interpolatedFrame);
      }

      element.frames = fullFrames;
    }
  }

  updateFrame(frame: number) {
    for (const element of this.elements) {
      if (element.type === 'audio') continue;
      const pixiObject = this.elementMap.get(element.id)!;
      const state = element.frames.find(f => f.frame === frame);
      if (!state) continue;
      if (state.x !== undefined) pixiObject.x = state.x;
      if (state.y !== undefined) pixiObject.y = state.y;
      if (state.alpha !== undefined) pixiObject.alpha = state.alpha;
      if (state.scaleX !== undefined) pixiObject.scale.x = state.scaleX;
      if (state.scaleY !== undefined) pixiObject.scale.y = state.scaleY;
      if (state.rotation !== undefined) pixiObject.rotation = state.rotation;
    }
  }
}