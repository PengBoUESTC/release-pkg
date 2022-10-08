import { defineConfig } from 'rollup';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import clear from 'rollup-plugin-clear';
import { terser } from 'rollup-plugin-terser';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    manualChunks(id){
      if (id.includes('node_modules')) {
        return 'vendor';
      }
    },
  },

  plugins: [
    clear({ targets: ['dist'] }),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
    nodeResolve(),
    commonjs(),
    terser(),
  ]
});