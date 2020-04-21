import validateOptions from 'schema-utils';

const PLUGIN_NAME = 'BuildTimeReporterWebpackPlugin';

const schema = {
  type: 'object',
  properties: {
    onBuild: {
      type: 'Function',
    },
  },
  additionalProperties: false,
};

module.exports = class BuildTimeReporterWebpackPlugin {
  constructor(opts = {}) {
    validateOptions(schema, opts, PLUGIN_NAME);
    this.opts = opts;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.finishModules.tapAsync(PLUGIN_NAME, (modules, callback) => {
        this.opts.onBuild(compilation.getStats().time);
        callback();
      });
    });
  }
};
