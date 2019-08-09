const fs = require('fs');
const path = require('path');
const spawn = require('cross-spawn');

const commands = [
  ['rm', ['-rf', 'build']],
  ['rollup', ['-c']],
  ['MINIFY=true rollup', ['-c']],
  ['cp', ['src/import-style.js', 'build/']],
];

commands.every(c => {
  console.log(c[0], ...c[1]);
  const ret = spawn.sync(c[0], c[1], { stdio: 'inherit' });
  return c[2] || !ret.status;
});

fs.writeFileSync(
  path.join(__dirname, '../build/modulex-nodejs.js'),
  `
  ${fs.readFileSync(path.join(__dirname, '../build/modulex-debug.js'))}
  
    ${fs.readFileSync(path.join(__dirname, '../src/nodejs.js'))}
  `,
);
