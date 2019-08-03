/**
 * @ignore
 * init loader, set config
 * @author yiminghe@gmail.com
 */
import mx from './modulex';

var doc = mx.Env.host && mx.Env.host.document;
var defaultComboPrefix = '??';
var defaultComboSep = ',';
var Loader = mx.Loader;
var Utils = Loader.Utils;
var createModule = Utils.createModule;
var ComboLoader = Loader.ComboLoader;

Utils.mix(mx, {
  // internal usage
  getModule(id) {
    return createModule(id);
  },

  // internal usage
  getPackage(packageName) {
    return mx.Config.packages[packageName];
  },

  /**
   * Registers a module with the modulex global.
   * @param {String} id module id.
   * it must be set if combine is true in {@link modulex#config}
   * @param {Function} factory module definition function that is used to return
   * exports of this module
   * @param {modulex} factory.mx modulex global instance
   * @param {Object} [cfg] module optional config data
   * @param {String[]} cfg.requires this module's required module name list
   * @member modulex
   *
   *
   *      // dom module's definition
   *      modulex.add('dom', function(mx, xx){
   *          return {css: function(el, name, val){}};
   *      },{
   *          requires:['xx']
   *      });
   */
  add(id, factory, cfg) {
    ComboLoader.add(id, factory, cfg, arguments.length);
  },

  /**
   * initialize one or more modules
   * @param {String|String[]} modIds 1-n modules to bind(use comma to separate)
   * @param {Function} success callback function executed
   * when modulex has the required functionality.
   * @param {Function} error callback function executed
   * when modulex has the required functionality.
   * @param {modulex} success.mx modulex instance
   * @param success.x... modules exports
   * @member modulex
   *
   *
   *      // loads and initialize overlay dd and its dependencies
   *      modulex.use(['overlay','dd'], function(mx, Overlay){});
   */
  use(modIds, success, error) {
    var loader;
    var tryCount = 0;
    if (typeof modIds === 'string') {
      modIds = modIds.split(/\s*,\s*/);
    }
    if (typeof success === 'object') {
      //noinspection JSUnresolvedVariable
      error = success.error;
      //noinspection JSUnresolvedVariable
      success = success.success;
    }
    for (var i = 0; i < modIds.length; i++) {
      var modId = modIds[i];
      if (Utils.startsWith(modId, './') || Utils.startsWith(modId, '../')) {
        modIds[i] = Utils.normalizePath(location.href, modId);
      }
    }
    var mods = Utils.createModules(modIds);
    var unloadedMods = [];
    Utils.each(mods, function(mod) {
      unloadedMods.push.apply(unloadedMods, mod.getNormalizedModules());
    });

    function processError(errorList, action) {
      console.error('modulex: ' + action + ' the following modules error');
      console.error(
        Utils.map(errorList, function(e) {
          return e.id;
        }),
      );
      if (error) {
        if ('@DEBUG@') {
          error.apply(mx, errorList);
        } else {
          try {
            error.apply(mx, errorList);
          } catch (e) {
            /*jshint loopfunc:true*/
            setTimeout(function() {
              throw e;
            }, 0);
          }
        }
        error = null;
      }
    }

    function loadReady() {
      ++tryCount;
      var errorList = [];
      // get error from last round of load
      // important! can not replace unloadedMods with nextToLoadMods
      var nextToLoadMods = loader.calculate(unloadedMods, errorList);
      if (errorList.length) {
        // note: at combo mode  a depends b if b error, then a error two, only return a
        processError(errorList, 'load');
      } else if (loader.isCompleteLoading()) {
        var isInitSuccess = Utils.initModules(unloadedMods);
        if (!isInitSuccess) {
          processError(Utils.collectErrors(unloadedMods), 'init');
        } else if (success) {
          if ('@DEBUG@') {
            success.apply(mx, Utils.getModulesExports(mods));
          } else {
            try {
              success.apply(mx, Utils.getModulesExports(mods));
            } catch (e) {
              /*jshint loopfunc:true*/
              setTimeout(function() {
                throw e;
              }, 0);
            }
          }
          success = null;
        }
      } else {
        // in case all of its required mods is loading by other loaders
        loader.callback = loadReady;
        if (nextToLoadMods.length) {
          loader.use(nextToLoadMods);
        }
      }
    }

    loader = new ComboLoader(loadReady);
    // in case modules is loaded statically
    // synchronous check
    // but always async for loader
    loadReady();
    return mx;
  },

  /**
   * get module exports from modulex module cache
   * @param {String} id module id
   * @member modulex
   * @return {*} exports of specified module
   */
  require(id) {
    return createModule(id).getExports();
  },

  /**
   * undefine a module
   * @param {String} id module id
   * @member modulex
   */
  undef(id) {
    var requiresModule = createModule(id);
    var mods = requiresModule.getNormalizedModules();
    Utils.each(mods, function(m) {
      m.undef();
    });
  },
});

function returnJson(s) {
  /*jshint evil:true*/
  return new Function('return ' + s)();
}

/**
 * get base from modulex
 * @ignore
 *
 * for example:
 *      @example
 *      http://x.com/modulex.js
 *      note about custom combo rules, such as yui3:
 *      combo-prefix='combo?' combo-sep='&'
 */
mx.config({
  comboPrefix: defaultComboPrefix,
  comboSep: defaultComboSep,
  // 2k(2048) uri length
  comboMaxUriLength: 2000,
  // file limit number for a single combo uri
  comboMaxFileNum: 40,
  charset: 'utf-8',
  filter: '',
  lang: 'zh-cn',
});

// conform to amd
mx.add.amd = true;

if (typeof global === 'undefined' && typeof window !== 'undefined') {
  var win = window;
  var requireFn = win['require'];
  win['require'] = mx.use;
  win['require'].config = mx.config;
  var define = win.define;
  win.define = mx.add;
  mx.noConflict = function() {
    win['require'] = requireFn;
    win.define = define;
  };
}
