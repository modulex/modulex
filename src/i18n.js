/**
 * @ignore
 * i18n plugin for modulex loader
 * @author yiminghe@gmail.com
 */
import modulex from './modulex';

modulex.add('i18n', {
  alias(mx, id) {
    return id + '/i18n/' + mx.Config.lang;
  },
});
