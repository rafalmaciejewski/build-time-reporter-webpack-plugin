import webpack from 'webpack';
import { AssetStats, BuildTimeReporterStats, Step, StepStats } from './types';

export class BuildTimeReport {
  private readonly steps = new Map<Step, { timeStart: number; timeEnd: number }>();
  private timeStart = 0;
  private timeEnd = 0;
  private assets: AssetStats[] = [];
  private chunks: string[] = [];
  private modules: string[] = [];
  private hash?: string;
  private initialResource?: string;

  constructor(private readonly projectRoot: string, private readonly rebuild: boolean = false) {}

  public track(step: Step): void {
    const stepStats = this.steps.get(step);
    if (!stepStats) {
      this.steps.set(step, {
        timeStart: Date.now(),
        timeEnd: Date.now(),
      });
      return;
    }
    stepStats.timeEnd = Date.now();
  }

  public start(): void {
    this.timeStart = Date.now();
  }

  public end(): void {
    this.timeEnd = Date.now();
  }

  public setHash(hash: string): void {
    this.hash = hash;
  }

  public addAssets(assets: Array<AssetStats & { emitted?: boolean }>): void {
    this.assets = assets
      .filter((asset) => asset.emitted)
      .map((asset) => ({
        name: asset.name,
        size: asset.size,
      }));
  }

  public addChunks(chunks: webpack.compilation.Chunk[]): void {
    this.chunks = chunks.filter((chunk) => chunk.rendered).map((chunk) => chunk.name ?? chunk.id);
  }

  public addModules(modules: Array<webpack.compilation.Module & { name: string }>): void {
    this.modules = modules.filter((mod) => mod.built).map((mod) => mod.name ?? mod.id);
  }

  public setInitialResource(resource: string): void {
    if (!this.initialResource && resource) {
      this.initialResource = resource.replace(this.projectRoot, '');
    }
  }

  public collect(): BuildTimeReporterStats {
    return {
      hash: this.hash,
      timeStart: this.timeStart,
      timeEnd: this.timeEnd,
      duration: this.timeEnd - this.timeStart,
      steps: this.collectStepStats(),
      chunks: this.chunks,
      assetCount: this.assets.length,
      modulesCount: this.modules.length,
      initialResource: this.initialResource,
      rebuild: this.rebuild,
      nodeEnv: process.env.NODE_ENV as string,
      assets: this.assets,
    };
  }

  private collectStepStats(): Record<Step, StepStats> {
    const result = {} as Record<Step, StepStats>;
    Array.from(this.steps).forEach(([step, stepStats]) => {
      result[step] = {
        ...stepStats,
        duration: stepStats.timeEnd - stepStats.timeStart,
      };
    });
    return result;
  }
}
