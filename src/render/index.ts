import { Application, Container, Sprite, Text, TextStyle, Assets, Texture, ApplicationOptions } from 'pixi.js';
import { Movie, MovieElement, ElementType } from '../model';

export class MovieRenderer {
  private app: Application;
  private movie: Movie;
  private elementMap: Map<string, Container>; // Store Pixi objects by element ID
  private isPlaying: boolean;
  private currentFrame: number;
  private options?: Partial<ApplicationOptions>;

  constructor(movie: Movie, options?: Partial<ApplicationOptions>) {
    this.app = new Application();
    this.movie = movie;
    this.elementMap = new Map();
    this.isPlaying = false;
    this.currentFrame = 0;
    this.options = options;
  }

  async init(container: HTMLElement = document.body) {
    // Initialize the application
    await this.app.init({
      width: this.movie.width,
      height: this.movie.height,
      background: '#1099bb',
      // resizeTo: window, // Remove resizeTo window if we want strictly movie size, or keep if behavior is desired. User asked to use Movie width/height.
      // Let's allow options to override, but default 'width' and 'height' to Movie's.
      // If resizeTo is passed in options, it overrides width/height in Pixi init.
      ...this.options
    });

    // Append the application canvas to the document body or specified container
    container.appendChild(this.app.canvas);

    // Preload assets if necessary, create initial sprites
    await this.setupElements();
  }

  private async setupElements() {
    for (const element of this.movie.elements) {
      let pixiObject: Container;

      if (element.type === 'image') {
        const texture = await Assets.load(element.src);
        pixiObject = new Sprite(texture);
      } else if (element.type === 'text') {
        pixiObject = new Text({ text: element.content, style: element.style });
      } else {
        continue;
      }

      this.app.stage.addChild(pixiObject);
      this.elementMap.set(element.id, pixiObject);
    }
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.app.ticker.add(this.update, this);
  }

  pause() {
    this.isPlaying = false;
    this.app.ticker.remove(this.update, this);
  }

  seek(frame: number) {
    this.currentFrame = frame;
    this.renderFrame(this.currentFrame);
  }

  private update(time: any) {
    // Determine frame based on time or just increment for simple playback
    // For FPS control, we should ideally use time.path or keep a local accumulator.
    // However, simplest way effectively is to rely on Pixi ticker speed or just increment.
    // If we want specific FPS for the MOVIE, we need to map real time to movie time.

    // For now, let's implement a simple accumulator strategy.
    // Pixi ticker normally runs at 60fps (or monitor refresh rate).
    // this.movie.fps is our target.

    // Using time.deltaTime (which is scaled to 1 = 60fps usually) or time.elapsedMS

    // Simple approach: 
    // Increment frame by (movie.fps / 60) * time.deltaTime?
    // Let's assume time.deltaTime is ~1 at 60fps.
    // If movie.fps is 30, we want to advance 0.5 frames per tick.

    const speed = this.movie.fps / 60; // Approximation if we assume 60fps base
    this.currentFrame += speed * time.deltaTime;

    if (this.currentFrame > this.movie.duration) {
      if (this.movie.loop) {
        this.currentFrame = this.currentFrame % this.movie.duration;
      } else {
        this.currentFrame = this.movie.duration;
        this.pause();
      }
    }

    this.renderFrame(Math.floor(this.currentFrame));
  }

  renderFrame(frame: number) {
    for (const element of this.movie.elements) {
      const state = this.movie.getElementState(element.id, frame);
      const pixiObject = this.elementMap.get(element.id);

      if (pixiObject && state) {
        if (state.x !== undefined) pixiObject.x = state.x;
        if (state.y !== undefined) pixiObject.y = state.y;
        if (state.alpha !== undefined) pixiObject.alpha = state.alpha;
        if (state.scaleX !== undefined) pixiObject.scale.x = state.scaleX;
        if (state.scaleY !== undefined) pixiObject.scale.y = state.scaleY;
        if (state.rotation !== undefined) pixiObject.rotation = state.rotation;
      }
    }
  }
}

