define('test5/a', function() {
  return 'test5/a';
}, {
  // 强制不继承显示定义的
  // mx.config('modules',{ "test5/a":{requires:["test5/b"]} });
  requires: [],
});
