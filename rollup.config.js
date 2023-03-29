import { terser } from 'rollup-plugin-terser'

export default {
  input: './wc-pagination.js',
  output: {
    file: 'dist/wc-pagination.min.js',
    format: 'iife',
    sourcemap: 'inline',
  },
  plugins: [
    terser()
  ],
}