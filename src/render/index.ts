import { Application, Container, Sprite, Text, TextStyle, Assets, Texture, ApplicationOptions } from 'pixi.js';
import { Movie, MovieElement, ElementType } from '../model';

export class MovieRenderer {
  private app: Application;
  private movie: Movie;
  private elementMap: Map<string, Container | HTMLAudioElement>; // Store Pixi objects or Audio elements by element ID
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
      if (element.type === 'audio') {
        const audio = new Audio(element.src);
        audio.preload = 'auto'; // Preload audio
        this.elementMap.set(element.id, audio);
        continue;
      }

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

    // Sync audio start if needed? 
    // Actually renderFrame handles playback check, so updates will catch it.
  }

  pause() {
    this.isPlaying = false;
    this.app.ticker.remove(this.update, this);

    // Pause all audio
    for (const item of Array.from(this.elementMap.values())) {
      if (item instanceof HTMLAudioElement) {
        item.pause();
      }
    }
  }

  seek(frame: number) {
    this.currentFrame = frame;
    this.renderFrame(this.currentFrame);
  }

  private update(time: any) {
    // Determine frame based on time or just increment for simple playback

    // Simple approach: 
    // Increment frame by (movie.fps / 60) * time.deltaTime?

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
      const item = this.elementMap.get(element.id);

      if (element.type === 'audio' && item instanceof HTMLAudioElement) {
        const startFrame = element.startFrame ?? 0;
        const endFrame = element.endFrame ?? this.movie.duration;

        if (frame >= startFrame && frame < endFrame) {
          // Should be playing
          if (this.isPlaying && item.paused) {
            item.play().catch(e => console.warn("Audio play failed", e));
            // Sync time: (currentFrame - startFrame) / fps -> seconds
            // We only sync if drift is large or just started? 
            // For strict requirement: "play at normal speed", just setting currentTime once might be enough 
            // but loop/seek needs care.
            item.currentTime = (frame - startFrame) / this.movie.fps;
          } else if (this.isPlaying && !item.paused) {
            // Check sync?
            const expectedTime = (frame - startFrame) / this.movie.fps;
            if (Math.abs(item.currentTime - expectedTime) > 0.5) {
              item.currentTime = expectedTime;
            }
          }
        } else {
          // Should be stopped/paused
          if (!item.paused) {
            item.pause();
            item.currentTime = 0;
          }
        }
        continue;
      }

      // Visual elements
      const state = this.movie.getElementState(element.id, frame);

      if (item instanceof Container && state) {
        if (state.x !== undefined) item.x = state.x;
        if (state.y !== undefined) item.y = state.y;
        if (state.alpha !== undefined) item.alpha = state.alpha;
        if (state.scaleX !== undefined) item.scale.x = state.scaleX;
        if (state.scaleY !== undefined) item.scale.y = state.scaleY;
        if (state.rotation !== undefined) item.rotation = state.rotation;
      }
    }
  }
}

