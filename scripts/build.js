const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const commands = [
  ['rm', ['-rf', 'build']],
  ['rollup', ['-c']],
  [
    'rollup',
    ['-c'],
    {
      env: { ...process.env, MINIFY: 'true' },
    },
  ],
  ['cp', ['src/import-style.js', 'build/']],
];

commands.every(c => {
  const options = { stdio: 'inherit', ...c[2] };
  console.log(c[0], ...c[1]);
  const ret = spawnSync(c[0], c[1], options);
  if (ret.error) {
    console.error(ret.error);
  }
  return !ret.status;
});

fs.writeFileSync(
  path.join(__dirname, '../build/modulex-nodejs.js'),
  `
  ${fs.readFileSync(path.join(__dirname, '../build/modulex-debug.js'))}
  
    ${fs.readFileSync(path.join(__dirname, '../src/nodejs.js'))}
  `,
);
