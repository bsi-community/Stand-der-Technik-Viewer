import { createHash } from 'node:crypto';
import postcss from 'postcss';
import { format } from 'prettier';
/** Canonical formatting handles equivalent spacing/number notation; preserve cascade order. */
export async function styleSignature(css) {
  const canonical = await format(css, { parser: 'css', singleQuote: true, printWidth: 100 });
  function nodeValue(node) {
    if (node.type === 'comment') return null;
    return {
      type: node.type,
      ...(node.selector ? { selector: node.selector } : {}),
      ...(node.name ? { name: node.name, params: node.params } : {}),
      ...(node.prop
        ? { prop: node.prop, value: node.value, important: Boolean(node.important) }
        : {}),
      ...(node.nodes ? { nodes: node.nodes.map(nodeValue).filter(Boolean) } : {}),
    };
  }
  return createHash('sha256')
    .update(JSON.stringify(nodeValue(postcss.parse(canonical))))
    .digest('hex');
}
