/**
 * Dynamic Form Schema Validator
 * Validates admin task schemas and dynamic member submissions against active schemas.
 */

export const SUPPORTED_FIELD_TYPES = [
  'short_text',
  'long_text',
  'url',
  'email',
  'number',
  'date',
  'dropdown',
  'checkbox',
  'file_upload',
];

export const VALID_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export const VALID_DOMAINS = [
  'Web Development',
  'AI/ML',
  'Competitive Programming',
  'Content & Design',
  'PR & Marketing',
];

export const VALID_TASK_DOMAINS = [...VALID_DOMAINS, 'All'];

export const VALID_TASK_STATUSES = ['draft', 'published', 'archived'];

export const VALID_SUBMISSION_STATUSES = [
  'submitted',
  'under_review',
  'accepted',
  'rejected',
  'archived',
];

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const URL_REGEX = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:T.*)?$/;

/**
 * Validates the schema definition itself (configured by an admin).
 * Ensures every field adheres to system requirements.
 * @param {Array} schema - The submission_schema JSON array
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSubmissionSchemaDefinition(schema) {
  const errors = [];

  if (!Array.isArray(schema)) {
    return { valid: false, errors: ['submission_schema must be an array of field definitions.'] };
  }

  const seenIds = new Set();

  schema.forEach((field, index) => {
    const prefix = `Field [${index}]:`;

    if (!field || typeof field !== 'object') {
      errors.push(`${prefix} Must be an object.`);
      return;
    }

    // Validate identifier (id)
    if (!field.id || typeof field.id !== 'string') {
      errors.push(`${prefix} Must have a non-empty string identifier (id).`);
    } else {
      const sanitizedId = field.id.trim();
      if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedId)) {
        errors.push(`${prefix} Field id '${sanitizedId}' may only contain alphanumeric characters, underscores, and hyphens.`);
      }
      if (seenIds.has(sanitizedId)) {
        errors.push(`${prefix} Duplicate field id '${sanitizedId}'. Identifiers must be unique.`);
      }
      seenIds.add(sanitizedId);
    }

    // Validate label
    if (!field.label || typeof field.label !== 'string' || !field.label.trim()) {
      errors.push(`${prefix} Must have a valid non-empty label.`);
    }

    // Validate type
    if (!field.type || !SUPPORTED_FIELD_TYPES.includes(field.type)) {
      errors.push(
        `${prefix} Invalid field type '${field.type}'. Must be one of: ${SUPPORTED_FIELD_TYPES.join(', ')}.`
      );
    }

    // Dropdown specific validation
    if (field.type === 'dropdown') {
      if (!Array.isArray(field.options) || field.options.length === 0) {
        errors.push(`${prefix} Dropdown field must provide a non-empty array of options.`);
      } else {
        field.options.forEach((opt, optIdx) => {
          if (typeof opt !== 'string' && (typeof opt !== 'object' || !opt.value)) {
            errors.push(`${prefix} Option [${optIdx}] must be a string or an object with a 'value' property.`);
          }
        });
      }
    }

    // File upload specific validation
    if (field.type === 'file_upload' && field.file_restrictions) {
      const fr = field.file_restrictions;
      if (fr.max_size_mb && (typeof fr.max_size_mb !== 'number' || fr.max_size_mb <= 0)) {
        errors.push(`${prefix} file_restrictions.max_size_mb must be a positive number.`);
      }
      if (fr.allowed_types && !Array.isArray(fr.allowed_types)) {
        errors.push(`${prefix} file_restrictions.allowed_types must be an array of MIME types or file extensions.`);
      }
    }

    // Custom pattern validation check
    if (field.validation && field.validation.pattern) {
      try {
        new RegExp(field.validation.pattern);
      } catch (e) {
        errors.push(`${prefix} Invalid regex pattern in validation.pattern: ${e.message}`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates standard member identification fields.
 * These are strictly required and cannot be omitted.
 * @param {object} body - Request body containing member identification
 * @returns {{ valid: boolean, errors: Record<string, string>, data: object }}
 */
export function validateMemberIdentification(body) {
  const errors = {};
  const data = {};

  // member_name
  if (!body.member_name || typeof body.member_name !== 'string' || !body.member_name.trim()) {
    errors.member_name = 'Full name (member_name) is required.';
  } else {
    data.member_name = body.member_name.trim();
  }

  // member_email (used as primary stable identifier for duplicate prevention)
  const rawEmail = (body.member_email || body.email || '').toString().trim().toLowerCase();
  if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
    errors.member_email = 'A valid email address (member_email) is required for submission confirmation.';
  } else {
    data.member_email = rawEmail;
  }

  // department
  if (!body.department || typeof body.department !== 'string' || !body.department.trim()) {
    errors.department = 'Department is required.';
  } else {
    data.department = body.department.trim().toUpperCase();
  }

  // year
  if (!body.year || typeof body.year !== 'string' || !VALID_YEARS.includes(body.year.trim())) {
    errors.year = `Year must be one of: ${VALID_YEARS.join(', ')}.`;
  } else {
    data.year = body.year.trim();
  }

  // section
  if (!body.section || typeof body.section !== 'string' || !body.section.trim()) {
    errors.section = 'Section is required.';
  } else {
    data.section = body.section.trim().toUpperCase();
  }

  // club_domain
  if (!body.club_domain || typeof body.club_domain !== 'string' || !VALID_DOMAINS.includes(body.club_domain.trim())) {
    errors.club_domain = `Club domain must be one of: ${VALID_DOMAINS.join(', ')}.`;
  } else {
    data.club_domain = body.club_domain.trim();
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data,
  };
}

/**
 * Validates dynamic submission answers against the task's active submission_schema.
 * @param {Array} schema - The task's submission_schema array
 * @param {object} submissionData - Dynamic field values submitted by member
 * @param {object} uploadedFiles - Map of fieldId -> uploaded file metadata (from multer/storage)
 * @returns {{ valid: boolean, errors: Record<string, string>, sanitizedData: object }}
 */
export function validateSubmissionAgainstSchema(schema, submissionData = {}, uploadedFiles = {}) {
  const errors = {};
  const sanitized = {};

  if (!Array.isArray(schema)) {
    return { valid: true, errors: {}, sanitizedData: submissionData };
  }

  for (const field of schema) {
    const fieldId = field.id;
    let value = submissionData[fieldId];
    const file = uploadedFiles[fieldId];

    // 1. Required Check
    const hasValue =
      value !== undefined &&
      value !== null &&
      (typeof value === 'string' ? value.trim() !== '' : value !== '') &&
      !(Array.isArray(value) && value.length === 0);
    const hasFile = file !== undefined && file !== null;

    if (field.required) {
      if (field.type === 'file_upload') {
        if (!hasFile && !hasValue) {
          errors[fieldId] = `${field.label} is required. Please upload the requested file.`;
          continue;
        }
      } else if (field.type === 'checkbox') {
        if (value !== true && value !== 'true' && value !== 1 && value !== '1') {
          errors[fieldId] = `${field.label} must be agreed to / checked.`;
          continue;
        }
      } else if (!hasValue) {
        errors[fieldId] = `${field.label} is required.`;
        continue;
      }
    }

    // If optional and empty, continue
    if (!hasValue && !hasFile) {
      sanitized[fieldId] = null;
      continue;
    }

    // 2. Type-specific validation
    switch (field.type) {
      case 'short_text': {
        const strVal = String(value).trim();
        const minL = field.validation?.min_length;
        const maxL = field.validation?.max_length || 500;

        if (minL && strVal.length < minL) {
          errors[fieldId] = `${field.label} must be at least ${minL} characters.`;
        } else if (strVal.length > maxL) {
          errors[fieldId] = `${field.label} must not exceed ${maxL} characters.`;
        } else if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(strVal)) {
          errors[fieldId] = field.validation.custom_error || `${field.label} does not match the expected pattern.`;
        } else {
          sanitized[fieldId] = strVal;
        }
        break;
      }

      case 'long_text': {
        const strVal = String(value).trim();
        const minL = field.validation?.min_length;
        const maxL = field.validation?.max_length || 10000;

        if (minL && strVal.length < minL) {
          errors[fieldId] = `${field.label} must be at least ${minL} characters.`;
        } else if (strVal.length > maxL) {
          errors[fieldId] = `${field.label} must not exceed ${maxL} characters.`;
        } else {
          sanitized[fieldId] = strVal;
        }
        break;
      }

      case 'url': {
        const urlStr = String(value).trim();
        if (!URL_REGEX.test(urlStr)) {
          errors[fieldId] = `${field.label} must be a valid URL starting with http:// or https://`;
        } else if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(urlStr)) {
          errors[fieldId] = field.validation.custom_error || `${field.label} does not meet requirements.`;
        } else {
          sanitized[fieldId] = urlStr;
        }
        break;
      }

      case 'email': {
        const emailStr = String(value).trim().toLowerCase();
        if (!EMAIL_REGEX.test(emailStr)) {
          errors[fieldId] = `${field.label} must be a valid email address.`;
        } else {
          sanitized[fieldId] = emailStr;
        }
        break;
      }

      case 'number': {
        const numVal = Number(value);
        if (Number.isNaN(numVal)) {
          errors[fieldId] = `${field.label} must be a valid number.`;
        } else {
          const min = field.validation?.min;
          const max = field.validation?.max;
          if (min !== undefined && numVal < min) {
            errors[fieldId] = `${field.label} must be at least ${min}.`;
          } else if (max !== undefined && numVal > max) {
            errors[fieldId] = `${field.label} must not exceed ${max}.`;
          } else {
            sanitized[fieldId] = numVal;
          }
        }
        break;
      }

      case 'date': {
        const dateStr = String(value).trim();
        if (!DATE_REGEX.test(dateStr) || Number.isNaN(Date.parse(dateStr))) {
          errors[fieldId] = `${field.label} must be a valid date in YYYY-MM-DD format.`;
        } else {
          sanitized[fieldId] = dateStr;
        }
        break;
      }

      case 'dropdown': {
        const rawOpt = String(value).trim();
        const allowedOptions = (field.options || []).map((opt) =>
          typeof opt === 'string' ? opt : opt.value
        );

        if (!allowedOptions.includes(rawOpt)) {
          errors[fieldId] = `Invalid option selected for ${field.label}. Must be one of: ${allowedOptions.join(', ')}`;
        } else {
          sanitized[fieldId] = rawOpt;
        }
        break;
      }

      case 'checkbox': {
        const boolVal = value === true || value === 'true' || value === 1 || value === '1';
        sanitized[fieldId] = boolVal;
        break;
      }

      case 'file_upload': {
        // Can either be an attached file or previously uploaded file metadata
        const fileObj = file || (typeof value === 'object' ? value : null);

        if (fileObj) {
          const restrictions = field.file_restrictions || {};
          const maxMb = restrictions.max_size_mb || 15;
          const maxBytes = maxMb * 1024 * 1024;

          if (fileObj.size && fileObj.size > maxBytes) {
            errors[fieldId] = `${field.label} exceeds maximum allowed size of ${maxMb}MB.`;
          } else if (restrictions.allowed_types && restrictions.allowed_types.length > 0) {
            const mimeType = (fileObj.mimetype || fileObj.mime_type || '').toLowerCase();
            const originalName = (fileObj.originalname || fileObj.file_name || '').toLowerCase();

            const isAllowed = restrictions.allowed_types.some((allowed) => {
              const cleaned = allowed.toLowerCase().trim();
              if (cleaned.startsWith('.')) {
                return originalName.endsWith(cleaned);
              }
              return mimeType === cleaned || mimeType.startsWith(cleaned.replace('*', ''));
            });

            if (!isAllowed) {
              errors[fieldId] = `${field.label}: File type not allowed. Permitted types: ${restrictions.allowed_types.join(', ')}`;
            } else {
              sanitized[fieldId] = fileObj;
            }
          } else {
            sanitized[fieldId] = fileObj;
          }
        }
        break;
      }

      default:
        sanitized[fieldId] = value;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: sanitized,
  };
}
