import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import { uglify } from 'rollup-plugin-uglify';
import p from './package.json';

const MINIFY = !!process.env.MINIFY;

const config = {
  input: 'src/index.js',
  output: {
    file: `build/modulex${MINIFY ? '' : '-debug'}.js`,
    format: 'iife',
    name: 'modulex',
  },
  plugins: [
    replace({
      values: {
        __TIMESTAMP__: JSON.stringify(new Date() + ''),
        __DEV__: !MINIFY,
        __VERSION__: JSON.stringify(p.version + ''),
      },
    }),
    babel({
      exclude: 'node_modules/**',
    }),
    ...(MINIFY ? [uglify()] : []),
  ],
};

if (MINIFY) {
}

export default config;
