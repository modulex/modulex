import mx from './modulex';
import { mix } from './utils';

var Config = mx.Config;

function checkGlobalIfNotExist(self, property) {
  return self[property] !== undefined ? self[property] : Config[property];
}

/**
 * @class modulex.Loader.Package
 * @private
 */
function Package(cfg) {
  var self = this;
  /**
   * name of package
   */
  self.name = undefined;
  /**
   * package base of package
   */
  self.base = undefined;
  /**
   * package entry module
   */
  self.main = undefined;
  /**
   * filter for package's modules
   */
  self.filter = undefined;
  /**
   * tag for package's modules
   */
  self.tag = undefined;
  /**
   * charset for package's modules
   */
  self.charset = undefined;
  /**
   * whether combine package's modules
   */
  self.combine = undefined;
  /**
   * combine modules in packages within the same group if combine is true
   */
  self.group = undefined;
  mix(self, cfg);
}

Package.prototype = {
  constructor: Package,

  reset(cfg) {
    mix(this, cfg);
  },

  getFilter() {
    return checkGlobalIfNotExist(this, 'filter');
  },

  /**
   * Tag for package.
   * tag can not contain ".", eg: Math.random() !
   * @return {String}
   */
  getTag() {
    return checkGlobalIfNotExist(this, 'tag');
  },

  /**
   * get package uri
   */
  getBase() {
    return this.base;
  },

  /**
   * Get charset for package.
   * @return {String}
   */
  getCharset() {
    return checkGlobalIfNotExist(this, 'charset');
  },

  /**
   * Whether modules are combined for this package.
   * @return {Boolean}
   */
  isCombine() {
    return checkGlobalIfNotExist(this, 'combine');
  },

  /**
   * Get package group (for combo).
   * @returns {String}
   */
  getGroup() {
    return checkGlobalIfNotExist(this, 'group');
  },
};

export default Package;
