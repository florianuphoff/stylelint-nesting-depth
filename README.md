# stylelint-nesting-depth
This stylelint plugin reports the nesting depth per selector. It's used by the stylelint-code-quality-config to generate a visual dashboard.

Internally it uses the implementation of Stylelints 'max-nesting-depth' rule to iterate through rules and calculate the nesting depth.
