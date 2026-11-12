import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSubmissionSchemaDefinition,
  validateMemberIdentification,
  validateSubmissionAgainstSchema,
  SUPPORTED_FIELD_TYPES,
  VALID_YEARS,
  VALID_DOMAINS,
} from '../src/services/schemaValidator.js';

describe('Dynamic Form Architecture: Schema Definition Validation', () => {
  it('should support all 9 required field types', () => {
    const expectedTypes = [
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
    for (const type of expectedTypes) {
      assert.ok(
        SUPPORTED_FIELD_TYPES.includes(type),
        `Expected ${type} to be in SUPPORTED_FIELD_TYPES`
      );
    }
    assert.equal(SUPPORTED_FIELD_TYPES.length, 9);
  });

  it('should accept a fully valid schema containing all 9 field types', () => {
    const schema = [
      { id: 'short_ans', label: 'Brief Summary', type: 'short_text', required: true },
      { id: 'long_ans', label: 'Detailed Explanation', type: 'long_text', required: true },
      { id: 'project_url', label: 'Project URL', type: 'url', required: true },
      { id: 'contact_email', label: 'Contact Email', type: 'email', required: false },
      { id: 'score', label: 'Self Assessment', type: 'number', required: false, validation: { min: 1, max: 10 } },
      { id: 'due_date', label: 'Completion Date', type: 'date', required: false },
      { id: 'track', label: 'Track', type: 'dropdown', required: true, options: ['Frontend', 'Backend'] },
      { id: 'agreed', label: 'I agree', type: 'checkbox', required: true },
      {
        id: 'doc_upload',
        label: 'Upload Document',
        type: 'file_upload',
        required: false,
        file_restrictions: { max_size_mb: 10, allowed_types: ['application/pdf'] },
      },
    ];

    const result = validateSubmissionSchemaDefinition(schema);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('should reject schemas with duplicate identifiers or invalid types', () => {
    const invalidSchema = [
      { id: 'duplicate_id', label: 'Field 1', type: 'short_text' },
      { id: 'duplicate_id', label: 'Field 2', type: 'short_text' },
      { id: 'unknown_type', label: 'Field 3', type: 'unsupported_gadget' },
      { id: 'invalid id with spaces', label: 'Field 4', type: 'url' },
      { id: 'empty_dropdown', label: 'Dropdown', type: 'dropdown', options: [] },
    ];

    const result = validateSubmissionSchemaDefinition(invalidSchema);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('Duplicate field id')));
    assert.ok(result.errors.some((e) => e.includes('Invalid field type')));
    assert.ok(result.errors.some((e) => e.includes('may only contain alphanumeric characters')));
    assert.ok(result.errors.some((e) => e.includes('Dropdown field must provide a non-empty array')));
  });
});

describe('Member Identification Validation', () => {
  it('should validate complete and correct member details', () => {
    const input = {
      member_name: 'Aditya Raman',
      member_email: 'aditya@srmist.edu.in',
      department: 'cse',
      year: '2nd Year',
      section: 'b',
      club_domain: 'Web Development',
    };

    const result = validateMemberIdentification(input);
    assert.equal(result.valid, true);
    assert.equal(result.data.member_name, 'Aditya Raman');
    assert.equal(result.data.member_email, 'aditya@srmist.edu.in');
    assert.equal(result.data.department, 'CSE');
    assert.equal(result.data.year, '2nd Year');
    assert.equal(result.data.section, 'B');
    assert.equal(result.data.club_domain, 'Web Development');
  });

  it('should reject missing identification fields or invalid years/domains', () => {
    const invalidInput = {
      member_name: '',
      department: '   ',
      year: '5th Year', // Invalid year
      section: '',
      club_domain: 'Quantum Computing', // Invalid domain
    };

    const result = validateMemberIdentification(invalidInput);
    assert.equal(result.valid, false);
    assert.ok(result.errors.member_name);
    assert.ok(result.errors.department);
    assert.ok(result.errors.year);
    assert.ok(result.errors.section);
    assert.ok(result.errors.club_domain);
  });
});

describe('Dynamic Answers Validation Against Schema', () => {
  const testSchema = [
    {
      id: 'repo_url',
      label: 'GitHub URL',
      type: 'url',
      required: true,
      validation: { pattern: '^https:\\/\\/github\\.com\\/.+$' },
    },
    {
      id: 'contact_email',
      label: 'Email',
      type: 'email',
      required: true,
    },
    {
      id: 'framework',
      label: 'Framework',
      type: 'dropdown',
      required: true,
      options: ['React', 'Vue', 'Angular'],
    },
    {
      id: 'hours',
      label: 'Hours Spent',
      type: 'number',
      required: false,
      validation: { min: 1, max: 40 },
    },
    {
      id: 'completion_date',
      label: 'Completion Date',
      type: 'date',
      required: true,
    },
    {
      id: 'honor_code',
      label: 'Honor Code',
      type: 'checkbox',
      required: true,
    },
    {
      id: 'project_zip',
      label: 'Project Zip File',
      type: 'file_upload',
      required: true,
      file_restrictions: {
        max_size_mb: 5,
        allowed_types: ['application/zip', '.zip'],
      },
    },
  ];

  it('should accept valid submissions matching all field types and constraints', () => {
    const answers = {
      repo_url: 'https://github.com/skynet/task-1',
      contact_email: 'member@srmist.edu.in',
      framework: 'React',
      hours: 15,
      completion_date: '2026-11-15',
      honor_code: true,
    };

    const uploadedFiles = {
      project_zip: {
        originalname: 'solution.zip',
        mimetype: 'application/zip',
        size: 1024 * 1024 * 2, // 2MB
      },
    };

    const result = validateSubmissionAgainstSchema(testSchema, answers, uploadedFiles);
    assert.equal(result.valid, true);
    assert.equal(Object.keys(result.errors).length, 0);
    assert.equal(result.sanitizedData.repo_url, 'https://github.com/skynet/task-1');
    assert.equal(result.sanitizedData.framework, 'React');
    assert.equal(result.sanitizedData.hours, 15);
  });

  it('should reject invalid URLs, emails, dates, out-of-range numbers, and unallowed dropdown values', () => {
    const badAnswers = {
      repo_url: 'not-a-valid-url',
      contact_email: 'invalid-email-address',
      framework: 'Ember.js', // Not in options
      hours: 99, // Exceeds max 40
      completion_date: 'invalid-date',
      honor_code: false, // Required checkbox
    };

    const uploadedFiles = {}; // Missing required file_upload

    const result = validateSubmissionAgainstSchema(testSchema, badAnswers, uploadedFiles);
    assert.equal(result.valid, false);
    assert.ok(result.errors.repo_url);
    assert.ok(result.errors.contact_email);
    assert.ok(result.errors.framework);
    assert.ok(result.errors.hours);
    assert.ok(result.errors.completion_date);
    assert.ok(result.errors.honor_code);
    assert.ok(result.errors.project_zip);
  });

  it('should enforce file upload size and MIME type restrictions', () => {
    const answers = {
      repo_url: 'https://github.com/skynet/task-1',
      contact_email: 'member@srmist.edu.in',
      framework: 'React',
      completion_date: '2026-11-15',
      honor_code: true,
    };

    // File exceeds 5MB limit
    const oversizedFile = {
      project_zip: {
        originalname: 'solution.zip',
        mimetype: 'application/zip',
        size: 1024 * 1024 * 8, // 8MB > 5MB
      },
    };

    const oversizedResult = validateSubmissionAgainstSchema(testSchema, answers, oversizedFile);
    assert.equal(oversizedResult.valid, false);
    assert.ok(oversizedResult.errors.project_zip.includes('exceeds maximum allowed size'));

    // File has wrong MIME / extension type
    const wrongTypeFile = {
      project_zip: {
        originalname: 'virus.exe',
        mimetype: 'application/x-msdownload',
        size: 1024 * 100,
      },
    };

    const wrongTypeResult = validateSubmissionAgainstSchema(testSchema, answers, wrongTypeFile);
    assert.equal(wrongTypeResult.valid, false);
    assert.ok(wrongTypeResult.errors.project_zip.includes('File type not allowed'));
  });
});
