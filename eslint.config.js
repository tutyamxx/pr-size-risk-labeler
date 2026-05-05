import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import jest from 'eslint-plugin-jest';

export default [
    {
        ignores: ['node_modules/', 'dist/', 'action-dist/', '.github/', '*.config.js']
    },
    js.configs.recommended,
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,
    {
        languageOptions: {
            globals: {
                ...globals.node
            },
            parserOptions: {
                ecmaVersion: 2024,
                sourceType: 'module'
            }
        },
        rules: {
            // --| Spacing & formatting
            'arrow-spacing': 'error',
            'array-bracket-spacing': ['error', 'never'],
            'arrow-body-style': ['error', 'as-needed'],
            'space-in-parens': ['error', 'never'],
            'brace-style': ['error', '1tbs'],
            indent: ['error', 4, { SwitchCase: 1 }],
            'comma-spacing': ['error', { before: false, after: true }],
            'computed-property-spacing': ['error', 'never'],
            'comma-dangle': ['error', { arrays: 'never', objects: 'never', imports: 'never', exports: 'never', functions: 'never' }],
            'space-before-function-paren': ['error', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],
            'switch-colon-spacing': ['error', { after: true, before: false }],
            'space-before-blocks': ['error', 'always'],
            'keyword-spacing': ['error', { before: true, after: true }],
            'space-unary-ops': [2, { words: true, nonwords: false, overrides: { new: false, '++': false } }],
            'space-infix-ops': 'error',
            'no-trailing-spaces': 'error',
            'no-multi-spaces': ['error', { ignoreEOLComments: true }],
            'no-mixed-spaces-and-tabs': 'error',
            'object-curly-spacing': ['error', 'always'],
            'key-spacing': ['error', { beforeColon: false, afterColon: true }],
            'no-whitespace-before-property': 'error',
            'template-curly-spacing': ['error', 'never'],
            'eol-last': ['error', 'always'],

            // --| Naming conventions
            camelcase: [
                'error',
                {
                    properties: 'never',
                    ignoreDestructuring: false,
                    ignoreImports: true,
                    ignoreGlobals: false
                }
            ],
            'capitalized-comments': ['error', 'always'],
            'spaced-comment': ['error', 'always', { markers: ['/'] }],
            'no-underscore-dangle': ['error', { allow: ['_id', '_Id'] }],
            'new-cap': ['error', { capIsNewExceptions: ['Router'] }],
            'func-name-matching': 'error',

            // --| Variables & scope
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ],
            'no-undef': ['error', { typeof: true }],
            'no-undefined': 'error',
            'no-use-before-define': 'error',
            'no-shadow': ['error', { builtinGlobals: true, hoist: 'functions', allow: ['editor', 'course'], ignoreOnInitialization: false }],
            'no-shadow-restricted-names': 'error',
            'no-label-var': 'error',
            'block-scoped-var': 'error',
            'one-var-declaration-per-line': ['error', 'always'],
            'vars-on-top': 'error',
            'no-var': 'error',
            'prefer-const': ['error', { destructuring: 'any', ignoreReadBeforeAssign: false }],

            // --| Control flow
            'default-case': 'error',
            'default-case-last': 'error',
            'no-duplicate-case': 'error',
            'default-param-last': ['error'],
            'no-labels': 'error',
            'no-label-var': 'error',
            'no-lone-blocks': 'error',
            'no-loop-func': 'error',
            'no-unreachable-loop': 'error',
            'switch-colon-spacing': ['error', { after: true, before: false }],
            'newline-before-return': 'error',
            'nonblock-statement-body-position': ['error', 'beside'],

            // --| Strings & templates
            quotes: ['error', 'single'],
            semi: ['error', 'always'],
            'linebreak-style': ['error', 'unix'],
            'prefer-template': 'error',
            'no-template-curly-in-string': 'error',
            'no-useless-concat': 'error',
            'no-useless-call': 'error',
            'no-useless-computed-key': 'error',
            'no-useless-rename': ['error', { ignoreDestructuring: false, ignoreImport: false, ignoreExport: false }],
            'no-useless-return': 'error',
            'no-useless-catch': 'error',

            // --| Functions
            'func-call-spacing': ['error', 'never'],
            'function-call-argument-newline': ['error', 'consistent'],
            'grouped-accessor-pairs': ['error', 'getBeforeSet'],
            'func-names': 'off',
            'class-methods-use-this': 'off',

            // --| Objects & properties
            'object-shorthand': ['error', 'always', { avoidQuotes: true, ignoreConstructors: true }],
            'dot-location': ['error', 'property'],
            'no-new-object': 'error',
            'no-array-constructor': 'error',

            // --| Dangerous patterns
            'no-console': 'error',
            'no-alert': 'error',
            'no-caller': 'error',
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-script-url': 'error',
            'no-extend-native': 'error',
            'no-extra-bind': 'error',
            'no-new-func': 'error',
            'no-new-wrappers': 'error',
            'no-with': 'error',
            'no-proto': 'error',
            'no-void': ['error', { allowAsStatement: true }],
            'no-throw-literal': 'error',
            'no-compare-neg-zero': 'error',
            'no-return-await': 'error',

            // --| Type & equality
            eqeqeq: ['error', 'smart'],
            'use-isnan': 'error',
            'no-self-compare': 'error',
            'no-unneeded-ternary': ['error', { defaultAssignment: false }],
            yoda: ['error', 'never', { exceptRange: true }],
            radix: ['error', 'as-needed'],

            // --| Declarations & definitions
            'no-dupe-args': 'error',
            'no-dupe-class-members': 'error',
            'no-dupe-keys': 'error',
            'no-duplicate-imports': 'error',
            'no-class-assign': 'error',
            'no-const-assign': 'error',
            'no-delete-var': 'error',
            'no-global-assign': 'error',
            'no-param-reassign': 'off',
            'no-new': 'error',
            'no-new-symbol': 'error',
            'no-constructor-return': 'error',
            'no-empty-static-block': 'error',

            // --| Syntax & regex
            'no-invalid-this': ['error', { capIsConstructor: true }],
            'no-octal': 'error',
            'no-octal-escape': 'error',
            'no-floating-decimal': 'error',
            'no-iterator': 'error',
            'no-sequences': 'error',
            'no-obj-calls': 'error',
            'no-ex-assign': 'error',
            'no-constant-condition': 'error',
            'no-empty-character-class': 'error',
            'no-sparse-arrays': 'error',
            'no-case-declarations': 'error',
            'no-setter-return': 'error',
            'no-unsafe-finally': 'error',
            'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],

            // --| Style preferences
            'max-len': ['error', { code: 180, comments: 220, ignoreStrings: true, ignoreTemplateLiterals: false, ignoreUrls: false }],
            'max-depth': ['error', 4],
            'max-classes-per-file': ['error', { ignoreExpressions: true, max: 1 }],
            'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
            'padded-blocks': ['error', 'never'],
            'implicit-arrow-linebreak': ['error', 'beside'],

            // --| Best practices
            'guard-for-in': 'error',
            'no-lonely-if': 'error',
            'no-self-compare': 'error',
            'prefer-exponentiation-operator': 'error',
            'prefer-spread': 'error',
            'rest-spread-spacing': ['error', 'never'],
            'unicode-bom': ['error', 'never'],
            'wrap-iife': 'error',
            'yield-star-spacing': ['error', 'before'],
            'no-unused-labels': 'error'
        }
    },
    {
        files: ['**/*.test.ts', '**/*.spec.ts'],
        languageOptions: {
            globals: {
                ...globals.jest
            }
        },
        plugins: {
            jest
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            'jest/expect-expect': 'error'
        }
    }
];
