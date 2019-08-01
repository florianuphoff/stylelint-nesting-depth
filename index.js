const stylelint = require('stylelint')
const parser = require("postcss-selector-parser")
const isStandardSyntaxRule = require('stylelint/lib/utils/isStandardSyntaxRule')
const optionsMatches = require('stylelint/lib/utils/optionsMatches')
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

    console.log(nestingDepthMap)

    stylelint.utils.report({
      ruleName,
      postcssResult,
      node: nestingDepthMap,
      message: messages.report
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

      const depth = nestingDepth(statement);

      nestingDepthMap.set(statement.selector, depth)
    }

    function nestingDepth(node, level) {
      level = level || 0;
      const parent = node.parent;

      if (isIgnoreAtRule(parent)) {
        return 0;
      }

      // The nesting depth level's computation has finished
      // when this function, recursively called, receives
      // a node that is not nested -- a direct child of the
      // root node
      if (
        parent.type === "root" ||
        (parent.type === "atrule" && parent.parent.type === "root")
      ) {
        return level;
      }

      function containsPseudoClassesOnly(selector) {
        const normalized = parser().processSync(selector, { lossless: false });
        const selectors = normalized.split(",");

        return selectors.every(
          selector => selector.startsWith("&:") && selector[2] !== ":"
        );
      }

      if (
        (optionsMatches(options, "ignore", "blockless-at-rules") &&
          node.type === "atrule" &&
          node.every(child => child.type !== "decl")) ||
        (optionsMatches(options, "ignore", "pseudo-classes") &&
          node.type === "rule" &&
          containsPseudoClassesOnly(node.selector))
      ) {
        return nestingDepth(parent, level);
      }

      // Unless any of the conditions above apply, we want to
      // add 1 to the nesting depth level and then check the parent,
      // continuing to add and move up the hierarchy
      // until we hit the root node
      return nestingDepth(parent, level + 1);
    }
  }
)

module.exports.ruleName = ruleName
module.exports.messages = messages