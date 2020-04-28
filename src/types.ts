export interface BuildTimeReporterWebpackPluginOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  report: (stats: BuildTimeReporterStats) => Promise<any>;
}

export interface StepStats {
  timeStart: number;
  timeEnd: number;
  duration: number;
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
}
