import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';
import { entitySchemas } from '../docs/schemas.js';

// ── OpenAPI base definition ─────────────────────────────────────────────
// reusable components (security, schema, response) এখানে একবার ডিফাইন করি,
// তারপর প্রতিটি route ফাইলে JSDoc (@openapi) দিয়ে শুধু path ডকুমেন্ট করি — DRY.
const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Student Management System API',
    version: '1.0.0',
    description:
      'School ERP REST API — JWT auth, permission-based RBAC.\n\n' +
      '**Auth:** প্রথমে `POST /auth/login` দিয়ে `accessToken` নিন, ' +
      'তারপর উপরের **Authorize** বাটনে সেটি বসান (Bearer)। ' +
      'প্রতিটি protected endpoint-এ নির্দিষ্ট permission লাগে (যেমন `STUDENT_READ`)।',
  },
  servers: [{ url: `http://localhost:${env.PORT}/api/v1`, description: 'Local (v1)' }],
  // সব endpoint ডিফল্টভাবে bearer auth চায়; auth/login-এ override করে খুলে দেওয়া হয়
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Login, token refresh, logout, current user' },
    { name: 'Users', description: 'System user management' },
    { name: 'Roles', description: 'Role CRUD' },
    { name: 'Permissions', description: 'Permission CRUD' },
    { name: 'Role-Permissions', description: 'Role ↔ permission assignment' },
    { name: 'Students', description: 'Student records' },
    { name: 'Teachers', description: 'Teacher records' },
    { name: 'Classes', description: 'Class CRUD' },
    { name: 'Sections', description: 'Section CRUD' },
    { name: 'Subjects', description: 'Subject CRUD' },
    { name: 'Subject-Assignments', description: 'Teacher ↔ subject ↔ class assignment' },
    { name: 'Academic-Sessions', description: 'Academic session/year' },
    { name: 'Enrollments', description: 'Student enrollment into class/section' },
    { name: 'Exams', description: 'Exam CRUD' },
    { name: 'Exam-Results', description: 'Exam result entry' },
    { name: 'Ranking', description: 'Rank generation & locks' },
    { name: 'Uploads', description: 'Pre-signed file upload (S3/MinIO)' },
    { name: 'Error-Logs', description: 'Server error log (admin only)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token. ফরম্যাট: `Bearer <accessToken>`',
      },
    },
    schemas: {
      // entity response schemas (src/docs/schemas.js থেকে) — route ফাইল $ref দিয়ে ব্যবহার করে
      ...entitySchemas,
      // ── envelope: প্রতিটি সফল response এই শেপে আসে ──
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          data: { type: 'object', nullable: true },
          meta: { type: 'object', nullable: true },
        },
      },
      // ── envelope: প্রতিটি error response এই শেপে আসে ──
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Something went wrong' },
          errors: {
            nullable: true,
            description: 'validation error হলে ফিল্ড-ভিত্তিক বিস্তারিত',
            example: null,
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 137 },
          totalPages: { type: 'integer', example: 7 },
        },
      },
    },
    parameters: {
      IdParam: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'রিসোর্সের UUID',
        schema: { type: 'string', format: 'uuid' },
      },
      PageQuery: {
        name: 'page',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      LimitQuery: {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      },
    },
    responses: {
      Unauthorized: {
        description: '401 — টোকেন নেই / মেয়াদ শেষ / অবৈধ',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Authorization token required' },
          },
        },
      },
      Forbidden: {
        description: '403 — এই কাজের permission নেই',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'You do not have permission to perform this action',
            },
          },
        },
      },
      NotFound: {
        description: '404 — রিসোর্স পাওয়া যায়নি',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Resource not found' },
          },
        },
      },
      ValidationError: {
        description: '400 — ইনপুট validation ব্যর্থ',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Validation failed', errors: { field: 'reason' } },
          },
        },
      },
      Conflict: {
        description: '409 — ডুপ্লিকেট / ইতিমধ্যে আছে',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Duplicate entry — record already exists' },
          },
        },
      },
    },
  },
};

// route ফাইলের JSDoc (@openapi) ব্লকগুলো এখান থেকে স্ক্যান হয়
export const swaggerSpec = swaggerJSDoc({
  definition,
  apis: ['./src/modules/**/*.routes.js', './src/docs/*.js'],
});
