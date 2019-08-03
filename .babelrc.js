/* eslint-disable no-console */
console.log('Loaded .babelrc.js');

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
      },
    ]
  ]
};
