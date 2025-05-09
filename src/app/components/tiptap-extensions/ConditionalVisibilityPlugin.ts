import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Node } from '@tiptap/pm/model';
// Import the expression parser
import { Parser } from 'expr-eval';

export const conditionalVisibilityPluginKey = new PluginKey('conditionalVisibility');

// Enhanced evaluation function using expr-eval
function evaluateCondition(expression: string | null | undefined, context: Record<string, any>): boolean {
  if (!expression) {
    return true; // No expression means always visible
  }
  try {
    // Use expr-eval Parser
    const parser = new Parser();
    // Define allowed functions/constants if needed, e.g., parser.consts.PI = Math.PI;
    // Evaluate the expression with the provided context
    return !!parser.evaluate(expression, context); // Coerce result to boolean
  } catch (error) {
    console.error(`Error evaluating condition expression "${expression}":`, error);
    // Decide how to handle errors: fail open (show) or fail closed (hide)?
    // Failing open (showing) is generally safer during editing.
    return true; // Show content if evaluation fails
  }
}

export function ConditionalVisibilityPlugin(initialContextData: Record<string, any>) {
  let currentContextData = initialContextData;

  return new Plugin({
    key: conditionalVisibilityPluginKey,
    state: {
      init() { return { contextData: currentContextData }; },
      apply(tr, value) {
        // If context data changes via meta, update it (needs mechanism to pass updates)
        const newContext = tr.getMeta(conditionalVisibilityPluginKey);
        if (newContext) {
          currentContextData = newContext;
          return { ...value, contextData: newContext };
        }
        return value;
      }
    },
    props: {
      decorations(state) {
        const decorations: Decoration[] = [];

        // Find nodes and marks with the condition expression attribute
        state.doc.descendants((node, pos) => {
          const conditionExpression = node.attrs['data-condition-expression'];
          if (conditionExpression !== undefined && conditionExpression !== null) { // Check exists
            if (!evaluateCondition(conditionExpression, currentContextData)) {
              // Add a class to hide the node if condition is false
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, { class: 'conditional-hidden' })
              );
            }
          }

          // Check marks as well (spans) - iterate through marks on the node
          node.marks.forEach(mark => {
            const markConditionExpression = mark.attrs['data-condition-expression'];
            if (markConditionExpression !== undefined && markConditionExpression !== null) { // Check exists
              if (!evaluateCondition(markConditionExpression, currentContextData)) {
                // (Keep previous workaround logic for marks - hiding the node)
                if (!decorations.find(d => d.from === pos && d.to === pos + node.nodeSize)) {
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, { class: 'conditional-hidden' })
                  );
                }
              }
            }
          });
        });

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
}

export default ConditionalVisibilityPlugin;
