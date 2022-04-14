export interface BuildTimeReporterWebpackPluginOptions {
  report: (stats: BuildTimeReporterStats) => Promise<unknown>;
}

export interface StepStats {
  timeStart: number;
  timeEnd: number;
  duration: number;
}

export interface AssetStats {
  name: string;
  size: number;
}

export type Step = 'build' | 'optimize' | 'emit';

export interface BuildTimeReporterStats {
  hash?: string;
  assetCount: number;
  chunks: string[];
  modulesCount: number;
  timeStart: number;
  timeEnd: number;
  duration: number;
  steps: Record<Step, StepStats>;
  initialResource?: string;
  rebuild: boolean;
  nodeEnv: string;
  assets: AssetStats[];
}
