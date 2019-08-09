/**
 * for modulex loader
 * @author yiminghe@gmail.com
 */
import mx from './modulex';

export var isArray =
  Array.isArray ||
  function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

var Env = mx.Env;
var host = Env.host;
var doc = host && host.document;

var URI_SPLIT_REG = new RegExp(
  '^' +
  /*
   Scheme names consist of a sequence of characters beginning with a
   letter and followed by any combination of letters, digits, plus
   ('+'), period ('.'), or hyphen ('-').
   */
  '([\\w\\d+.-]+:)?' + // protocol
  '(?://' +
  /*
   The authority component is preceded by a double slash ('//') and is
   terminated by the next slash ('/'), question mark ('?'), or number
   sign ('#') character, or by the end of the URI.
   */
  '(?:([^/?#@]*)@)?' + // auth
  '(' +
  '[\\w\\d\\-\\u0100-\\uffff.+%]*' +
  '|' +
  // ipv6
  '\\[[^\\]]+\\]' +
  ')' + // hostname - restrict to letters,
  // digits, dashes, dots, percent
  // escapes, and unicode characters.
  '(?::([0-9]+))?' + // port
  ')?' +
  /*
   The path is terminated
   by the first question mark ('?') or number sign ('#') character, or
   by the end of the URI.
   */
  '([^?#]+)?' + // pathname. hierarchical part
  /*
   The query component is indicated by the first question
   mark ('?') character and terminated by a number sign ('#') character
   or by the end of the URI.
   */
  '(\\?[^#]*)?' + // search. non-hierarchical data
  /*
   The hash identifier component of a URI allows indirect
   identification of a secondary resource by reference to a primary
   resource and additional identifying information.
   A
   hash identifier component is indicated by the presence of a
   number sign ('#') character and terminated by the end of the URI.
   */
  '(#.*)?' + // hash
    '$',
);

var REG_INFO = {
  protocol: 1,
  auth: 2,
  hostname: 3,
  port: 4,
  pathname: 5,
  search: 6,
  hash: 7,
};

function parseUrl(str) {
  var m = str.match(URI_SPLIT_REG) || [];
  var ret = {};

  // old ie 7:  return "" for unmatched regexp ...
  for (var part in REG_INFO) {
    ret[part] = m[REG_INFO[part]];
  }

  if (ret.hostname) {
    ret.hostname = ret.hostname.toLowerCase();
  }

  // mailto: yiminghe@gmail.com
  // http://www.g.cn
  // pathname => /
  if (ret.hostname && !ret.pathname) {
    ret.pathname = '/';
  }

  ret.host = ret.hostname;
  if (ret.port) {
    ret.host = ret.hostname + ':' + ret.port;
  }

  return ret;
}

function numberify(s) {
  var c = 0;
  // convert '1.2.3.4' to 1.234
  return parseFloat(
    s.replace(/\./g, function() {
      return c++ === 0 ? '.' : '';
    }),
  );
}

function splitSlash(str) {
  var parts = str.split(/\//);
  if (str.charAt(0) === '/' && parts[0]) {
    parts.unshift('');
  }
  if (
    str.charAt(str.length - 1) === '/' &&
    str.length > 1 &&
    parts[parts.length - 1]
  ) {
    parts.push('');
  }
  return parts;
}

var m, v;
var ua = ((host && host.navigator) || {}).userAgent || '';
export const UA = {};

// AppleWebKit/535.19
// AppleWebKit534.30
// appleWebKit/534.30
// ApplelWebkit/534.30 （SAMSUNG-GT-S6818）
// AndroidWebkit/534.30
if (
  ((m = ua.match(/Web[Kk]it[\/]{0,1}([\d.]*)/)) ||
    (m = ua.match(/Safari[\/]{0,1}([\d.]*)/))) &&
  m[1]
) {
  UA.webkit = numberify(m[1]);
}
if ((m = ua.match(/Trident\/([\d.]*)/))) {
  UA.trident = numberify(m[1]);
}
if ((m = ua.match(/Gecko/))) {
  UA.gecko = 0.1; // Gecko detected, look for revision
  if ((m = ua.match(/rv:([\d.]*)/)) && m[1]) {
    UA.gecko = numberify(m[1]);
  }
}
if (
  (m = ua.match(/MSIE ([^;]*)|Trident.*; rv(?:\s|:)?([0-9.]+)/)) &&
  (v = m[1] || m[2])
) {
  UA.ie = numberify(v);
  UA.ieMode = doc.documentMode || UA.ie;
  UA.trident = UA.trident || 1;
}

var uriReg = /http(s)?:\/\/([^/]+)(?::(\d+))?/;
var commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/gm;
var requireRegExp = /[^.'"]\s*require\s*\(\s*(['"])([^)]+)\1\s*\)/g;

export function each(obj, fn) {
  var i = 0;
  var myKeys, l;
  if (isArray(obj)) {
    l = obj.length;
    for (; i < l; i++) {
      if (fn(obj[i], i, obj) === false) {
        break;
      }
    }
  } else {
    myKeys = keys(obj);
    l = myKeys.length;
    for (; i < l; i++) {
      if (fn(obj[myKeys[i]], myKeys[i], obj) === false) {
        break;
      }
    }
  }
}

export function keys(obj) {
  var ret = [];
  for (var key in obj) {
    ret.push(key);
  }
  return ret;
}

export function mix(to, from) {
  for (var i in from) {
    to[i] = from[i];
  }
  return to;
}

export function getSuffix(str) {
  var m = str.match(/\.(\w+)$/);
  if (m) {
    return m[1];
  }
}

export function noop() {}

export const map = Array.prototype.map
  ? function(arr, fn, context) {
      return Array.prototype.map.call(arr, fn, context || this);
    }
  : function(arr, fn, context) {
      var len = arr.length;
      var res = new Array(len);
      for (var i = 0; i < len; i++) {
        var el = typeof arr === 'string' ? arr.charAt(i) : arr[i];
        if (
          el ||
          //ie<9 in invalid when typeof arr == string
          i in arr
        ) {
          res[i] = fn.call(context || this, el, i, arr);
        }
      }
      return res;
    };

export function startsWith(str, prefix) {
  return str.lastIndexOf(prefix, 0) === 0;
}

export function isEmptyObject(o) {
  for (var p in o) {
    if (p !== undefined) {
      return false;
    }
  }
  return true;
}

export function endsWith(str, suffix) {
  var ind = str.length - suffix.length;
  return ind >= 0 && str.indexOf(suffix, ind) === ind;
}

export const now =
  Date.now ||
  function() {
    return +new Date();
  };

export function indexOf(item, arr) {
  for (var i = 0, l = arr.length; i < l; i++) {
    if (arr[i] === item) {
      return i;
    }
  }
  return -1;
}

export function normalizeSlash(str) {
  return str.replace(/\\/g, '/');
}

export function startsWithProtocol(str) {
  return (
    startsWith(str, 'http:') ||
    startsWith(str, 'https:') ||
    startsWith(str, 'file:')
  );
}

export function normalizePath(parentPath, subPath) {
  var firstChar = subPath.charAt(0);
  if (firstChar !== '.') {
    return subPath;
  }
  var prefix = '';
  if (startsWithProtocol(parentPath)) {
    var url = parseUrl(parentPath);
    prefix = url.protocol + '//' + url.host;
    parentPath = url.pathname;
  }
  var parts = splitSlash(parentPath);
  var subParts = splitSlash(subPath);
  parts.pop();
  for (var i = 0, l = subParts.length; i < l; i++) {
    var subPart = subParts[i];
    if (subPart === '.') {
    } else if (subPart === '..') {
      parts.pop();
    } else {
      parts.push(subPart);
    }
  }
  return prefix + parts.join('/').replace(/\/+/, '/');
}

export function isSameOriginAs(uri1, uri2) {
  var uriParts1 = uri1.match(uriReg);
  var uriParts2 = uri2.match(uriReg);
  return uriParts1[0] === uriParts2[0];
}

// get document head
export function docHead() {
  return doc.getElementsByTagName('head')[0] || doc.documentElement;
}

// Returns hash code of a string djb2 algorithm
export function getHash(str) {
  var hash = 5381;
  var i;
  for (i = str.length; --i > -1; ) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    /* hash * 33 + char */
  }
  return hash + '';
}

export function getRequiresFromFn(fn) {
  var requires = [];
  // Remove comments from the callback string,
  // look for require calls, and pull them into the dependencies,
  // but only if there are function args.
  fn.toString()
    .replace(commentRegExp, '')
    .replace(requireRegExp, function(match, _, dep) {
      requires.push(dep);
    });
  return requires;
}
