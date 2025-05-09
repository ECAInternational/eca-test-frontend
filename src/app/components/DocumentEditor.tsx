import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import React from 'react';

// Import the new extensions
import ConditionalSpan from './tiptap-extensions/ConditionalSpanExtension';
import ConditionalBlock from './tiptap-extensions/ConditionalBlockExtension';
import { conditionalVisibilityPluginKey } from './tiptap-extensions/ConditionalVisibilityPlugin';

// Custom extension for handling variables (keep this for variable styling)
const CustomVariable = Extension.create({
  name: 'customVariable',

  addProseMirrorPlugins() {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    
    return [
      new Plugin({
        key: new PluginKey('customVariable'),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const doc = state.doc;

            doc.descendants((node, pos) => {
              if (node.isText) {
                let match;
                while ((match = variableRegex.exec(node.text!)) !== null) {
                  const start = pos + match.index;
                  const end = start + match[0].length;
                  
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'variable-placeholder',
                      'data-variable': match[1].trim(),
                    })
                  );
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});

interface DocumentEditorProps {
  content: string;
  isPreview: boolean;
  variables: {
    systemVariables: Array<{
      variableId: string;
      variableName: string;
      variableLabel: string;
    }>;
    tenantVariables: Array<{
      variableId: string;
      variableName: string;
      variableLabel: string;
    }>;
    previewData?: Record<string, string>;
  };
  onUpdate?: (content: string) => void;
  onEditorReady?: (editor: Editor | null) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  content,
  isPreview,
  variables,
  onUpdate,
  onEditorReady,
}) => {
  // Determine the context data for conditional extensions
  const conditionalContext = React.useMemo(() => variables.previewData || {}, [variables.previewData]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2]
        }
      }),
      Underline,
      CustomVariable, // Keep for variable styling
      // Add and configure conditional extensions
      ConditionalSpan.configure({
        contextData: conditionalContext,
      }),
      ConditionalBlock.configure({
        contextData: conditionalContext,
      }),
    ],
    content,
    editable: !isPreview,
    immediatelyRender: false, 
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log('Editor content updated:', { html });
      onUpdate?.(html);
    },
  });

  React.useEffect(() => {
    if (editor) {
      onEditorReady?.(editor);
    }
  }, [editor, onEditorReady]);

  // Effect to update context data in the plugin when previewData changes
  React.useEffect(() => {
    if (editor && editor.isEditable) { 
      const newContext = variables.previewData || {};
      // Send the new context to the plugin via a transaction meta property
      const { tr } = editor.state;
      tr.setMeta(conditionalVisibilityPluginKey, newContext);
      if (tr.docChanged || tr.storedMarksSet || tr.getMeta('forceUpdateContext') ) {
          // Only dispatch if there are other changes or we force it
          // Avoid dispatching empty transactions just for context update 
          // unless explicitly needed, as it can affect performance/history.
          // NOTE: This simple check might not be sufficient for all cases.
          // Consider if context changes *alone* should trigger a view update.
          editor.view.dispatch(tr); 
      } else {
          // If no other changes, we might manually trigger a decoration update
          // This is a bit more advanced and might not be needed initially.
          // For now, context updates apply on the *next* transaction.
          console.log('Context updated, will apply on next transaction.');
      }
    }
  }, [editor, variables.previewData]); 


  return (
    <div className={`bg-neutral-layer-2 eca-dark:bg-neutral-layer-3 border-controls-lines-paler eca-dark:border-controls-lines me-3 flex flex-col gap-6 border p-10 ${isPreview ? 'preview-mode' : 'edit-mode'}`}>
      <div className="h-32 w-32">
        <img src="/prototype/ageas-logo.svg" alt="Assignment Letter Logo" className="h-full w-full" />
      </div>
      <div className="border-controls-lines-paler eca-dark:border-controls-lines flex flex-col gap-6 border-b py-4">
        <div className="prose max-w-none [&_*]:text-neutral-content-default">
          <style>
            {`
              .preview-mode .ProseMirror {
                outline: none;
              }
              .ProseMirror {
                outline: 2px solid transparent;
                outline-offset: 2px;
                min-height: 200px;
              }
              .ProseMirror:focus {
                outline: 2px solid var(--color-primary-main);
                outline-offset: 2px;
              }
            `}
          </style>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
