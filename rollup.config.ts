import { defineConfig } from 'rollup';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import clear from 'rollup-plugin-clear';
import { parse } from 'path';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    chunkFileNames: '[name].js',
    manualChunks(id){
      if (id.includes('node_modules')) {
        return 'vendor';
      }
      if(id.includes('release-pkg')) {
        return parse(id).name;
      }
    },
  },

  plugins: [
    nodeResolve(),
    commonjs(),
    clear({ targets: ['dist'] }),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
  ]
});