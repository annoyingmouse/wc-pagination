// plugins/stripTemplateWhitespace.js
import { createFilter } from '@rollup/pluginutils';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';

/**
 * Rollup plugin to compress whitespace inside template literals.
 *
 * Options:
 * - include / exclude: rollup plugin filter globs
 * - html: remove spaces between HTML tags (/> </ -> '><')
 * - tightText: also trim spaces around text nodes (e.g. <p> Hello </p> -> <p>Hello</p>)
 */
export default function stripTemplateWhitespace(options = {}) {
  const {
    include = ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
    exclude,
    html = true,
    tightText = false,
  } = options;

  const filter = createFilter(include, exclude);

  const compress = (s) => {
    let out = s;

    // 1) remove newlines and surrounding indentation/space
    out = out.replace(/\s*\n\s*/g, '');

    // 2) collapse multiple spaces
    out = out.replace(/\s{2,}/g, ' ');

    if (html) {
      // 3) remove inter-tag gaps: <div>   <span> -> <div><span>
      out = out.replace(/>\s+</g, '><');
      if (tightText) {
        // 4) trim spaces right inside tags around text nodes
        //    <p>  Hello  </p> -> <p>Hello</p>
        out = out.replace(/>\s+([^<]*?)\s+</g, '>$1<');
      }
    }

    // 5) final trim (keeps content inside backticks clean)
    return out.trim();
  };

  return {
    name: 'strip-template-whitespace',

    transform(code, id) {
      if (!filter(id)) return null;

      let ast;
      try {
        ast = parse(code, {
          sourceType: 'unambiguous',
          sourceFilename: id,
          plugins: [
            'jsx',
            'typescript',
            // add more if you use them: 'decorators', 'classProperties', etc.
          ],
        });
      } catch (e) {
        this.warn(`[strip-template-whitespace] Parse skipped for ${id}: ${e.message}`);
        return null;
      }

      let changed = false;

      traverse(ast, {
        TemplateLiteral(path) {
          // Only modify the raw text chunks (quasis), never the ${...} expressions
          const { quasis } = path.node;
          let localChange = false;

          for (const q of quasis) {
            const beforeRaw = q.value.raw;
            const beforeCooked = q.value.cooked;

            const afterRaw = compress(beforeRaw);
            const afterCooked =
              typeof beforeCooked === 'string' ? compress(beforeCooked) : afterRaw;

            if (afterRaw !== beforeRaw || afterCooked !== beforeCooked) {
              q.value.raw = afterRaw;
              q.value.cooked = afterCooked;
              localChange = true;
            }
          }

          if (localChange) changed = true;
        },
      });

      if (!changed) return null;

      const output = generate(ast, {
        sourceMaps: true,
        sourceFileName: id,
        // retain lines not needed; generator will keep code compact enough
      });

      return {
        code: output.code,
        map: output.map,
      };
    },
  };
}
