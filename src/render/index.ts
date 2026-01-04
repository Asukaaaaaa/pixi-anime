import { Application, Container, Sprite, Text, TextStyle, Assets, Texture, ApplicationOptions } from 'pixi.js';
import { Movie, MovieElement, ElementType } from '../model';


export class MovieRenderer {
  private app: Application;
  private movie: Movie;
  private isPlaying: boolean;
  private currentFrame: number;
  private options?: Partial<ApplicationOptions>;

  constructor(movie: Movie, options?: Partial<ApplicationOptions>) {
    this.app = new Application();
    this.movie = movie;
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

    this.app.stage.addChild(this.movie.container);
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
    this.movie.updateFrame(frame);
  }
}

