import { useState } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  Sliders,
  FileText,
  AlignLeft,
  Link as LinkIcon,
  Mail,
  Hash,
  Calendar,
  List,
  CheckSquare,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import FormPreview from './FormPreview';

export const FIELD_TYPES = [
  { id: 'short_text', label: 'Short Text', icon: FileText, desc: 'Single-line text (e.g. name, topic, tool name)' },
  { id: 'long_text', label: 'Long Text', icon: AlignLeft, desc: 'Multi-line paragraph (e.g. explanation, reflections)' },
  { id: 'url', label: 'URL / Link', icon: LinkIcon, desc: 'Web link (e.g. GitHub repo, live demo, Figma)' },
  { id: 'email', label: 'Email', icon: Mail, desc: 'Email address format' },
  { id: 'number', label: 'Number', icon: Hash, desc: 'Numeric quantity (e.g. hours spent, problem count)' },
  { id: 'date', label: 'Date', icon: Calendar, desc: 'Date picker' },
  { id: 'dropdown', label: 'Dropdown', icon: List, desc: 'Single selection from custom list' },
  { id: 'checkbox', label: 'Checkbox', icon: CheckSquare, desc: 'Boolean acknowledgement / confirmation' },
  { id: 'file_upload', label: 'File Upload', icon: UploadCloud, desc: 'Document, archive, or image upload' },
];

function generateFieldId(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 30) || 'field';
}

export default function FormBuilder({ schema = [], onChange, taskTitle = 'Task Submission' }) {
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'preview'
  const [expandedAdvanced, setExpandedAdvanced] = useState({});
  const [draggedIndex, setDraggedIndex] = useState(null);

  const toggleAdvanced = (fieldId) => {
    setExpandedAdvanced((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  const addField = (type = 'short_text') => {
    const typeObj = FIELD_TYPES.find((t) => t.id === type) || FIELD_TYPES[0];
    const baseLabel = `New ${typeObj.label}`;
    const uniqueId = `${generateFieldId(baseLabel)}_${Date.now().toString().slice(-4)}`;

    const newField = {
      id: uniqueId,
      label: baseLabel,
      type,
      required: true,
      placeholder: '',
      help_text: '',
      validation: {
        pattern: '',
        custom_error: '',
        min: null,
        max: null,
        min_length: null,
        max_length: null,
      },
      options: type === 'dropdown' ? ['Option 1', 'Option 2'] : [],
      file_restrictions:
        type === 'file_upload'
          ? {
              max_size_mb: 15,
              allowed_types: ['application/pdf', 'application/zip', 'image/png', 'image/jpeg'],
            }
          : undefined,
    };

    onChange([...schema, newField]);
  };

  const removeField = (index) => {
    const updated = schema.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateField = (index, updates) => {
    const updated = schema.map((field, i) => (i === index ? { ...field, ...updates } : field));
    onChange(updated);
  };

  const moveField = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= schema.length) return;
    const items = [...schema];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    onChange(items);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    moveField(draggedIndex, dropIndex);
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Builder / Preview Toggle Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-surface-2 border border-border rounded-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'builder'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Form Builder ({schema.length} fields)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Live Member Preview
          </button>
        </div>

        {activeTab === 'builder' && (
          <div className="flex items-center gap-2">
            <span className="text-2xs text-text-muted hidden sm:inline">Add Field:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addField(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="bg-surface border border-border rounded px-2.5 py-1 text-xs text-text-primary focus:ring-1 focus:ring-accent outline-none"
            >
              <option value="" disabled>
                + Choose Field Type...
              </option>
              {FIELD_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mode View */}
      {activeTab === 'preview' ? (
        <FormPreview schema={schema} taskTitle={taskTitle} />
      ) : (
        <div className="space-y-4">
          {schema.length === 0 ? (
            <div className="border border-dashed border-border-2 rounded-xl p-10 text-center bg-surface-2/30">
              <Sliders className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <h4 className="text-text-primary font-semibold text-sm mb-1">
                No Submission Fields Configured
              </h4>
              <p className="text-text-muted text-xs max-w-md mx-auto mb-5 leading-relaxed">
                Standard identification fields (Full name, Department, Year, Section, Domain) are
                always automatically included. Add specific technical deliverables below.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => addField('url')}
                >
                  <Plus className="w-3.5 h-3.5" /> Add URL Field
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => addField('long_text')}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Explanation
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => addField('file_upload')}
                >
                  <Plus className="w-3.5 h-3.5" /> Add File Upload
                </Button>
              </div>
            </div>
          ) : (
            schema.map((field, index) => {
              const typeMeta = FIELD_TYPES.find((t) => t.id === field.type) || FIELD_TYPES[0];
              const IconComponent = typeMeta.icon;
              const isAdvancedOpen = Boolean(expandedAdvanced[field.id]);

              return (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`bg-surface border rounded-lg transition-all ${
                    draggedIndex === index
                      ? 'border-accent opacity-50 bg-accent/5'
                      : 'border-border hover:border-border-2'
                  }`}
                >
                  {/* Card Header & Main Fields */}
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
                      <div className="flex items-center gap-2">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing p-1 text-text-muted hover:text-text-secondary transition-colors"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Reorder Up/Down Accessibility Buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveField(index, index - 1)}
                            disabled={index === 0}
                            className="p-0.5 text-text-muted hover:text-text-primary disabled:opacity-20"
                            title="Move up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveField(index, index + 1)}
                            disabled={index === schema.length - 1}
                            className="p-0.5 text-text-muted hover:text-text-primary disabled:opacity-20"
                            title="Move down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-2xs font-mono text-text-muted">#{index + 1}</span>

                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-2 border border-border">
                          <IconComponent className="w-3.5 h-3.5 text-accent" />
                          <span className="text-xs font-medium text-text-primary">
                            {typeMeta.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Required toggle */}
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-text-secondary">
                          <input
                            type="checkbox"
                            checked={Boolean(field.required)}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                            className="rounded border-border bg-surface text-accent focus:ring-accent"
                          />
                          <span>Required</span>
                        </label>

                        {/* Remove Field */}
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                          title="Remove field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Field Basic Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Label */}
                      <div className="md:col-span-2">
                        <label className="block text-2xs font-medium text-text-secondary mb-1">
                          Field Label <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => {
                            const newLabel = e.target.value;
                            updateField(index, {
                              label: newLabel,
                              // Auto-generate identifier if not customized
                              id: field.id.startsWith('new_')
                                ? `${generateFieldId(newLabel)}_${Date.now().toString().slice(-4)}`
                                : field.id,
                            });
                          }}
                          placeholder="e.g. GitHub Repository URL"
                          className="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none"
                        />
                      </div>

                      {/* Type Selector */}
                      <div>
                        <label className="block text-2xs font-medium text-text-secondary mb-1">
                          Field Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            updateField(index, {
                              type: newType,
                              options: newType === 'dropdown' ? ['Option 1', 'Option 2'] : [],
                              file_restrictions:
                                newType === 'file_upload'
                                  ? {
                                      max_size_mb: 15,
                                      allowed_types: [
                                        'application/pdf',
                                        'application/zip',
                                        'image/png',
                                      ],
                                    }
                                  : undefined,
                            });
                          }}
                          className="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none"
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Placeholder & Help Text */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-2xs font-medium text-text-secondary mb-1">
                          Placeholder Hint
                        </label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          placeholder="e.g. https://github.com/username/project"
                          className="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-2xs font-medium text-text-secondary mb-1">
                          Instructions / Help Text
                        </label>
                        <input
                          type="text"
                          value={field.help_text || ''}
                          onChange={(e) => updateField(index, { help_text: e.target.value })}
                          placeholder="e.g. Must include an active README and instructions"
                          className="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent outline-none"
                        />
                      </div>
                    </div>

                    {/* Dropdown Options Manager */}
                    {field.type === 'dropdown' && (
                      <div className="p-3 bg-surface-2/70 border border-border/80 rounded space-y-2">
                        <label className="block text-2xs font-medium text-text-secondary">
                          Dropdown Options List
                        </label>
                        <div className="space-y-1.5">
                          {(field.options || []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={typeof opt === 'string' ? opt : opt.label || ''}
                                onChange={(e) => {
                                  const newOptions = [...field.options];
                                  newOptions[optIdx] = e.target.value;
                                  updateField(index, { options: newOptions });
                                }}
                                className="flex-1 bg-surface border border-border rounded px-2.5 py-1 text-xs text-text-primary focus:ring-1 focus:ring-accent outline-none"
                                placeholder={`Option ${optIdx + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = field.options.filter((_, i) => i !== optIdx);
                                  updateField(index, { options: newOptions });
                                }}
                                className="p-1 text-text-muted hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
                            updateField(index, { options: newOptions });
                          }}
                          className="text-xs"
                        >
                          + Add Option
                        </Button>
                      </div>
                    )}

                    {/* File Upload Configuration */}
                    {field.type === 'file_upload' && (
                      <div className="p-3 bg-surface-2/70 border border-border/80 rounded grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-2xs font-medium text-text-secondary mb-1">
                            Max File Size (MB)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={field.file_restrictions?.max_size_mb || 15}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 15);
                              updateField(index, {
                                file_restrictions: {
                                  ...(field.file_restrictions || {}),
                                  max_size_mb: val,
                                },
                              });
                            }}
                            className="w-full bg-surface border border-border rounded px-2.5 py-1 text-xs text-text-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-2xs font-medium text-text-secondary mb-1">
                            Allowed Extensions (comma separated)
                          </label>
                          <input
                            type="text"
                            value={(field.file_restrictions?.allowed_types || []).join(', ')}
                            onChange={(e) => {
                              const types = e.target.value
                                .split(',')
                                .map((t) => t.trim())
                                .filter(Boolean);
                              updateField(index, {
                                file_restrictions: {
                                  ...(field.file_restrictions || {}),
                                  allowed_types: types,
                                },
                              });
                            }}
                            placeholder="application/pdf, .zip, .png"
                            className="w-full bg-surface border border-border rounded px-2.5 py-1 text-xs text-text-primary"
                          />
                        </div>
                      </div>
                    )}

                    {/* Collapsible Validation & Advanced Rules */}
                    <div className="border-t border-border/50 pt-2">
                      <button
                        type="button"
                        onClick={() => toggleAdvanced(field.id)}
                        className="flex items-center gap-1.5 text-2xs text-text-muted hover:text-text-secondary transition-colors"
                      >
                        {isAdvancedOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        <span>Advanced Validation & Field Identifier</span>
                      </button>

                      {isAdvancedOpen && (
                        <div className="mt-3 p-3 bg-surface-2/40 border border-border/60 rounded grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                          <div>
                            <label className="block text-2xs font-medium text-text-secondary mb-1">
                              Database Field Identifier (Key)
                            </label>
                            <input
                              type="text"
                              value={field.id}
                              onChange={(e) =>
                                updateField(index, {
                                  id: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '_'),
                                })
                              }
                              className="w-full bg-surface border border-border rounded px-2.5 py-1 text-xs text-text-primary font-mono"
                            />
                            <p className="text-2xs text-text-muted mt-0.5">
                              Key used inside submission_data JSONB.
                            </p>
                          </div>

                          {/* Pattern validation for text/url */}
                          {['short_text', 'long_text', 'url'].includes(field.type) && (
                            <div>
                              <label className="block text-2xs font-medium text-text-secondary mb-1">
                                Regex Pattern (Optional)
                              </label>
                              <input
                                type="text"
                                value={field.validation?.pattern || ''}
                                onChange={(e) =>
                                  updateField(index, {
                                    validation: {
                                      ...(field.validation || {}),
                                      pattern: e.target.value,
                                    },
                                  })
                                }
                                placeholder="^https:\/\/github\.com\/.+$"
                                className="w-full bg-surface border border-border rounded px-2.5 py-1 text-xs text-text-primary font-mono"
                              />
                            </div>
                          )}

                          {/* Number bounds */}
                          {field.type === 'number' && (
                            <>
                              <div>
                                <label className="block text-2xs font-medium text-text-secondary mb-1">
                                  Min Value
                                </label>
                                <input
                                  type="number"
                                  value={field.validation?.min ?? ''}
                                  onChange={(e) =>
                                    updateField(index, {
                                      validation: {
                                        ...(field.validation || {}),
                                        min: e.target.value !== '' ? Number(e.target.value) : null,
                                      },
                                    })
                                  }
                                  className="w-full bg-surface border border-border rounded px-2.5 py-1 text-xs text-text-primary"
                                />
                              </div>
                              <div>
                                <label className="block text-2xs font-medium text-text-secondary mb-1">
                                  Max Value
                                </label>
                                <input
                                  type="number"
                                  value={field.validation?.max ?? ''}
                                  onChange={(e) =>
                                    updateField(index, {
                                      validation: {
                                        ...(field.validation || {}),
                                        max: e.target.value !== '' ? Number(e.target.value) : null,
                                      },
                                    })
                                  }
                                  className="w-full bg-surface border border-border rounded px-2.5 py-1 text-xs text-text-primary"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Quick Add Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => addField('short_text')}
            >
              <Plus className="w-4 h-4" /> Add Field
            </Button>

            <span className="text-2xs text-text-muted">
              Standard identification fields (Name, Dept, Year, Section, Domain) are strictly
              included on all tasks.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
