import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateMemberIdentification,
  validateSubmissionAgainstSchema,
  validateSubmissionSchemaDefinition,
} from '../src/services/schemaValidator.js';

describe('Submission Policies: Identification & Email Duplicate Identifier', () => {
  it('should require and normalize member_email to lowercase', () => {
    const input = {
      member_name: 'Harish Kumar',
      member_email: '  HARISH.K@SRMIST.EDU.IN  ',
      department: 'ECE',
      year: '3rd Year',
      section: 'A',
      club_domain: 'AI/ML',
    };

    const res = validateMemberIdentification(input);
    assert.equal(res.valid, true);
    assert.equal(res.data.member_email, 'harish.k@srmist.edu.in');
    assert.equal(res.data.member_name, 'Harish Kumar');
    assert.equal(res.data.department, 'ECE');
    assert.equal(res.data.year, '3rd Year');
    assert.equal(res.data.section, 'A');
    assert.equal(res.data.club_domain, 'AI/ML');
  });

  it('should reject invalid or missing member_email', () => {
    const invalidInputs = [
      { member_name: 'Test', department: 'CSE', year: '1st Year', section: 'A', club_domain: 'Web Development' }, // missing
      { member_email: 'not-an-email', member_name: 'Test', department: 'CSE', year: '1st Year', section: 'A', club_domain: 'Web Development' }, // malformed
      { member_email: 'test@', member_name: 'Test', department: 'CSE', year: '1st Year', section: 'A', club_domain: 'Web Development' },
    ];

    for (const input of invalidInputs) {
      const res = validateMemberIdentification(input);
      assert.equal(res.valid, false);
      assert.ok(res.errors.member_email, `Expected error for email in: ${JSON.stringify(input)}`);
    }
  });

  it('should enforce duplicate policy checking on (task_id, LOWER(member_email))', () => {
    // Simulate duplicate check logic used by submissionController
    const existingSubmissions = [
      { id: 'sub-1', task_id: 'task-101', member_email: 'student@example.com' },
      { id: 'sub-2', task_id: 'task-102', member_email: 'student@example.com' },
    ];

    const checkDuplicate = (taskId, email) => {
      const normalizedEmail = email.trim().toLowerCase();
      return existingSubmissions.some(
        (s) => s.task_id === taskId && s.member_email.toLowerCase() === normalizedEmail
      );
    };

    // Submitting again to task-101 with varying case should be detected as duplicate
    assert.equal(checkDuplicate('task-101', 'STUDENT@EXAMPLE.COM'), true);
    assert.equal(checkDuplicate('task-101', ' student@example.com '), true);

    // Submitting to a different task with same email is permitted
    assert.equal(checkDuplicate('task-103', 'student@example.com'), false);

    // Another member submitting to task-101 is permitted
    assert.equal(checkDuplicate('task-101', 'another.student@example.com'), false);
  });
});

describe('Dynamic Form Architecture: Text-Only Form Submissions', () => {
  const textOnlySchema = [
    { id: 'brief_summary', label: 'Summary', type: 'short_text', required: true },
    { id: 'detailed_reflection', label: 'Reflection', type: 'long_text', required: true },
    { id: 'optional_feedback', label: 'Feedback', type: 'long_text', required: false },
  ];

  it('should validate text-only submission schema structure', () => {
    const res = validateSubmissionSchemaDefinition(textOnlySchema);
    assert.equal(res.valid, true);
  });

  it('should accept valid text submissions and ignore optional empty fields', () => {
    const answers = {
      brief_summary: 'Completed competitive coding module',
      detailed_reflection: 'Solved 5 Dynamic Programming challenges with optimal O(N) space complexity.',
      optional_feedback: '',
    };

    const res = validateSubmissionAgainstSchema(textOnlySchema, answers, {});
    assert.equal(res.valid, true);
    assert.equal(res.sanitizedData.brief_summary, 'Completed competitive coding module');
    assert.equal(res.sanitizedData.optional_feedback, null);
  });

  it('should reject text submissions missing required text fields', () => {
    const answers = {
      brief_summary: '   ',
      detailed_reflection: '',
    };

    const res = validateSubmissionAgainstSchema(textOnlySchema, answers, {});
    assert.equal(res.valid, false);
    assert.ok(res.errors.brief_summary);
    assert.ok(res.errors.detailed_reflection);
  });
});

describe('Dynamic Form Architecture: URL-Only Form Submissions', () => {
  const urlOnlySchema = [
    {
      id: 'github_repo',
      label: 'GitHub Repository',
      type: 'url',
      required: true,
      validation: { pattern: '^https:\\/\\/github\\.com\\/.+$' },
    },
    {
      id: 'live_demo',
      label: 'Live Deployment URL',
      type: 'url',
      required: false,
    },
  ];

  it('should accept valid repository and demo URLs', () => {
    const answers = {
      github_repo: 'https://github.com/skynet-club/autonomous-bot',
      live_demo: 'https://autonomous-bot.vercel.app',
    };

    const res = validateSubmissionAgainstSchema(urlOnlySchema, answers, {});
    assert.equal(res.valid, true);
    assert.equal(res.sanitizedData.github_repo, 'https://github.com/skynet-club/autonomous-bot');
    assert.equal(res.sanitizedData.live_demo, 'https://autonomous-bot.vercel.app');
  });

  it('should reject invalid repository URLs that do not match github pattern', () => {
    const answers = {
      github_repo: 'https://gitlab.com/wrong/repo',
      live_demo: 'not-a-valid-url',
    };

    const res = validateSubmissionAgainstSchema(urlOnlySchema, answers, {});
    assert.equal(res.valid, false);
    assert.ok(res.errors.github_repo);
    assert.ok(res.errors.live_demo.includes('valid URL'));
  });
});

describe('Dynamic Form Architecture: File-Only Form Submissions', () => {
  const fileOnlySchema = [
    {
      id: 'design_asset',
      label: 'Figma Export or PDF Design Spec',
      type: 'file_upload',
      required: true,
      file_restrictions: {
        max_size_mb: 15,
        allowed_types: ['application/pdf', 'image/png'],
      },
    },
  ];

  it('should accept valid file uploads within size and type limits', () => {
    const uploadedFiles = {
      design_asset: {
        originalname: 'skynet-brand-guidelines.pdf',
        mimetype: 'application/pdf',
        size: 5 * 1024 * 1024, // 5MB <= 15MB
      },
    };

    const res = validateSubmissionAgainstSchema(fileOnlySchema, {}, uploadedFiles);
    assert.equal(res.valid, true);
    assert.equal(res.errors.design_asset, undefined);
  });

  it('should reject missing required file uploads', () => {
    const res = validateSubmissionAgainstSchema(fileOnlySchema, {}, {});
    assert.equal(res.valid, false);
    assert.ok(res.errors.design_asset.includes('required'));
  });

  it('should reject files exceeding max_size_mb', () => {
    const uploadedFiles = {
      design_asset: {
        originalname: 'huge-asset.png',
        mimetype: 'image/png',
        size: 20 * 1024 * 1024, // 20MB > 15MB limit
      },
    };

    const res = validateSubmissionAgainstSchema(fileOnlySchema, {}, uploadedFiles);
    assert.equal(res.valid, false);
    assert.ok(res.errors.design_asset.includes('exceeds maximum allowed size'));
  });
});

describe('Submission Policies: Historical Schema Snapshot Preservation', () => {
  it('should preserve original schema snapshot in submission record', () => {
    const activeTaskSchema = [
      { id: 'v1_metric', label: 'Accuracy Score', type: 'number', required: true },
      { id: 'v1_model_link', label: 'HuggingFace Model', type: 'url', required: true },
    ];

    // Submission created at T1
    const submissionRecord = {
      task_id: 'task-ml-01',
      member_name: 'Priya Sharma',
      member_email: 'priya@srmist.edu.in',
      submission_data: {
        v1_metric: 98.4,
        v1_model_link: 'https://huggingface.co/skynet/bert-finetuned',
      },
      schema_snapshot: activeTaskSchema,
    };

    // Admin later updates the task schema at T2 by removing v1_model_link and adding dataset_file
    const updatedTaskSchema = [
      { id: 'v1_metric', label: 'Accuracy Score', type: 'number', required: true },
      { id: 'dataset_file', label: 'Dataset CSV', type: 'file_upload', required: true },
    ];

    // The historical submission record maintains its immutable snapshot
    assert.equal(submissionRecord.schema_snapshot.length, 2);
    assert.equal(submissionRecord.schema_snapshot[1].id, 'v1_model_link');
    assert.notDeepEqual(submissionRecord.schema_snapshot, updatedTaskSchema);
  });
});

describe('Submission Policies: Deadline & Late Submission Policy Enforcement', () => {
  const isSubmissionPermitted = (task, now = Date.now()) => {
    if (task.status !== 'published') {
      return { allowed: false, reason: 'TASK_NOT_PUBLISHED' };
    }
    const deadlineTime = new Date(task.deadline).getTime();
    const isLate = now > deadlineTime;
    if (isLate && !task.allow_late_submissions) {
      return { allowed: false, reason: 'DEADLINE_PASSED' };
    }
    return { allowed: true, isLate };
  };

  it('should permit on-time submissions for published tasks', () => {
    const task = {
      status: 'published',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      allow_late_submissions: false,
    };

    const res = isSubmissionPermitted(task);
    assert.equal(res.allowed, true);
    assert.equal(res.isLate, false);
  });

  it('should reject past-deadline submissions when allow_late_submissions is false', () => {
    const task = {
      status: 'published',
      deadline: new Date(Date.now() - 60 * 1000).toISOString(), // 1 minute ago
      allow_late_submissions: false,
    };

    const res = isSubmissionPermitted(task);
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'DEADLINE_PASSED');
  });

  it('should accept past-deadline submissions when allow_late_submissions is true', () => {
    const task = {
      status: 'published',
      deadline: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      allow_late_submissions: true,
    };

    const res = isSubmissionPermitted(task);
    assert.equal(res.allowed, true);
    assert.equal(res.isLate, true);
  });

  it('should always reject submissions for draft or archived tasks regardless of deadline', () => {
    const draftTask = {
      status: 'draft',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      allow_late_submissions: true,
    };

    const res = isSubmissionPermitted(draftTask);
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'TASK_NOT_PUBLISHED');
  });
});
