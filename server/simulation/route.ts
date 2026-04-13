import type { Coord } from "../../shared/types.js";

export class NavigationRoute {
  private coords: Coord[];
  private currentIndex: number;

  constructor(coords: Coord[]) {
    this.coords = [...coords];
    this.currentIndex = 0;
  }

  get isFinished(): boolean {
    return this.currentIndex >= this.coords.length - 1;
  }

  get currentTarget(): Coord | null {
    if (this.currentIndex + 1 < this.coords.length) {
      return this.coords[this.currentIndex + 1];
    }
    return null;
  }

  get currentPosition(): Coord {
    return this.coords[Math.min(this.currentIndex, this.coords.length - 1)];
  }

  get traveledCoordinates(): Coord[] {
    return this.coords.slice(0, this.currentIndex + 1);
  }

  get upcomingCoordinates(): Coord[] {
    return this.coords.slice(this.currentIndex);
  }

  get progress(): number {
    if (this.coords.length <= 1) return 1;
    return this.currentIndex / (this.coords.length - 1);
  }

  get totalPoints(): number {
    return this.coords.length;
  }

  advance() {
    if (!this.isFinished) {
      this.currentIndex++;
    }
  }

  reverse(): NavigationRoute {
    return new NavigationRoute([...this.coords].reverse());
  }

  getAllCoords(): Coord[] {
    return [...this.coords];
  }
}
