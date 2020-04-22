import webpack from 'webpack';
import { JSONSchema4 } from 'schema-utils/declarations/validate';
import validateOptions from 'schema-utils';
import { BuildTimeReport } from './BuildTimeReport';
import { BuildTimeReporterWebpackPluginOptions } from './types';

const PLUGIN_NAME = 'BuildTimeReporterWebpackPlugin';

const schema: JSONSchema4 = {
  type: 'object',
  properties: {
    report: {
      instanceOf: 'Function',
    },
  },
  additionalProperties: false,
};

export class BuildTimeReporterWebpackPlugin {
  private reportsByHash: Map<string, BuildTimeReport> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private compiler: webpack.Compiler | any;

  constructor(private readonly opts: BuildTimeReporterWebpackPluginOptions = { report: async () => null }) {
    validateOptions(schema, opts);
  }

  private trackBuild(compilation: webpack.compilation.Compilation, report: BuildTimeReport): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    compilation.hooks.buildModule.tap(PLUGIN_NAME, ({ resource }: any) => {
      report.setInitialResource(resource);
      report.track('build');
    });
    compilation.hooks.succeedModule.tap(PLUGIN_NAME, () => {
      report.track('build');
    });
  }

  private trackOptimize(compilation: webpack.compilation.Compilation, report: BuildTimeReport): void {
    compilation.hooks.optimize.tap(PLUGIN_NAME, () => {
      report.track('optimize');
    });
    [
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
      compilation.hooks[hook].tap(PLUGIN_NAME, () => {
        report.track('optimize');
      });
    });
  }

  private trackEmit(): void {
    this.compiler.hooks.emit.tap(PLUGIN_NAME, (compilation) => {
      const report = this.reportsByHash.get(compilation.hash as string);
      if (report) {
        report.track('emit');
      }
    });
    this.compiler.hooks.afterEmit.tap(PLUGIN_NAME, (compilation) => {
      const report = this.reportsByHash.get(compilation.hash as string);
      if (report) {
        report.track('emit');
        report.addAssets(compilation.assets);
        report.addChunks(compilation.chunks);
        report.addModules(compilation.modules);
      } else {
        this.compiler.getInfrastructureLogger(PLUGIN_NAME).warn('trackEmit: could not find report', compilation.hash);
      }
    });
  }

  private sendStatsWhenDone(): void {
    this.compiler.hooks.done.tapPromise(PLUGIN_NAME, async (compilation) => {
      const logger = this.compiler.getInfrastructureLogger(PLUGIN_NAME);
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
    compilation.hooks.afterHash.tap(PLUGIN_NAME, () => {
      report.setHash(compilation.hash as string);
      this.reportsByHash.set(compilation.hash as string, report);
    });
  }

  private createReportAndTrackCompilation(): void {
    this.compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      const report = new BuildTimeReport(this.compiler.context);
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
