
export type ElementType = 'image' | 'text';

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

export type MovieElement = ImageElement | TextElement;

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

  constructor(elements: MovieElement[], options: MovieOptions) {
    this.elements = elements;
    this.duration = options.duration;
    this.width = options.width;
    this.height = options.height;
    this.loop = options.loop ?? true;
    this.fps = options.fps ?? 60;
  }

  // Get interpolted frame data for a specific element at a specific frame
  getElementState(elementId: string, frame: number): Frame | null {
    const element = this.elements.find(e => e.id === elementId);
    if (!element) return null;

    // Simple linear interpolation could go here, 
    // but for now let's just find the closest previous keyframe or exact match.
    // Ideally we want to interpolate between two keyframes.

    return this.interpolate(element.frames, frame);
  }

  private interpolate(frames: Frame[], targetFrame: number): Frame {
    // Sort frames just in case
    const sortedFrames = [...frames].sort((a, b) => a.frame - b.frame);

    if (sortedFrames.length === 0) return { frame: targetFrame };

    // Find the frame segments
    let prevFrame: Frame = sortedFrames[0];
    let nextFrame: Frame = sortedFrames[sortedFrames.length - 1];

    for (let i = 0; i < sortedFrames.length; i++) {
      if (sortedFrames[i].frame <= targetFrame) {
        prevFrame = sortedFrames[i];
      } else {
        nextFrame = sortedFrames[i];
        break;
      }
    }

    if (prevFrame === nextFrame) {
      return { ...prevFrame, frame: targetFrame };
    }

    if (targetFrame < prevFrame.frame) return { ...prevFrame, frame: targetFrame };
    if (targetFrame > nextFrame.frame) return { ...nextFrame, frame: targetFrame };

    // Linear interpolation
    const ratio = (targetFrame - prevFrame.frame) / (nextFrame.frame - prevFrame.frame);

    const result: Frame = { frame: targetFrame };

    // Interpolate numeric properties
    // We union keys from both frames to handle partial keyframes if we want to be robust,
    // but for simplicity let's assume keys present in prevFrame are the ones to interpolate
    // or just defined common properties.
    const keys = new Set([...Object.keys(prevFrame), ...Object.keys(nextFrame)]);

    keys.forEach(key => {
      if (key === 'frame') return;

      const v1 = prevFrame[key];
      const v2 = nextFrame[key];

      if (typeof v1 === 'number' && typeof v2 === 'number') {
        result[key] = v1 + (v2 - v1) * ratio;
      } else if (v1 !== undefined) {
        // For non-numeric, just hold the previous value
        result[key] = v1;
      }
    });

    return result;
  }
}