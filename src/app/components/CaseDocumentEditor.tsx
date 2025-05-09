import React, { useMemo, useEffect } from 'react';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// Custom extension for handling variables
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

interface CaseDocumentEditorProps {
  content: string;
  isPreview: boolean;
  variables: {
    caseData: Record<string, string>;
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
  };
  onUpdate: (content: string) => void;
  onEditorReady: (editor: Editor | null) => void;
}

const CaseDocumentEditor: React.FC<CaseDocumentEditorProps> = ({
  content,
  isPreview,
  variables,
  onUpdate,
  onEditorReady,
}) => {
  // Process content for preview mode.
  // In edit mode, we want to keep the original template with placeholders.
  const processedContent = useMemo(() => {
    if (!isPreview) {
      return content;
    }
    let previewContent = content;
    const allVariables = [
      ...variables.systemVariables,
      ...variables.tenantVariables,
    ];
    // Replace all variables with their case data values
    allVariables.forEach((variable) => {
      const value =
        variables.caseData[variable.variableName] ||
        `{{${variable.variableName}}}`;
      const regex = new RegExp(`\\{\\{${variable.variableName}\\}\\}`, 'g');
      previewContent = previewContent.replace(regex, value);
    });
    return previewContent;
  }, [content, isPreview, variables]);

  const editor = useEditor({
    extensions: [StarterKit, CustomVariable],
    content: processedContent,
    immediatelyRender: false,
    // Editor should be editable only in edit mode
    editable: !isPreview,
    onUpdate: ({ editor }) => {
      // Only update the content externally in edit mode.
      if (!isPreview) {
        onUpdate(editor.getHTML());
      }
    },
  });

  // Notify parent when the editor is ready
  useEffect(() => {
    onEditorReady(editor);
  }, [editor, onEditorReady]);

  // When processedContent changes (mode switch), reset the editor content.
  useEffect(() => {
    if (editor && processedContent !== editor.getHTML()) {
      editor.commands.setContent(processedContent);
    }
  }, [editor, processedContent]);

  // Update the editor's editable state when isPreview changes.
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isPreview);
    }
  }, [editor, isPreview]);

  return (
    <div className={`prose max-w-none ${isPreview ? 'preview-mode' : 'edit-mode'}`}>
      <style>
        {`
          .variable-placeholder {
            background-color: var(--color-primary-palest);
            border-radius: 4px;
            padding: 0 4px;
          }
          .ProseMirror:focus {
            outline: none;
          }
          .ProseMirror strong {
            color: inherit;
          }
          .ProseMirror p {
            color: inherit;
          }
        `}
      </style>
      <EditorContent editor={editor} />
    </div>
  );
};

export default CaseDocumentEditor;
