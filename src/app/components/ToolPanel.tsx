import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Level } from '@tiptap/extension-heading';
import { Button, Select } from '@ecainternational/eca-components';

type EditorCommand = 
  | 'toggleBold' 
  | 'toggleItalic' 
  | 'toggleUnderline'
  | 'toggleHeading'
  | 'toggleBulletList'
  | 'setConditionalSpan' 
  | 'unsetConditionalSpan' 
  | 'setConditionalBlock' 
  | 'unsetConditionalBlock';

interface Tool {
  name: string;
  icon: string;
  command?: EditorCommand;
  args?: { level: Level };
  label?: string;
}

interface ToolGroup {
  name: string;
  icon: string;
  tools: Tool[];
}

interface Variable {
  variableId: string;
  variableName: string;
  variableLabel?: string;
}

interface ToolPanelProps {
  editor: Editor | null;
  activeGroup: string | null;
  onGroupClick: (name: string) => void;
  showCaseVariables?: boolean;
  variables: {
    caseData?: Record<string, string>;
    systemVariables: Variable[];
    tenantVariables: Variable[];
  };
}

// Type definition for the modal state
type ModalType = 'block' | 'span' | null;

const getToolGroups = (showCaseVariables: boolean = false): ToolGroup[] => [
  {
    name: 'text',
    icon: 'fi-rr-text-box-edit',
    tools: [
      { name: 'toggleBold', icon: 'fi-rr-bold', command: 'toggleBold' },
      { name: 'toggleItalic', icon: 'fi-rr-italic', command: 'toggleItalic' },
      { name: 'toggleUnderline', icon: 'fi-rr-underline', command: 'toggleUnderline' }
    ]
  },
  {
    name: 'format',
    icon: 'fi-rr-pen-nib',
    tools: [
      { name: 'heading-1', icon: 'fi-rr-h-1', command: 'toggleHeading', args: { level: 1 } },
      { name: 'heading-2', icon: 'fi-rr-h-2', command: 'toggleHeading', args: { level: 2 } },
      { name: 'bullet-list', icon: 'fi-rr-list', command: 'toggleBulletList' }
    ]
  },
  {
    name: 'conditional',
    icon: 'fi-rr-code-compare',
    tools: [
      {
        name: 'set-conditional-span',
        icon: 'fi-rr-brackets-square',
        label: 'Conditional Text (Span)',
        command: 'setConditionalSpan'
      },
      {
        name: 'unset-conditional-span',
        icon: 'fi-rr-cross-small',
        label: 'Remove Conditional Text',
        command: 'unsetConditionalSpan'
      },
      {
        name: 'set-conditional-block',
        icon: 'fi-rr-rectangle-code',
        label: 'Conditional Block',
        command: 'setConditionalBlock'
      },
      {
        name: 'unset-conditional-block',
        icon: 'fi-rr-cross-small',
        label: 'Remove Conditional Block',
        command: 'unsetConditionalBlock'
      }
    ]
  },
  {
    name: 'variables',
    icon: 'fi-rr-brackets-curly',
    tools: [
      ...(showCaseVariables ? [{ name: 'case-vars', icon: 'fi-rr-brackets-curly', label: 'Case Variables' }] : []),
      { name: 'system-vars', icon: 'fi-rr-brackets-curly', label: 'System Variables' },
      { name: 'tenant-vars', icon: 'fi-rr-brackets-curly', label: 'Tenant Variables' }
    ]
  }
];

const ToolPanel: React.FC<ToolPanelProps> = ({
  editor,
  activeGroup,
  onGroupClick,
  showCaseVariables = false,
  variables
}) => {
  const [selectedVarType, setSelectedVarType] = useState<'system' | 'tenant' | 'case' | null>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [currentExpression, setCurrentExpression] = useState('');

  const handleToolClick = (tool: Tool, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!editor || !tool.command) {
      // Handle variable selection separately if no command
      if (!tool.command && tool.name.endsWith('-vars')) {
        const type = tool.name.replace('-vars', '') as 'system' | 'tenant' | 'case';
        setSelectedVarType(type);
        setIsSelectOpen(true);
      }
      return; 
    }

    // Explicitly handle commands to avoid type issues with dynamic indexing
    const chain = editor.chain().focus();
    switch (tool.command) {
      case 'toggleBold':
        chain.toggleBold().run();
        break;
      case 'toggleItalic':
        chain.toggleItalic().run();
        break;
      case 'toggleUnderline':
        chain.toggleUnderline().run();
        break;
      case 'toggleHeading':
        if (tool.args?.level) {
          chain.toggleHeading(tool.args).run();
        }
        break;
      case 'toggleBulletList':
        chain.toggleBulletList().run();
        break;
      // NOTE: setConditionalBlock/Span are handled by openModal in the button's onClick
      case 'unsetConditionalSpan':
        chain.unsetConditionalSpan().run();
        break;
      case 'unsetConditionalBlock':
        chain.unsetConditionalBlock().run();
        break;
      default:
        console.warn(`Unhandled tool command in handleToolClick: ${tool.command}`);
        // Attempt dynamic call as a fallback? Or just ignore?
        // try {
        //   if (tool.args) (chain as any)[tool.command](tool.args).run();
        //   else (chain as any)[tool.command]().run();
        // } catch (e) { 
        //   console.error(`Error executing command ${tool.command}:`, e);
        // }
    }
  };

  const handleVariableSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!editor || !selectedVarType) return;

    const variableId = event.target.value;
    let variableName = '';
    
    switch (selectedVarType) {
      case 'case':
        if (showCaseVariables) {
          variableName = variableId;
        }
        break;
      case 'system':
        variableName = variables.systemVariables.find(v => v.variableId === variableId)?.variableName || '';
        break;
      case 'tenant':
        variableName = variables.tenantVariables.find(v => v.variableId === variableId)?.variableName || '';
        break;
    }

    if (variableName) {
      editor.commands.insertContent(`{{${variableName}}}`);
    }
    
    setIsSelectOpen(false);
    setSelectedVarType(null);
  };

  const getVariableOptions = () => {
    if (!selectedVarType) return [];

    switch (selectedVarType) {
      case 'case':
        if (!showCaseVariables || !variables.caseData) return [];
        return Object.entries(variables.caseData).map(([key]) => ({
          value: key,
          label: key
        }));
      case 'system':
        return variables.systemVariables.map(v => ({
          value: v.variableId,
          label: v.variableLabel || v.variableName
        }));
      case 'tenant':
        return variables.tenantVariables.map(v => ({
          value: v.variableId,
          label: v.variableLabel || v.variableName
        }));
      default:
        return [];
    }
  };

  const isToolActive = (tool: Tool): boolean => {
    if (!editor || !tool.command) return false;

    if (tool.command === 'toggleHeading' && tool.args?.level) {
      return editor.isActive('heading', tool.args);
    }

    return editor.isActive(tool.command.replace('toggle', '').toLowerCase());
  };

  // Handlers for Modal
  const openModal = (type: 'block' | 'span') => {
    if (!editor) return; // Add null check
    // TODO: Optionally fetch existing expression if editing?
    const currentAttrs = type === 'block' 
      ? editor.getAttributes('conditionalBlock')
      : editor.getAttributes('conditionalSpan');
    setCurrentExpression(currentAttrs['data-condition-expression'] || '');
    setModalType(type);
    setIsModalOpen(true);
    editor.chain().focus().run(); // Ensure editor has focus before modal opens fully
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setCurrentExpression('');
  };

  const handleSaveExpression = () => {
    if (!modalType || !editor) return; // Add null check for editor here as well

    const attributes = { 'data-condition-expression': currentExpression };

    if (modalType === 'block') {
      editor.chain().focus().setConditionalBlock(attributes).run();
    } else if (modalType === 'span') {
      editor.chain().focus().setConditionalSpan(attributes).run();
    }
    closeModal();
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {getToolGroups(showCaseVariables).map((group) => (
          <li key={group.name} className="relative">
            <button
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-150 ${
                activeGroup === group.name
                  ? 'bg-neutral-layer-3 text-neutral-detail-boldest'
                  : 'text-neutral-detail hover:bg-neutral-layer-2'
              }`}
              onClick={() => onGroupClick(group.name)}
            >
              <i className={`${group.icon} text-lg`}></i>
            </button>
            {activeGroup === group.name && (
              <div className="absolute left-full top-0 ml-2">
                <div className="flex gap-1 rounded-lg bg-neutral-layer-1 p-1 shadow-lg">
                  {group.tools.map((tool) => (
                    <button
                      key={tool.name}
                      className={`flex items-center justify-center w-10 h-10 rounded-lg text-neutral-detail hover:bg-neutral-layer-2 ${
                        isToolActive(tool) ? 'active' : ''
                      }`}
                      onClick={(e) => {
                        // Special handling for conditional set buttons to open modal
                        if (tool.command === 'setConditionalBlock') {
                          openModal('block');
                        } else if (tool.command === 'setConditionalSpan') {
                          openModal('span');
                        } else {
                          // Default behavior for other tools (including unset conditionals)
                          handleToolClick(tool, e); 
                        }
                      }}
                    >
                      <i className={`${tool.icon} text-lg`}></i>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {isSelectOpen && (
        <div className="absolute left-full top-0 ml-2">
          <div className="w-[300px] rounded-lg bg-neutral-layer-1 p-2 shadow-lg">
            <Select
              value=""
              onChange={handleVariableSelect}
            >
              <option value="" disabled>{`Select ${selectedVarType} variable`}</option>
              {getVariableOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}
      {/* Simple Modal Implementation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-neutral-layer-1 dark:bg-neutral-layer-3 p-6 rounded-lg shadow-xl w-full max-w-md border-2 border-controls-lines">
            <h3 className="text-lg font-semibold mb-4 text-neutral-content-default dark:text-neutral-content-inverse">
              Set Condition Expression ({modalType === 'block' ? 'Block' : 'Span'})
            </h3>
            <input 
              type="text"
              value={currentExpression}
              onChange={(e) => setCurrentExpression(e.target.value)}
              placeholder="e.g., user.role === 'admin'"
              className="w-full p-2 border border-controls-lines-pale rounded mb-4 dark:bg-neutral-layer-4 dark:border-controls-lines dark:text-neutral-content-inverse"
              autoFocus
            />
            <p className="mb-4 text-sm text-neutral-detail dark:text-neutral-detail-muted">
              Use variable names (e.g., <code>case.propertyName</code>, <code>tenant.variableName</code>).
              Supports <code>==</code>, <code>!=</code>, <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code>, <code>&lt;=</code>, <code>&amp;&amp;</code>, <code>||</code>, <code>!</code>, <code>()</code>, numbers, and strings.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={closeModal} 
                className="px-4 py-2 rounded bg-neutral-layer-2 hover:bg-neutral-layer-3 text-neutral-content-default dark:bg-neutral-layer-4 dark:hover:bg-neutral-layer-5 dark:text-neutral-content-inverse border border-controls-lines"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveExpression} 
                className="px-4 py-2 rounded bg-primary-main hover:bg-primary-dark text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .tool-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 6px;
          transition: all 150ms;
          width: 100%;
          text-align: left;
        }

        .tool-button:hover {
          background-color: var(--secondary-palest);
        }

        .tool-button.active {
          background-color: var(--secondary-palest);
          color: var(--secondary-main);
        }

        .tool-button i {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tool-button span {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default ToolPanel;
