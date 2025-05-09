import { Mark, mergeAttributes } from '@tiptap/core';
import { ConditionalVisibilityPlugin } from './ConditionalVisibilityPlugin';

// Manually add HTMLAttributes
export interface ConditionalSpanOptions {
  HTMLAttributes: Record<string, any>;
  contextData: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    conditionalSpan: {
      /**
       * Set a conditional span mark
       */
      setConditionalSpan: (attributes: { 'data-condition-expression': string }) => ReturnType;
      /**
       * Unset a conditional span mark
       */
      unsetConditionalSpan: () => ReturnType;
    };
  }
}

export const ConditionalSpan = Mark.create<ConditionalSpanOptions>({
  name: 'conditionalSpan',

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
        tag: 'span[data-condition-expression]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Ensure conditional attributes are included
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setConditionalSpan: (attributes) => ({ commands }) => {
        // Expression is now passed directly in attributes
        if (!attributes || !attributes['data-condition-expression']) {
          console.error('setConditionalSpan command called without expression attribute.');
          return false;
        }
        return commands.setMark(this.name, attributes);
      },
      unsetConditionalSpan: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  }
});

export default ConditionalSpan;
