const testRule = require('stylelint-test-rule-tape');
const plugin = require('..');
const depthMap = new Map();
depthMap.set('a', 0);
depthMap.set('#id4 .c4 .c5', 2);
depthMap.set('#id4 .c4 .c5 ~ .list__item', 3);
depthMap.set('a .awd', 1);
depthMap.set('#id4 .c4 .c5 ~ .list__item .list__link:hover', 4);

// Test are failing

testRule(plugin.rule, {
  ruleName: plugin.ruleName,
  config: [true],

  reject: [
    {
      code: '.a{margin:2em;} #id4{ .c4 { .c5 { margin:0; } } } #id4{ .c4 { .c5 { ~.list__item { margin:0; } } } } a{ .awd { margin:0; } } #id4{ .c4 { .c5 { ~.list__item { &:hover { margin:0; } } } } }',
      description: 'Generated report. node = map with depths per selector',
      message: plugin.messages.report
    }
 ]
});