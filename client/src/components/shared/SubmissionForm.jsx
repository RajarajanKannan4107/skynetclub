import { useState } from 'react';
import { X, CheckCircle, FileUp, AlertCircle, UploadCloud } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { submitTask } from '../../services/api';

const DOMAINS = [
  'Web Development',
  'AI/ML',
  'Competitive Programming',
  'Content & Design',
  'PR & Marketing',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function SubmissionForm({ task, onClose, onSubmitted }) {
  // Standard identification fields (mandatory per requirements)
  const [memberInfo, setMemberInfo] = useState({
    member_name: '',
    member_email: '',
    department: '',
    year: '1st Year',
    section: '',
    club_domain: task?.assigned_domain && task.assigned_domain !== 'All' ? task.assigned_domain : 'Web Development',
  });

  // Dynamic answers state (keyed by field.id)
  const [dynamicAnswers, setDynamicAnswers] = useState({});
  const [fileAttachments, setFileAttachments] = useState({});

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const schema = Array.isArray(task?.submission_schema) ? task.submission_schema : [];

  const handleMemberChange = (field, val) => {
    setMemberInfo((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleDynamicChange = (fieldId, val) => {
    setDynamicAnswers((prev) => ({ ...prev, [fieldId]: val }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleFileChange = (fieldId, file) => {
    setFileAttachments((prev) => ({ ...prev, [fieldId]: file }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};

    // Standard Identification Checks
    if (!memberInfo.member_name.trim()) errs.member_name = 'Full name is required.';
    if (!memberInfo.member_email.trim()) {
      errs.member_email = 'Official / college email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(memberInfo.member_email.trim())) {
      errs.member_email = 'Please provide a valid email address.';
    }
    if (!memberInfo.department.trim()) errs.department = 'Department is required (e.g. CSE, IT).';
    if (!memberInfo.year) errs.year = 'Year is required.';
    if (!memberInfo.section.trim()) errs.section = 'Section is required (e.g. A, B).';
    if (!memberInfo.club_domain) errs.club_domain = 'Club domain is required.';

    // Dynamic Schema Fields Validation
    for (const field of schema) {
      const val = dynamicAnswers[field.id];
      const file = fileAttachments[field.id];

      if (field.required) {
        if (field.type === 'file_upload') {
          if (!file) errs[field.id] = `${field.label} requires an uploaded file.`;
        } else if (field.type === 'checkbox') {
          if (!val) errs[field.id] = `You must agree / check ${field.label}.`;
        } else if (val === undefined || val === null || val === '' || (typeof val === 'string' && !val.trim())) {
          errs[field.id] = `${field.label} is required.`;
        }
      }

      // Format validations
      if (val && field.type === 'url' && !/^https?:\/\/.+/.test(String(val).trim())) {
        errs[field.id] = `${field.label} must be a valid URL starting with https:// or http://`;
      }
      if (val && field.type === 'email' && !/^\S+@\S+\.\S+$/.test(String(val).trim())) {
        errs[field.id] = `${field.label} must be a valid email address.`;
      }
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      // If there are file attachments, send multipart/form-data
      const hasFiles = Object.keys(fileAttachments).length > 0;

      if (hasFiles) {
        const formData = new FormData();
        formData.append('member_name', memberInfo.member_name.trim());
        formData.append('member_email', memberInfo.member_email.trim().toLowerCase());
        formData.append('department', memberInfo.department.trim());
        formData.append('year', memberInfo.year);
        formData.append('section', memberInfo.section.trim());
        formData.append('club_domain', memberInfo.club_domain);
        formData.append('submission_data', JSON.stringify(dynamicAnswers));

        // Append files with their respective field IDs as fieldname
        for (const [fieldId, file] of Object.entries(fileAttachments)) {
          if (file) {
            formData.append(fieldId, file);
          }
        }

        await submitTask(task.id, formData);
      } else {
        const payload = {
          ...memberInfo,
          member_name: memberInfo.member_name.trim(),
          member_email: memberInfo.member_email.trim().toLowerCase(),
          department: memberInfo.department.trim(),
          section: memberInfo.section.trim(),
          submission_data: dynamicAnswers,
        };
        await submitTask(task.id, payload);
      }

      setSubmitted(true);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setServerError(err.message || 'Submission failed. Please verify your fields.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (fieldId) =>
    `w-full bg-surface-2 border rounded px-3 py-2 text-xs text-text-primary
     placeholder:text-text-muted focus:outline-none focus:ring-1
     transition-colors ${
       errors[fieldId]
         ? 'border-red-600 focus:ring-red-600'
         : 'border-border focus:ring-accent focus:border-accent'
     }`;

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center animate-fade-in">
        <CheckCircle className="w-12 h-12 text-accent" />
        <h3 className="text-text-primary font-bold text-lg">Submission Recorded</h3>
        <p className="text-text-muted text-xs max-w-sm leading-relaxed">
          Your deliverables for <strong className="text-text-secondary">{task?.title}</strong> have
          been securely recorded in Supabase. Club leads will review your work shortly.
        </p>
        <Button variant="secondary" size="sm" onClick={onClose} className="mt-3">
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xs font-mono font-bold text-accent">
              WEEK {task?.week_number || 1}
            </span>
            <Badge label={task?.assigned_domain || 'Task'} />
          </div>
          <h2 className="text-text-primary font-bold text-base leading-snug">{task?.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-text-muted hover:text-text-secondary transition-colors shrink-0"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {serverError && (
        <div className="p-3 bg-red-950/50 border border-red-900 rounded flex items-center gap-2.5 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* SECTION 1: MANDATORY MEMBER IDENTIFICATION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-text-secondary">
              1. Member Identification
            </span>
            <span className="text-2xs text-text-muted">Mandatory Fields</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-medium text-text-secondary mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={memberInfo.member_name}
                onChange={(e) => handleMemberChange('member_name', e.target.value)}
                placeholder="Your full name"
                className={inputCls('member_name')}
              />
              {errors.member_name && (
                <p className="text-red-400 text-2xs mt-1">{errors.member_name}</p>
              )}
            </div>

            <div>
              <label className="block text-2xs font-medium text-text-secondary mb-1">
                College Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={memberInfo.member_email}
                onChange={(e) => handleMemberChange('member_email', e.target.value)}
                placeholder="e.g. ab1234@srmist.edu.in"
                className={inputCls('member_email')}
              />
              {errors.member_email && (
                <p className="text-red-400 text-2xs mt-1">{errors.member_email}</p>
              )}
            </div>

            <div>
              <label className="block text-2xs font-medium text-text-secondary mb-1">
                Department <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={memberInfo.department}
                onChange={(e) => handleMemberChange('department', e.target.value)}
                placeholder="e.g. CSE, ECE, IT"
                className={inputCls('department')}
              />
              {errors.department && (
                <p className="text-red-400 text-2xs mt-1">{errors.department}</p>
              )}
            </div>

            <div>
              <label className="block text-2xs font-medium text-text-secondary mb-1">
                Year <span className="text-red-400">*</span>
              </label>
              <select
                value={memberInfo.year}
                onChange={(e) => handleMemberChange('year', e.target.value)}
                className={inputCls('year')}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-2xs font-medium text-text-secondary mb-1">
                Section <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={memberInfo.section}
                onChange={(e) => handleMemberChange('section', e.target.value)}
                placeholder="e.g. A, B, C"
                className={inputCls('section')}
              />
              {errors.section && (
                <p className="text-red-400 text-2xs mt-1">{errors.section}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-2xs font-medium text-text-secondary mb-1">
                Club Domain <span className="text-red-400">*</span>
              </label>
              <select
                value={memberInfo.club_domain}
                onChange={(e) => handleMemberChange('club_domain', e.target.value)}
                className={inputCls('club_domain')}
              >
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: DYNAMIC TASK DELIVERABLES */}
        {schema.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-border">
            <span className="text-2xs font-bold uppercase tracking-wider text-text-secondary block">
              2. Task Deliverables ({schema.length} fields)
            </span>

            <div className="space-y-3">
              {schema.map((field) => {
                const val = dynamicAnswers[field.id] || '';

                return (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-2xs font-medium text-text-secondary">
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>

                    {field.help_text && (
                      <p className="text-2xs text-text-muted leading-relaxed mb-1">
                        {field.help_text}
                      </p>
                    )}

                    {/* Short Text */}
                    {field.type === 'short_text' && (
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className={inputCls(field.id)}
                      />
                    )}

                    {/* Long Text */}
                    {field.type === 'long_text' && (
                      <textarea
                        rows={3}
                        value={val}
                        onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className={`${inputCls(field.id)} resize-none`}
                      />
                    )}

                    {/* URL */}
                    {field.type === 'url' && (
                      <input
                        type="url"
                        value={val}
                        onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                        placeholder={field.placeholder || 'https://...'}
                        className={`${inputCls(field.id)} font-mono text-2xs`}
                      />
                    )}

                    {/* Email */}
                    {field.type === 'email' && (
                      <input
                        type="email"
                        value={val}
                        onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                        placeholder={field.placeholder || 'email@example.com'}
                        className={inputCls(field.id)}
                      />
                    )}

                    {/* Number */}
                    {field.type === 'number' && (
                      <input
                        type="number"
                        min={field.validation?.min}
                        max={field.validation?.max}
                        value={val}
                        onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                        placeholder={field.placeholder || '0'}
                        className={inputCls(field.id)}
                      />
                    )}

                    {/* Date */}
                    {field.type === 'date' && (
                      <input
                        type="date"
                        value={val}
                        onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                        className={inputCls(field.id)}
                      />
                    )}

                    {/* Dropdown */}
                    {field.type === 'dropdown' && (
                      <select
                        value={val}
                        onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                        className={inputCls(field.id)}
                      >
                        <option value="">{field.placeholder || '-- Select an option --'}</option>
                        {(field.options || []).map((opt) => {
                          const optionValue = typeof opt === 'string' ? opt : opt.value;
                          const optionLabel = typeof opt === 'string' ? opt : opt.label;
                          return (
                            <option key={optionValue} value={optionValue}>
                              {optionLabel}
                            </option>
                          );
                        })}
                      </select>
                    )}

                    {/* Checkbox */}
                    {field.type === 'checkbox' && (
                      <label className="flex items-start gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) => handleDynamicChange(field.id, e.target.checked)}
                          className="mt-0.5 rounded border-border bg-surface text-accent focus:ring-accent"
                        />
                        <span className="text-2xs text-text-secondary select-none">
                          {field.placeholder || 'I acknowledge and agree.'}
                        </span>
                      </label>
                    )}

                    {/* File Upload */}
                    {field.type === 'file_upload' && (
                      <div className="space-y-1">
                        <label
                          className={`border border-dashed rounded-lg p-3 text-center bg-surface-2 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-accent transition-colors ${
                            errors[field.id] ? 'border-red-600' : 'border-border'
                          }`}
                        >
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileChange(field.id, file);
                            }}
                          />
                          <UploadCloud className="w-5 h-5 text-accent" />
                          <span className="text-2xs text-text-primary font-medium">
                            {fileAttachments[field.id]
                              ? fileAttachments[field.id].name
                              : 'Choose File or Drag & Drop'}
                          </span>
                          <span className="text-2xs text-text-muted">
                            Max {field.file_restrictions?.max_size_mb || 15}MB
                          </span>
                        </label>
                      </div>
                    )}

                    {errors[field.id] && (
                      <p className="text-red-400 text-2xs mt-1">{errors[field.id]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Submit Assignment
          </Button>
        </div>
      </form>
    </div>
  );
}
