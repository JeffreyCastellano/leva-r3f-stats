// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import terser from '@rollup/plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf8')
);

const isAnalyze = process.env.ANALYZE === 'true';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      compact: true,
    },
    {
      file: packageJson.module,
      format: 'esm',
      sourcemap: true,
      compact: true,
    },
  ],
  external: [
    'react',
    'react-dom',
    '@react-three/fiber',
    'three',
    'leva',
    'leva/plugin',
  ],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    unknownGlobalSideEffects: false,
    correctVarValueBeforeDeclaration: false,
    tryCatchDeoptimization: false,
    preset: 'recommended',
    manualPureFunctions: [
      'console.debug',
      'console.log',
      'console.warn',
      'console.info'
    ],
  },
  plugins: [
    peerDepsExternal(),
    resolve({
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      preferBuiltins: false,
      browser: true,
    }),
    commonjs({
      transformMixedEsModules: true,
    }),
    typescript({ 
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      exclude: ['**/*.stories.tsx', '**/*.test.ts', '**/*.test.tsx'],
    }),
    babel({
      babelHelpers: 'bundled',
      presets: [
        ['@babel/preset-env', {
          targets: {
            esmodules: true,
          },
          bugfixes: true,
          loose: true,
        }],
        '@babel/preset-react',
        '@babel/preset-typescript'
      ],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      exclude: 'node_modules/**',
    }),
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
        ecma: 2015,
        passes: 3,
        pure_funcs: [
          'console.debug',
          'console.log', 
          'console.info',
          'console.warn',
        ],
        pure_getters: true,
        unsafe: true,
        unsafe_arrows: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_symbols: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        unused: true,
        dead_code: true,
        collapse_vars: true,
        reduce_vars: true,
        keep_fargs: false,
        hoist_funs: true,
        hoist_props: true,
        side_effects: false,
        loops: true,
        if_return: true,
        inline: true,
        conditionals: true,
        comparisons: true,
        booleans: true,
        typeofs: true,
        join_vars: true,
        sequences: true,
        properties: true,
        evaluate: true,
        negate_iife: true,
        reduce_funcs: false,
        keep_classnames: false,
        module: true,
        global_defs: {
          __DEV__: false,
          'process.env.NODE_ENV': JSON.stringify('production'),
        },
      },
      mangle: {
        eval: true,
        module: true,
        toplevel: true,
        safari10: true,
        properties: {
          regex: /^_/,
          reserved: [
            // Keep public API names
            'useStatsPanel',
            'stats',
            'statsPlugin',
            'StatsOptions',
            'StatsData',
            // Keep important internals that might be accessed
            'fps',
            'ms',
            'memory',
            'gpu',
            'cpu',
            'compute',
            'triangles',
            'drawCalls',
            'vsync',
          ]
        },
      },
      format: {
        comments: false,
        ecma: 2015,
        ascii_only: true,
        wrap_func_args: false,
      },
      module: true,
      toplevel: true,
      nameCache: {},
    }),
    isAnalyze && visualizer({
      filename: 'bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ].filter(Boolean),
};