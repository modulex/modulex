/**
 * A module registration and load library.
 *
 * you can use
 *
 *     modulex.use('overlay,node', function(Overlay, Node){
 *     });
 *
 * to load modules. and use
 *
 *     modulex.add(function(require, module, exports){
 *     });
 *
 * to register modules.
 */
/* exported modulex */
/* jshint -W079 */
import Status from './Status';

var mx = {
  /**
   * The build time of the library.
   * NOTICE: __TIMESTAMP__ will replace with current timestamp when compressing.
   * @private
   * @type {String}
   */
  __BUILD_TIME: __TIMESTAMP__,

  /**
   * modulex Environment.
   * @type {Object}
   */
  Env: {
    host: self,
    mods: {},
  },

  /**
   * modulex Config.
   * If load modulex.js, Config.debug defaults to true.
   * Else If load modulex-min.js, Config.debug defaults to false.
   * @private
   * @property {Object} Config
   * @property {Boolean} Config.debug
   * @member modulex
   */
  Config: {
    debug: __DEV__,
    packages: {},
    fns: {},
  },

  /**
   * The version of the library.
   * NOTICE: '@VERSION@' will replace with current version when compressing.
   * @type {String}
   */
  version: __VERSION__,

  /**
   * set modulex configuration
   * @param {Object|String} configName Config object or config key.
   * @param {String} configName.base modulex 's base path. Default: get from loader(-min).js or seed(-min).js
   * @param {String} configName.tag modulex 's timestamp for native module. Default: modulex 's build time.
   * @param {Boolean} configName.debug whether to enable debug mod.
   * @param {Boolean} configName.combine whether to enable combo.
   * @param {Object} configName.packages Packages definition with package name as the key.
   * @param {String} configName.packages.base Package base path.
   * @param {String} configName.packages.tag  Timestamp for this package's module file.
   * @param {String} configName.packages.debug Whether force debug mode for current package.
   * @param {String} configName.packages.combine Whether allow combine for current package modules.
   * can only be used in production mode.
   * @param [configValue] config value.
   *
   * for example:
   *     @example
   *     modulex.config({
   *      combine: true,
   *      base: '.',
   *      packages: {
   *          'gallery': {
   *              base: 'http://a.tbcdn.cn/s/modulex/gallery/'
   *          }
   *      },
   *      modules: {
   *          'gallery/x/y': {
   *              requires: ['gallery/x/z']
   *          }
   *      }
   *     });
   */
  config(configName, configValue) {
    var cfg, r, fn;
    var Config = mx.Config;
    var configFns = Config.fns;
    var self = this;
    if (typeof configName === 'string') {
      cfg = configFns[configName];
      if (configValue === undefined) {
        if (cfg) {
          r = cfg.call(self);
        } else {
          r = Config[configName];
        }
      } else {
        if (cfg) {
          r = cfg.call(self, configValue);
        } else {
          Config[configName] = configValue;
        }
      }
    } else {
      for (var p in configName) {
        configValue = configName[p];
        fn = configFns[p];
        if (fn) {
          fn.call(self, configValue);
        } else {
          Config[p] = configValue;
        }
      }
    }
    return r;
  },
};

export default mx;
