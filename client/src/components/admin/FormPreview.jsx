import { useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { FileUp, CheckCircle, Info } from 'lucide-react';

const STANDARD_MEMBER_FIELDS = [
  { label: 'Full Name', value: 'Jane Doe', note: 'Standard Identification' },
  { label: 'Department', value: 'CSE', note: 'Standard Identification' },
  { label: 'Year', value: '2nd Year', note: 'Standard Identification' },
  { label: 'Section', value: 'A', note: 'Standard Identification' },
  { label: 'Club Domain', value: 'Web Development', note: 'Standard Identification' },
];

export default function FormPreview({ schema = [], taskTitle = 'Task Submission Preview' }) {
  const [testValues, setTestValues] = useState({});

  const handleTestChange = (fieldId, val) => {
    setTestValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge label="Active Schema Preview" />
          <span className="text-text-muted text-xs">Dynamic Member View</span>
        </div>
        <h3 className="text-text-primary font-bold text-lg">{taskTitle}</h3>
        <p className="text-text-muted text-xs mt-1">
          This preview reflects the exact submission form members will interact with.
        </p>
      </div>

      {/* Standard Mandatory Member Details */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
            Mandatory Member Identification
          </span>
          <span className="text-2xs text-text-muted">(Auto-attached to all tasks)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-surface-2/60 border border-border/80 rounded">
          {STANDARD_MEMBER_FIELDS.map((f) => (
            <div key={f.label} className="text-xs">
              <span className="text-text-muted block mb-0.5">{f.label} *</span>
              <span className="text-text-secondary font-mono bg-surface px-2 py-1 rounded block border border-border/60">
                {f.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Task Specific Fields */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
            Task-Specific Requirements ({schema.length} configured fields)
          </span>
        </div>

        {schema.length === 0 ? (
          <div className="border border-dashed border-border rounded p-8 text-center">
            <Info className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-sm font-medium">No dynamic fields added yet.</p>
            <p className="text-text-muted text-xs mt-1">
              Use the form builder on the left to add input requirements for this task.
            </p>
          </div>
        ) : (
          schema.map((field, idx) => {
            const fieldVal = testValues[field.id] || '';

            return (
              <div key={field.id || idx} className="space-y-1.5 p-3 rounded bg-surface-2/40 border border-border/50">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                    <span>{field.label || `Field ${idx + 1}`}</span>
                    {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <span className="text-2xs font-mono text-text-muted uppercase">
                    {field.type}
                  </span>
                </div>

                {field.help_text && (
                  <p className="text-text-muted text-xs leading-relaxed">{field.help_text}</p>
                )}

                {/* Render by type */}
                {field.type === 'short_text' && (
                  <input
                    type="text"
                    placeholder={field.placeholder || 'Enter text...'}
                    value={fieldVal}
                    onChange={(e) => handleTestChange(field.id, e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent outline-none"
                  />
                )}

                {field.type === 'long_text' && (
                  <textarea
                    rows={3}
                    placeholder={field.placeholder || 'Enter detailed response...'}
                    value={fieldVal}
                    onChange={(e) => handleTestChange(field.id, e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent outline-none resize-none"
                  />
                )}

                {field.type === 'url' && (
                  <input
                    type="url"
                    placeholder={field.placeholder || 'https://github.com/...'}
                    value={fieldVal}
                    onChange={(e) => handleTestChange(field.id, e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent outline-none font-mono text-xs"
                  />
                )}

                {field.type === 'email' && (
                  <input
                    type="email"
                    placeholder={field.placeholder || 'member@srmist.edu.in'}
                    value={fieldVal}
                    onChange={(e) => handleTestChange(field.id, e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent outline-none text-xs"
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    placeholder={field.placeholder || '0'}
                    min={field.validation?.min}
                    max={field.validation?.max}
                    value={fieldVal}
                    onChange={(e) => handleTestChange(field.id, e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent outline-none text-xs"
                  />
                )}

                {field.type === 'date' && (
                  <input
                    type="date"
                    value={fieldVal}
                    onChange={(e) => handleTestChange(field.id, e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent outline-none text-xs"
                  />
                )}

                {field.type === 'dropdown' && (
                  <select
                    value={fieldVal}
                    onChange={(e) => handleTestChange(field.id, e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none"
                  >
                    <option value="">{field.placeholder || '-- Select an option --'}</option>
                    {(field.options || []).map((opt) => {
                      const val = typeof opt === 'string' ? opt : opt.value;
                      const label = typeof opt === 'string' ? opt : opt.label;
                      return (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                )}

                {field.type === 'checkbox' && (
                  <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={Boolean(fieldVal)}
                      onChange={(e) => handleTestChange(field.id, e.target.checked)}
                      className="mt-0.5 rounded border-border bg-surface text-accent focus:ring-accent"
                    />
                    <span className="text-text-secondary text-xs select-none">
                      {field.placeholder || 'I confirm and agree.'}
                    </span>
                  </label>
                )}

                {field.type === 'file_upload' && (
                  <div className="border border-dashed border-border-2 rounded-lg p-4 text-center bg-surface flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent transition-colors">
                    <FileUp className="w-6 h-6 text-accent" />
                    <div>
                      <p className="text-text-primary text-xs font-medium">
                        Click or drag files to upload
                      </p>
                      <p className="text-text-muted text-2xs mt-0.5">
                        Allowed: {(field.file_restrictions?.allowed_types || ['PDF', 'ZIP', 'Images']).join(', ')} • Max {field.file_restrictions?.max_size_mb || 15}MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {schema.length > 0 && (
        <div className="pt-4 border-t border-border flex justify-end">
          <Button variant="primary" size="sm" disabled>
            Submit Task (Sample Disabled)
          </Button>
        </div>
      )}
    </div>
  );
}
