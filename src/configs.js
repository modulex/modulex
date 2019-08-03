/**
 * @ignore
 * Declare config info for modulex.
 * @author yiminghe@gmail.com
 */
import mx from './modulex';

var Loader = mx.Loader;
var Package = Loader.Package;
var Utils = Loader.Utils;
var host = mx.Env.host;
var Config = mx.Config;
var location = host && host.location;
var configFns = Config.fns;

// how to load mods by path
Config.loadModsFn = function(rs, config) {
  mx.getScript(rs.uri, config);
};

// how to get mod uri
Config.resolveModFn = function(mod) {
  var id = mod.id;
  var filter, t, uri;
  // deprecated! do not use path config
  var subPath = mod.path;
  var packageInfo = mod.getPackage();
  // absolute module url
  if (!packageInfo) {
    if (!Utils.endsWith(id, '.css') && !Utils.endsWith(id, '.js')) {
      id += '.js';
    }
    return id;
  }
  var packageBase = packageInfo.getBase();
  var packageName = packageInfo.name;
  var extname = mod.getType();
  var suffix = '.' + extname;
  if (!subPath) {
    if (Utils.endsWith(id, suffix)) {
      id = id.slice(0, -suffix.length);
    }
    filter = packageInfo.getFilter() || '';
    if (typeof filter === 'function') {
      subPath = filter(id, extname);
    } else if (typeof filter === 'string') {
      if (filter) {
        filter = '-' + filter;
      }
      subPath = id + filter + suffix;
    }
  }
  if (id === packageName) {
    // packageName: a/y use('a/y');
    // do not use this on production, can not be combo ed with other modules from same package
    uri = packageBase.substring(0, packageBase.length - 1) + filter + suffix;
  } else {
    subPath = subPath.substring(packageName.length + 1);
    uri = packageBase + subPath;
  }

  if ((t = mod.getTag())) {
    t += suffix;
    uri += '?t=' + t;
  }
  return uri;
};

configFns.requires = shortcut('requires');

configFns.alias = shortcut('alias');

configFns.packages = function(config) {
  var packages = Config.packages;
  if (config === undefined) {
    return packages;
  }
  if (config) {
    Utils.each(config, function(cfg, key) {
      // object type
      var name = cfg.name || key;
      if (Utils.startsWith(name, '/')) {
        name = location.protocol + '//' + location.host + name;
      } else if (
        Utils.startsWith(name, './') ||
        Utils.startsWith(name, '../')
      ) {
        name = Utils.normalizePath(location.href, name);
      }
      if (Utils.endsWith(name, '/')) {
        name = name.slice(0, -1);
      }
      cfg.name = name;
      var base = cfg.base || cfg.path;
      if (base) {
        cfg.base = normalizePath(base, true);
      }
      if (packages[name]) {
        packages[name].reset(cfg);
      } else {
        packages[name] = new Package(cfg);
      }
    });
  }
};

configFns.modules = function(modules) {
  if (modules) {
    Utils.each(modules, function(modCfg, id) {
      var uri = modCfg.uri;
      if (uri) {
        modCfg.uri = normalizePath(uri);
      }
      Utils.createModule(id, modCfg);
    });
  }
};

function shortcut(attr) {
  return function(config) {
    var newCfg = {};
    for (var name in config) {
      newCfg[name] = {};
      newCfg[name][attr] = config[name];
    }
    mx.config('modules', newCfg);
  };
}

function normalizePath(base, isDirectory) {
  base = Utils.normalizeSlash(base);
  if (isDirectory && base.charAt(base.length - 1) !== '/') {
    base += '/';
  }
  if (location) {
    if (
      Utils.startsWith(base, 'http:') ||
      Utils.startsWith(base, '//') ||
      Utils.startsWith(base, 'https:') ||
      Utils.startsWith(base, 'file:')
    ) {
      return base;
    }
    base =
      location.protocol +
      '//' +
      location.host +
      Utils.normalizePath(location.pathname, base);
  }
  return base;
}
