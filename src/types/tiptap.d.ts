// Global Tiptap Module Augmentation
// This file extends Tiptap's core types to include custom commands
// for conditional blocks and spans. By placing this in a .d.ts file
// in the src/types directory, TypeScript should pick it up globally.

import '@tiptap/core';

declare module '@tiptap/core' {
  // Augment the Commands interface for direct commands (editor.commands.xyz)
  interface Commands<ReturnType> {
    // Conditional Span Commands
    setConditionalSpan: (attributes: { 'data-condition-expression': string }) => ReturnType;
    unsetConditionalSpan: () => ReturnType;
    toggleConditionalSpan: (attributes: { 'data-condition-expression': string }, options?: { extendEmptyMarkRange: boolean }) => ReturnType;
    
    // Conditional Block Commands
    setConditionalBlock: (attributes: { 'data-condition-expression': string }) => ReturnType;
    unsetConditionalBlock: () => ReturnType;
    toggleConditionalBlock: (attributes: { 'data-condition-expression': string }) => ReturnType;
    
    // Add other custom direct commands here if needed
  }

  // Augment the ChainedCommands interface for chainable commands (editor.chain().xyz().run())
  interface ChainedCommands {
    // Conditional Span Commands
    setConditionalSpan: (attributes: { 'data-condition-expression': string }) => ChainedCommands;
    unsetConditionalSpan: () => ChainedCommands;
    toggleConditionalSpan: (attributes: { 'data-condition-expression': string }, options?: { extendEmptyMarkRange: boolean }) => ChainedCommands;
    
    // Conditional Block Commands
    setConditionalBlock: (attributes: { 'data-condition-expression': string }) => ChainedCommands;
    unsetConditionalBlock: () => ChainedCommands;
    toggleConditionalBlock: (attributes: { 'data-condition-expression': string }) => ChainedCommands;
    
    // Add other custom chained commands here if needed
  }
}
