const stylelint = require('stylelint')
const parser = require("postcss-selector-parser")
const isStandardSyntaxRule = require('stylelint/lib/utils/isStandardSyntaxRule')
const ruleName = 'plugin/report-nesting-depth'
const messages =  stylelint.utils.ruleMessages(ruleName, {
  report: 'Generated report. node = map with depths per selector'
})
const isIgnoreAtRule = node => 
    node.type === "atrule"
const hasBlock = statement =>
    statement.nodes !== undefined

module.exports = stylelint.createPlugin(
  ruleName, 
  (actual) => (postcssRoot, postcssResult) => {
    const validOptions = stylelint.utils.validateOptions(postcssResult, ruleName, { actual });
    let nestingDepthMap = new Map();

    if (!validOptions) return;

    postcssRoot.walkRules(checkStatement);
    postcssRoot.walkAtRules(checkStatement);

    stylelint.utils.report({
      ruleName,
      result: postcssResult,
      node: nestingDepthMap,
      message: messages.report,
      line: 1
    });

    function checkStatement(statement) {
      if (isIgnoreAtRule(statement)) {
        return;
      }

      if (!hasBlock(statement)) {
        return;
      }

      if (statement.selector && !isStandardSyntaxRule(statement)) {
        return;
      }

      const ro = nestingDepth(statement);

      if(ro) nestingDepthMap.set(ro.selectorList, ro.level)
    }

    function nestingDepth(node, level, selectorList) {
      level = level || 0;
      selectorList = selectorList || node.selector
      const parent = node.parent;

      if (isIgnoreAtRule(parent)) {
        return null;
      }

      // The nesting depth level's computation has finished
      // when this function, recursively called, receives
      // a node that is not nested -- a direct child of the
      // root node
      if (
        parent.type === "root" ||
        (parent.type === "atrule" && parent.parent.type === "root")
      ) {
        return {level: level, selectorList: selectorList};
      }

      function containsPseudoClassesOnly(selector) {
        const normalized = parser().processSync(selector, { lossless: false });
        const selectors = normalized.split(",");

        return selectors.every(
          selector => selector.startsWith("&:") && selector[2] !== ":"
        );
      }

      if (
        (node.type === "atrule" &&
          node.every(child => child.type !== "decl")) ||
        (node.type === "rule" &&
          containsPseudoClassesOnly(node.selector))
      ) {
        if(selectorList.includes('&')) {
          selectorList = selectorList.replace(/&/, '')    
          selectorList = `${node.parent.selector}${selectorList}`
        } else {
          selectorList = `${node.parent.selector} ${selectorList}`
        }
        return nestingDepth(parent, level, selectorList);
      }

      // Unless any of the conditions above apply, we want to
      // add 1 to the nesting depth level and then check the parent,
      // continuing to add and move up the hierarchy
      // until we hit the root node

      // replace nesting operator to we get css3 selectors
      
      if(selectorList.includes('&')) {
        selectorList = selectorList.replace(/&/, '')
        selectorList = `${node.parent.selector}${selectorList}`
      } else {
        selectorList = `${node.parent.selector} ${selectorList}`
      }

      return nestingDepth(parent, level + 1, selectorList);
    }
  }
)

module.exports.ruleName = ruleName
module.exports.messages = messages