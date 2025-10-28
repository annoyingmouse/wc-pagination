import { terser } from "rollup-plugin-terser";
import stripTemplateWhitespace from './plugins/stripTemplateWhitespace.js';

export default {
  input: "./wc-pagination.js",
  output: {
    file: "dist/wc-pagination.min.js",
    format: "iife",
    sourcemap: false,
  },
  plugins: [terser(), stripTemplateWhitespace({
    html: true,      // remove spaces between tags
    tightText: true, // also trim text-node edges for max compression
    // include: ['src/**'], // optional
    // exclude: ['**/*.test.*'], // optional
  })],
};
