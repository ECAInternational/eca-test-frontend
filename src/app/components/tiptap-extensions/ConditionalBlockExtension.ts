import { Node, mergeAttributes } from '@tiptap/core';
import { ConditionalVisibilityPlugin } from './ConditionalVisibilityPlugin'; 

export interface ConditionalBlockOptions {
  HTMLAttributes: Record<string, any>;
  contextData: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    conditionalBlock: {
      /**
       * Set a conditional block node
       */
      setConditionalBlock: (attributes: { 'data-condition-expression': string }) => ReturnType;
      /**
       * Unset a conditional block node (turn back to paragraph)
       */
      unsetConditionalBlock: () => ReturnType;
    };
  }
}

export const ConditionalBlock = Node.create<ConditionalBlockOptions>({
  name: 'conditionalBlock',
  group: 'block',
  content: 'inline*',
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {}, // Initialize HTMLAttributes
      contextData: {},
    };
  },

  addAttributes() {
    return {
      'data-condition-expression': {
        default: null,
        parseHTML: element => element.getAttribute('data-condition-expression'),
        renderHTML: attributes => {
          if (!attributes['data-condition-expression']) {
            return {};
          }
          return { 'data-condition-expression': attributes['data-condition-expression'] };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-condition-expression]',
        //priority: 51, // Might need to adjust priority if conflicts with other block nodes
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Use a div to represent the block
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setConditionalBlock: (attributes) => ({ commands }) => {
        // Expression is now passed directly in attributes
        if (!attributes || !attributes['data-condition-expression']) {
          console.error('setConditionalBlock command called without expression attribute.');
          return false;
        }
        return commands.setNode(this.name, attributes);
      },
      unsetConditionalBlock: () => ({ commands }) => {
        // Logic to reset the node type might be needed depending on desired UX
        // For now, just removing the attribute might suffice if the node 
        // remains a 'conditionalBlock' but without a condition.
        // return commands.updateAttributes(this.name, { 'data-condition-expression': null });
        // Attempt to set back to paragraph (might have issues)
        return commands.setNode('paragraph'); // Try setting back to paragraph
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      ConditionalVisibilityPlugin(this.options.contextData), // Pass context data
    ];
  },
});

export default ConditionalBlock;
