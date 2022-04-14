import webpack from 'webpack';
import { JSONSchema4 } from 'schema-utils/declarations/validate';
import validateOptions from 'schema-utils';
import { BuildTimeReport } from './BuildTimeReport';
import { AssetStats, BuildTimeReporterWebpackPluginOptions } from './types';
import { getLogger, tapInto, tapPromiseInto } from './utils';

const schema: JSONSchema4 = {
  type: 'object',
  properties: {
    report: {
      instanceOf: 'Function',
    },
  },
  additionalProperties: false,
};

let rebuild = false;

export class BuildTimeReporterWebpackPlugin {
  private reportsByHash: Map<string, BuildTimeReport> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private compiler: webpack.Compiler | any;

  constructor(private readonly opts: BuildTimeReporterWebpackPluginOptions = { report: async () => null }) {
    validateOptions(schema, opts);
  }

  private trackBuild(compilation: webpack.compilation.Compilation, report: BuildTimeReport): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tapInto(compilation, 'buildModule', ({ resource }: any) => {
      report.setInitialResource(resource);
      report.track('build');
    });
    tapInto(compilation, 'succeedModule', () => {
      report.track('build');
    });
  }

  private trackOptimize(compilation: webpack.compilation.Compilation, report: BuildTimeReport): void {
    [
      'optimize',
      'afterOptimizeDependencies',
      'afterOptimizeModules',
      'afterOptimizeChunks',
      'afterOptimizeTree',
      'afterOptimizeChunkModules',
      'afterOptimizeModuleIds',
      'afterOptimizeChunkIds',
      'afterOptimizeChunkAssets',
      'afterOptimizeAssets',
      'afterOptimizeExtractedChunks',
    ].forEach((hook) => {
      tapInto(compilation, hook, () => {
        report.track('optimize');
      });
    });
  }

  private trackEmit(): void {
    tapInto(this.compiler, 'emit', (compilation) => {
      const report = this.reportsByHash.get(compilation.hash as string);
      if (report) {
        report.track('emit');
      }
    });
    tapInto(this.compiler, 'afterEmit', (compilation: webpack.compilation.Compilation) => {
      const report = this.reportsByHash.get(compilation.hash as string);
      if (report) {
        report.track('emit');
        report.addAssets(compilation.getStats().toJson().assets as AssetStats[]);
        report.addChunks(compilation.chunks);
        report.addModules(compilation.modules);
      } else {
        getLogger(this.compiler).warn('trackEmit: could not find report', compilation.hash);
      }
    });
  }

  private sendStatsWhenDone(): void {
    tapPromiseInto(this.compiler, 'done', async (compilation) => {
      const logger = getLogger(this.compiler);
      const report = this.reportsByHash.get(compilation.hash as string);
      try {
        if (report) {
          report.end();
          await this.opts.report(report.collect());
        } else {
          logger.warn('sendStatsWhenDone: could not find report', compilation.hash);
        }
      } catch (e) {
        logger.error(e);
      }
      return Promise.resolve();
    });
  }

  private setReportHash(compilation: webpack.compilation.Compilation, report: BuildTimeReport): void {
    tapInto(compilation, 'afterHash', () => {
      report.setHash(compilation.hash as string);
      this.reportsByHash.set(compilation.hash as string, report);
    });
  }

  private createReportAndTrackCompilation(): void {
    tapInto(this.compiler, 'compilation', (compilation) => {
      const report = new BuildTimeReport(this.compiler.context, rebuild);
      rebuild = true;
      report.start();
      this.setReportHash(compilation, report);
      this.trackBuild(compilation, report);
      this.trackOptimize(compilation, report);
    });
  }

  apply(compiler: webpack.Compiler): void {
    this.compiler = compiler;
    this.createReportAndTrackCompilation();
    this.trackEmit();
    this.sendStatsWhenDone();
  }
}
