import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      'browser/index': 'src/browser/index.ts',
      'index': 'src/index.ts',
    },
    format: ['esm', 'cjs', 'iife'],
    dts: true,
    splitting: false,
    clean: true,
    minify: true,
    treeshake: true,
    globalName: 'Xldx',
    platform: 'browser',
    target: 'es2020',
    esbuildOptions(options) {
      options.conditions = ['browser', 'import', 'module', 'default'];
      options.mainFields = ['browser', 'module', 'main'];
      options.define = {
        'process.env.NODE_ENV': '"production"',
        'global': 'globalThis',
      };
    },
  },
  {
    entry: {
      'server/index': 'src/server/index.ts'
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    clean: false,
    minify: true,
    treeshake: true,
    platform: 'node',
    target: 'node18',
    external: ['fs', 'fs/promises', 'buffer'],
  }
]);