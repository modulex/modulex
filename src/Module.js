import Status from './Status';
import mx from './modulex';
import {
  mix,
  startsWith,
  normalizeSlash,
  normalizePath,
  endsWith,
  map,
  each,
} from './utils';

var mods = mx.Env.mods;
var Config = mx.Config;
var INITIALIZED = Status.INITIALIZED;
var INITIALIZING = Status.INITIALIZING;
var ERROR = Status.ERROR;

const REQUIRE = 'require';

function async(self, mods, callback) {
  for (var i = 0; i < mods.length; i++) {
    mods[i] = self.resolve(mods[i]).id;
  }
  mx.use(mods, callback);
}

/**
 * @class modulex.Loader.Module
 */
function Module(cfg) {
  var self = this;
  /**
   * exports of this module
   */
  self.exports = undefined;

  // es6 compatible
  self['module'] = self;

  /**
   * status of current modules
   */
  self.status = Status.UNLOADED;

  /**
   * name of this module
   */
  self.id = undefined;

  /**
   * factory of this module
   */
  self.factory = undefined;

  /**
   * user config
   *
   *  modulex.config('modules',{
   *      x: {
   *          y:1
   *      }
   *  })
   *
   *  x.js:
   *
   *  modulex.add(function(require, exports, module){
   *      console.log(module.config().y);
   *  });
   */
  self.config = undefined;

  // lazy initialize and commonjs module format
  self.cjs = 1;

  mix(self, cfg);

  self.waits = {};

  var requireFn = (self._require = function(id, callback) {
    if (typeof id === 'string') {
      var requiresModule = self.resolve(id);
      initModules(requiresModule.getNormalizedModules());
      return requiresModule.getExports();
    } else {
      async(self, id, callback);
    }
  });

  requireFn.toUrl = function(relativeUrl) {
    var url = self.getUri();
    var prefix = '';
    var suffix = url;
    var index = url.indexOf('//');
    if (index !== -1) {
      prefix = url.slice(0, index + 2);
      suffix = url.slice(index + 2);
    }
    return prefix + normalizePath(suffix, relativeUrl);
  };

  requireFn.load = mx.getScript;
}

Module.prototype = {
  modulex: 1,

  constructor: Module,

  config() {
    return this.config;
  },

  reset(cfg) {
    var self = this;
    mix(self, cfg);
    // module definition changes requires
    if (cfg.requires) {
      self.setRequiresModules(cfg.requires);
    }
  },

  [REQUIRE](id) {
    return this.resolve(id).getExports();
  },

  resolve(relativeId) {
    return createModule(normalizePath(this.id, relativeId));
  },

  add(loader) {
    this.waits[loader.id] = loader;
  },

  remove(loader) {
    delete this.waits[loader.id];
  },

  contains(loader) {
    return this.waits[loader.id];
  },

  flush() {
    each(this.waits, function(loader) {
      loader.flush();
    });
    this.waits = {};
  },

  /**
   * Get the type if current Module
   * @return {String} css or js
   */
  getType() {
    var self = this;
    var v = self.type;
    if (!v) {
      var id = self.id;
      if (endsWith(id, '.css')) {
        v = 'css';
      } else {
        v = 'js';
      }
      self.type = v;
    }
    return v;
  },

  getAlias() {
    var self = this;
    var id = self.id;
    if (self.normalizedAlias) {
      return self.normalizedAlias;
    }
    var alias = getShallowAlias(self);
    var ret = [];
    // implies no alias or else circular alias ...
    if (alias[0] === id) {
      ret = alias;
    } else {
      for (var i = 0, l = alias.length; i < l; i++) {
        var aliasItem = alias[i];
        if (aliasItem && aliasItem !== id) {
          var mod = createModule(aliasItem);
          var normalAlias = mod.getAlias();
          if (normalAlias) {
            ret.push.apply(ret, normalAlias);
          } else {
            ret.push(aliasItem);
          }
        }
      }
    }
    self.normalizedAlias = ret;
    return ret;
  },

  getNormalizedModules() {
    var self = this;
    if (self.normalizedModules) {
      return self.normalizedModules;
    }
    self.normalizedModules = map(self.getAlias(), function(alias) {
      return createModule(alias);
    });
    return self.normalizedModules;
  },

  /**
   * Get the path uri of current module if load dynamically
   * @return {String}
   */
  getUri() {
    var self = this;
    // es6: this.module.url
    if (!self.uri) {
      self.uri = normalizeSlash(mx.Config.resolveModFn(self));
    }
    return self.uri;
  },

  getUrl() {
    return this.getUri();
  },

  getExports() {
    var normalizedModules = this.getNormalizedModules();
    return normalizedModules[0] && normalizedModules[0].exports;
  },

  /**
   * Get the package which current module belongs to.
   * @return {modulex.Loader.Package}
   */
  getPackage() {
    var self = this;
    if (self.packageInfo === undefined) {
      var id = self.id;
      // absolute path does not belong to any package
      var packages = Config.packages;
      var modIdSlash = self.id + '/';
      var pName = '';
      var p;
      for (p in packages) {
        var pWithSlash = p;
        if (!endsWith(pWithSlash, '/')) {
          pWithSlash += '/';
        }
        if (startsWith(modIdSlash, pWithSlash) && p.length > pName.length) {
          pName = p;
        }
      }
      if (!packages[pName]) {
        if (
          startsWith(id, '/') ||
          startsWith(id, 'http://') ||
          startsWith(id, 'https://') ||
          startsWith(id, 'file://')
        ) {
          self.packageInfo = null;
          return self.packageInfo;
        }
      }
      self.packageInfo = packages[pName];
    }
    return self.packageInfo;
  },

  /**
   * Get the tag of current module.
   * tag can not contain ".", eg: Math.random() !
   * @return {String}
   */
  getTag() {
    var self = this;
    return self.tag || (self.getPackage() && self.getPackage().getTag());
  },

  /**
   * Get the charset of current module
   * @return {String}
   */
  getCharset() {
    var self = this;
    return (
      self.charset || (self.getPackage() && self.getPackage().getCharset())
    );
  },

  setRequiresModules(requires) {
    var self = this;
    var requiredModules = (self.requiredModules = map(
      normalizeRequires(requires, self),
      function(m) {
        return createModule(m);
      },
    ));
    var normalizedRequiredModules = [];
    each(requiredModules, function(mod) {
      normalizedRequiredModules.push.apply(
        normalizedRequiredModules,
        mod.getNormalizedModules(),
      );
    });
    self.normalizedRequiredModules = normalizedRequiredModules;
  },

  getNormalizedRequiredModules() {
    var self = this;
    if (self.normalizedRequiredModules) {
      return self.normalizedRequiredModules;
    }
    self.setRequiresModules(self.requires);
    return self.normalizedRequiredModules;
  },

  getRequiredModules() {
    var self = this;
    if (self.requiredModules) {
      return self.requiredModules;
    }
    self.setRequiresModules(self.requires);
    return self.requiredModules;
  },

  callFactory() {
    var self = this;
    var args;
    if (self.amd) {
      args = map(self.getRequiredModules(), function(m) {
        return m.getExports();
      });
      if (self.exportsIndex !== undefined && self.exportsIndex !== -1) {
        args.splice(self.exportsIndex, 0, self.exports);
      }
    } else {
      args = self.cjs
        ? [self._require, self.exports, self]
        : map(self.getRequiredModules(), function(m) {
            return m.getExports();
          });
    }
    return self.factory.apply(self, args);
  },

  initSelf() {
    var self = this;
    var factory = self.factory;
    var exports;
    if (typeof factory === 'function') {
      self.exports = {};

      if (Config.debug) {
        exports = self.callFactory();
      } else {
        try {
          exports = self.callFactory();
        } catch (e) {
          self.status = ERROR;
          if (self.onError || Config.onModuleError) {
            var error = {
              type: 'index.js',
              exception: e,
              module: self,
            };
            self.error = error;
            if (self.onError) {
              self.onError(error);
            }
            if (Config.onModuleError) {
              Config.onModuleError(error);
            }
          } else {
            setTimeout(function() {
              throw e;
            }, 0);
          }
          return 0;
        }
        var success = 1;
        each(self.getNormalizedRequiredModules(), function(m) {
          if (m.status === ERROR) {
            success = 0;
            return false;
          }
        });
        if (!success) {
          return 0;
        }
      }

      if (exports !== undefined) {
        self.exports = exports;
      }
    } else {
      self.exports = factory;
    }
    self.status = INITIALIZED;
    if (self.afterInit) {
      self.afterInit(self);
    }
    if (Config.afterModuleInit) {
      Config.afterModuleInit(self);
    }
    return 1;
  },

  initRecursive() {
    var self = this;
    var success = 1;
    var status = self.status;
    if (status === ERROR) {
      return 0;
    }
    // initialized or circular dependency
    if (status >= INITIALIZING) {
      return success;
    }
    self.status = INITIALIZING;
    if (self.cjs) {
      // commonjs format will call require in module code again
      success = self.initSelf();
    } else {
      each(self.getNormalizedRequiredModules(), function(m) {
        success = success && m.initRecursive();
      });
      if (success) {
        self.initSelf();
      }
    }
    return success;
  },

  undef() {
    this.status = Status.UNLOADED;
    this.error = null;
    this.factory = null;
    this.exports = null;
  },
};

function pluginAlias(id) {
  var index = id.indexOf('!');
  if (index !== -1) {
    var pluginId = id.substring(0, index);
    id = id.substring(index + 1);
    var pluginMod = createModule(pluginId);
    pluginMod.initRecursive();
    var Plugin = pluginMod.getExports() || {};
    if (Plugin.alias) {
      id = Plugin.alias(mx, id, pluginId);
    }
  }
  return id;
}

function normalizeRequires(requires, self) {
  requires = requires || [];
  var l = requires.length;
  for (var i = 0; i < l; i++) {
    requires[i] = self.resolve(requires[i]).id;
  }
  return requires;
}

function getShallowAlias(mod) {
  var id = mod.id;
  var packageInfo;
  var alias = mod.alias;
  if (typeof alias === 'string') {
    mod.alias = alias = [alias];
  }
  if (alias) {
    return alias;
  }
  packageInfo = mod.getPackage();

  if (packageInfo) {
    var main;
    // support main in package config
    if (packageInfo.name === id && (main = packageInfo.main)) {
      id += '/';
      if (main.charAt(0) !== '.') {
        main = './' + main;
      }
      alias = [normalizePath(id, main)];
    } else if (packageInfo.alias) {
      alias = packageInfo.alias(id);
    }
  }
  alias = mod.alias = alias || [pluginAlias(id)];
  return alias;
}

// get a module from cache or create a module instance
export function createModule(id, cfg) {
  id = normalizeId(id);
  var aModule = mods[id];
  if (!aModule) {
    aModule = mods[id];
  }
  if (aModule) {
    if (cfg) {
      aModule.reset(cfg);
    }
    return aModule;
  }
  mods[id] = aModule = new Module(
    mix(
      {
        id: id,
      },
      cfg,
    ),
  );

  return aModule;
}

export function createModules(ids) {
  return map(ids, function(id) {
    return createModule(id);
  });
}

export function initModules(modsToInit) {
  var l = modsToInit.length;
  var i;
  var success = 1;
  for (i = 0; i < l; i++) {
    success &= modsToInit[i].initRecursive();
  }
  return success;
}

export function getModulesExports(mods) {
  var l = mods.length;
  var ret = [];
  for (var i = 0; i < l; i++) {
    ret.push(mods[i].getExports());
  }
  return ret;
}

export function addModule(id, factory, config) {
  var aModule = mods[id];
  if (aModule && aModule.factory !== undefined) {
    console.warn(id + ' is defined more than once');
    return;
  }
  createModule(
    id,
    mix(
      {
        id: id,
        status: Status.LOADED,
        factory: factory,
      },
      config,
    ),
  );
}

function normalizeId(id) {
  if (id.charAt(0) === '/') {
    id = location.protocol + '//' + location.host + id;
  }
  // 'x/' 'x/y/z/'
  if (id.charAt(id.length - 1) === '/') {
    id += 'index';
  }
  // x.js === x
  if (endsWith(id, '.js')) {
    id = id.slice(0, -3);
  }
  return id;
}

export function collectModuleErrors(mods, errorList, cache) {
  var i, m, mod, modStatus;
  cache = cache || {};
  errorList = errorList || [];
  for (i = 0; i < mods.length; i++) {
    mod = mods[i];
    m = mod.id;
    if (cache[m]) {
      continue;
    }
    cache[m] = 1;
    modStatus = mod.status;
    if (modStatus === Status.ERROR) {
      errorList.push(mod);
      continue;
    }
    collectModuleErrors(mod.getNormalizedRequiredModules(), errorList, cache);
  }
  return errorList;
}

mix(Module, {
  createModule,
  createModules,
});

export default Module;
