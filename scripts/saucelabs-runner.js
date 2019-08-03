require('saucelabs-runner')({
  browsers: [
    {browserName: 'internet explorer', version: 10},
    {browserName: 'internet explorer', version: 11},
    {browserName: 'chrome'},
    {browserName: 'firefox'},
    {browserName: 'internet explorer', version: 8},
    {browserName: 'internet explorer', version: 9}
  ]
}).fin(function () {
  setTimeout(function () {
    process.exit(0);
  }, 1000);
});
