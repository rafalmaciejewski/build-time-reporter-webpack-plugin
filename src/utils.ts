import webpack from 'webpack';
import dashify from 'dashify';
import { PLUGIN_NAME } from './constants';

export function tapInto(
  context: webpack.Compiler | webpack.compilation.Compilation,
  hook: string,
  cb: (...args: any[]) => void,
): void {
  if (context.hooks) {
    context.hooks[hook].tap(PLUGIN_NAME, cb);
  } else {
    (context as webpack.Compiler).plugin(dashify(hook), (...args) => {
      const callback = args.pop();
      cb(...args, callback);
      if (callback && callback instanceof Function) {
        callback();
      }
    });
  }
}

export function tapPromiseInto(
  compiler: webpack.Compiler,
  hook: string,
  cb: (compilation: webpack.compilation.Compilation) => Promise<void>,
): void {
  if (compiler.hooks) {
    compiler.hooks[hook].tapPromise(PLUGIN_NAME, cb);
  } else {
    compiler.plugin(dashify(hook), (compilation, callback) => {
      cb(compilation).then(callback).catch(callback);
    });
  }
}

export function getLogger(compiler: webpack.Compiler): webpack.Logger {
  return compiler.getInfrastructureLogger
    ? compiler.getInfrastructureLogger(PLUGIN_NAME)
    : ((console as unknown) as webpack.Logger);
}
