import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Editor } from '@tiptap/react';
import { Level } from '@tiptap/extension-heading';
import { Button, Select as BaseSelect, TextInput as BaseTextInput, IconButton } from '@ecainternational/eca-components';
import { Dialog, Transition } from '@headlessui/react';

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
  variableLabel: string;
}

interface CaseToolPanelProps {
  editor: Editor | null;
  activeGroup: string | null;
  onGroupClick: (name: string) => void;
  variables: {
    caseData: Record<string, string>;
    systemVariables: Variable[];
    tenantVariables: Variable[];
  };
  showCaseVariables?: boolean;
}

const toolGroups: (showCaseVars: boolean) => ToolGroup[] = (showCaseVars) => [
  {
    name: 'text',
    icon: 'fi-rr-text-box-edit',
    tools: [
      { name: 'bold', icon: 'fi-rr-bold', command: 'toggleBold' },
      { name: 'italic', icon: 'fi-rr-italic', command: 'toggleItalic' },
      { name: 'underline', icon: 'fi-rr-underline', command: 'toggleUnderline' }
    ]
  },
  {
    name: 'format',
    icon: 'fi-rr-pen-nib',
    tools: [
      { name: 'heading-1', icon: 'fi-rr-h', command: 'toggleHeading', args: { level: 1 } },
      { name: 'heading-2', icon: 'fi-rr-h', command: 'toggleHeading', args: { level: 2 } },
      { name: 'bullet-list', icon: 'fi-rr-list', command: 'toggleBulletList' }
    ]
  },
  {
    name: 'conditional', 
    icon: 'fi-rr-code-compare',
    tools: [
      {
        name: 'set-conditional-block',
        icon: 'fi-rr-square-terminal',
        label: 'Conditional Block',
        command: 'setConditionalBlock' 
      },
      {
        name: 'set-conditional-span',
        icon: 'fi-rr-square-code',
        label: 'Conditional Span',
        command: 'setConditionalSpan' 
      },
      {
        name: 'unset-conditional-block',
        icon: 'fi-rr-rectangle-xmark',
        label: 'Unset Conditional Block',
        command: 'unsetConditionalBlock'
      },
      {
        name: 'unset-conditional-span',
        icon: 'fi-rr-rectangle-code',
        label: 'Unset Conditional Span',
        command: 'unsetConditionalSpan'
      }
    ]
  },
  {
    name: 'variables',
    icon: 'fi-rr-brackets-curly',
    tools: [
      ...(showCaseVars ? [{ name: 'case-vars', icon: 'fi-rr-brackets-curly', label: 'Case Variables' }] : []),
      { name: 'system-vars', icon: 'fi-rr-brackets-curly', label: 'System Variables' },
      { name: 'tenant-vars', icon: 'fi-rr-brackets-curly', label: 'Tenant Variables' }
    ]
  }
];

const CaseToolPanel: React.FC<CaseToolPanelProps> = ({
  editor,
  activeGroup,
  onGroupClick,
  variables,
  showCaseVariables = true
}) => {
  const [selectedVarType, setSelectedVarType] = useState<'case' | 'system' | 'tenant' | null>(null);
  const toolPanelRef = useRef<HTMLDivElement>(null);

  type ModalType = 'block' | 'span' | null;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [currentExpression, setCurrentExpression] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolPanelRef.current && !toolPanelRef.current.contains(event.target as Node)) {
        setSelectedVarType(null);
        onGroupClick(''); 
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onGroupClick]);

  const handleToolClick = (tool: Tool, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!editor) return;

    if (tool.command) {
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
        case 'unsetConditionalSpan':
          chain.unsetConditionalSpan().run();
          break;
        case 'unsetConditionalBlock':
          chain.unsetConditionalBlock().run();
          break;
        default:
          console.warn(`Unhandled tool command in handleToolClick: ${tool.command}`);
      }
    } else if (tool.name.endsWith('-vars')) {
      const type = tool.name.replace('-vars', '') as 'case' | 'system' | 'tenant';
      setSelectedVarType(type);
    }
  };

  const openModal = (type: ModalType, initialExpression: string = '') => {
    if (!editor) return;
    setModalType(type);
    setCurrentExpression(initialExpression);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setCurrentExpression('');
  };

  const handleModalSubmit = () => {
    if (!editor || !modalType) return;

    const expression = currentExpression.trim();
    if (!expression) {
      if (modalType === 'block') editor.chain().focus().unsetConditionalBlock().run();
      if (modalType === 'span') editor.chain().focus().unsetConditionalSpan().run();
      closeModal();
      return;
    }

    const attributes = { 'data-condition-expression': expression };

    if (modalType === 'block') {
      editor.chain().focus().setConditionalBlock(attributes).run();
    } else if (modalType === 'span') {
      editor.chain().focus().setConditionalSpan(attributes).run();
    }

    closeModal();
  };

  const getVariableOptions = () => {
    if (!selectedVarType) return [];

    switch (selectedVarType) {
      case 'case':
        return Object.entries(variables.caseData || {}).map(([id, label]) => ({
          value: id,
          label: `${label} ({{${id}}})`
        }));
      case 'system':
        return variables.systemVariables.map(v => ({
          value: v.variableId,
          label: `${v.variableLabel} ({{${v.variableName}}})`
        }));
      case 'tenant':
        return variables.tenantVariables.map(v => ({
          value: v.variableId,
          label: `${v.variableLabel} ({{${v.variableName}}})`
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

  return (
    <div ref={toolPanelRef} className="relative flex flex-col gap-6 px-3 py-8">
      <ul className="flex flex-col gap-3">
        {toolGroups(showCaseVariables).map((group) => (
          <li key={group.name} className="relative">
            <button
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-150 
                 ${activeGroup === group.name ? 'bg-secondary-palest' : 'hover:bg-secondary-palest'}`}
              onClick={() => onGroupClick(group.name)}
            >
              <i className={`${group.icon} flex`} />
            </button>
            
            {activeGroup === group.name && (
              <div className="absolute top-0 right-full mr-2 bg-neutral-layer-1 rounded-lg shadow-lg border border-controls-lines-paler p-2 min-w-[160px] z-10">
                <div className="flex flex-col gap-2">
                  {group.tools.map((tool) => (
                    <button
                      key={tool.name}
                      className={`tool-button ${isToolActive(tool) ? 'active' : ''} relative`}
                      onClick={(e) => {
                        if (tool.command === 'setConditionalBlock') {
                          openModal('block');
                        } else if (tool.command === 'setConditionalSpan') {
                          openModal('span');
                        } else {
                          handleToolClick(tool, e);
                          if (tool.name.endsWith('-vars')) {
                            setSelectedVarType(tool.name.replace('-vars', '') as 'case' | 'system' | 'tenant');
                          }
                        }
                      }}
                    >
                      <i className={`${tool.icon} flex`} />
                      <span>{tool.label || tool.name}</span>
                      {tool.name.endsWith('-vars') && selectedVarType === tool.name.replace('-vars', '') && (
                        <div className="absolute top-0 right-full mr-2 bg-neutral-layer-1 rounded-lg shadow-lg border border-controls-lines-paler p-4 w-[300px] z-10">
                          <div className="text-neutral-detail-boldest mb-2">Select {selectedVarType} variable</div>
                          <BaseSelect
                            name={`${selectedVarType}-variable-select`}
                            value=""
                            onChange={(e) => {
                              if (!editor || !selectedVarType) return;

                              const variableId = e.target.value;
                              let variableName = '';
                              switch (selectedVarType) {
                                case 'case':
                                  variableName = variableId;
                                  break;
                                case 'system':
                                  variableName = variables.systemVariables.find(v => v.variableId === variableId)?.variableName || '';
                                  break;
                                case 'tenant':
                                  variableName = variables.tenantVariables.find(v => v.variableId === variableId)?.variableName || '';
                                  break;
                              }

                              if (variableName) {
                                editor
                                  .chain()
                                  .focus()
                                  .insertContent(`{{${variableName}}}`)
                                  .run();
                              }

                              setSelectedVarType(null);
                            }}
                            className="w-full"
                            aria-label={`Select ${selectedVarType} variable`}
                          >
                            <option value="" disabled>Choose a variable...</option>
                            {getVariableOptions().map(({ value, label }) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </BaseSelect>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {activeGroup === 'variables' && selectedVarType && (
        <div className="absolute top-0 right-full mr-2 bg-neutral-layer-1 rounded-lg shadow-lg border border-controls-lines-paler p-2 min-w-[200px] z-10">
          <BaseSelect
            value=""
            onChange={(e) => {
              if (!editor || !selectedVarType) return;

              const variableId = e.target.value;
              let variableName = '';
              switch (selectedVarType) {
                case 'case':
                  variableName = variableId;
                  break;
                case 'system':
                  variableName = variables.systemVariables.find(v => v.variableId === variableId)?.variableName || '';
                  break;
                case 'tenant':
                  variableName = variables.tenantVariables.find(v => v.variableId === variableId)?.variableName || '';
                  break;
              }

              if (variableName) {
                editor
                  .chain()
                  .focus()
                  .insertContent(`{{${variableName}}}`)
                  .run();
              }

              setSelectedVarType(null);
            }}
            className="w-full"
            aria-label={`Select ${selectedVarType} variable`}
          >
            <option value="" disabled>Choose a variable...</option>
            {getVariableOptions().map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </BaseSelect>
        </div>
      )}

      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-neutral-layer-1 dark:bg-neutral-layer-3 p-6 text-left align-middle shadow-xl transition-all border-2 border-controls-lines">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-neutral-content-default dark:text-neutral-content-inverse flex justify-between items-center"
                  >
                    Enter Condition Expression ({modalType})
                    <IconButton 
                      icon="fi-rr-cross-small" 
                      name="close-condition-modal" 
                      variant="standard" 
                      onClick={closeModal} 
                      aria-label="Close modal" 
                      size='medium' 
                    />
                  </Dialog.Title>
                  <div className="mt-4">
                    <BaseTextInput
                      name="condition-expression-input"
                      value={currentExpression}
                      onChange={(e) => setCurrentExpression(e.target.value)}
                      placeholder="e.g., user.role == &#39;admin&#39; || case.status == &#39;approved&#39;"
                      className="w-full"
                    />
                    <p className="mt-2 text-sm text-neutral-detail dark:text-neutral-detail-muted">
                      Use variable names (e.g., <code>case.propertyName</code>, <code>tenant.variableName</code>). 
                      Supports <code>&#61;&#61;</code>, <code>&#33;&#61;</code>, <code>&gt;</code>, <code>&lt;</code>, <code>&gt;&#61;</code>, <code>&lt;&#61;</code>, <code>&amp;&amp;</code>, <code>&#124;&#124;</code>, <code>&#33;</code>, <code>()</code>, numbers, and strings.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <Button variant="outline" onClick={closeModal} name="cancel-condition" className="border-controls-lines-pale hover:bg-neutral-layer-2 dark:hover:bg-neutral-layer-4">
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleModalSubmit} name="apply-condition">
                      Apply Condition
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default CaseToolPanel;
