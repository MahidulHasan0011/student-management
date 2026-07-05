import { Router } from 'express';
import { attendanceController } from './attendance.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

// ── Student attendance ──

/**
 * @openapi
 * /attendance/students:
 *   post:
 *     tags: [Attendance]
 *     summary: একটি ক্লাস/সেকশনের একদিনের attendance mark করা (bulk upsert)
 *     description: >-
 *       `ATTENDANCE_MARK` permission লাগে। একই student+তারিখ আগে থাকলে update হয়, নাহলে নতুন insert।
 *       পুরোটা একটাই transaction — একটাও invalid হলে সব rollback।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [class_id, attendance_date, records]
 *             properties:
 *               class_id: { type: string, format: uuid }
 *               section_id: { type: string, format: uuid, description: 'optional' }
 *               attendance_date: { type: string, format: date, example: '2026-07-05' }
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [student_id, status]
 *                   properties:
 *                     student_id: { type: string, format: uuid }
 *                     status: { type: string, enum: [PRESENT, ABSENT, LATE, EXCUSED] }
 *     responses:
 *       201: { description: mark সফল }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/students', rbacMiddleware('ATTENDANCE_MARK'), attendanceController.markStudents);

/**
 * @openapi
 * /attendance/students:
 *   get:
 *     tags: [Attendance]
 *     summary: student attendance record তালিকা (pagination + filter)
 *     description: >-
 *       `ATTENDANCE_READ` permission লাগে। student_id / class_id / section_id / attendance_date / status দিয়ে filter করা যায়।
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - { name: student_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: class_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: section_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: attendance_date, in: query, required: false, schema: { type: string, format: date } }
 *       - { name: status, in: query, required: false, schema: { type: string, enum: [PRESENT, ABSENT, LATE, EXCUSED] } }
 *     responses:
 *       200: { description: তালিকা }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/students', rbacMiddleware('ATTENDANCE_READ'), attendanceController.listStudents);

/**
 * @openapi
 * /attendance/students/{studentId}/monthly:
 *   get:
 *     tags: [Attendance]
 *     summary: একজন student-এর মাসিক attendance % (report card)
 *     description: '`ATTENDANCE_READ` permission লাগে। LATE-কেও present ধরা হয়।'
 *     parameters:
 *       - { name: studentId, in: path, required: true, schema: { type: string, format: uuid } }
 *       - { name: year, in: query, required: true, schema: { type: integer, example: 2026 } }
 *       - { name: month, in: query, required: true, schema: { type: integer, minimum: 1, maximum: 12, example: 7 } }
 *     responses:
 *       200: { description: মাসিক সারসংক্ষেপ + attendance_percentage }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  '/students/:studentId/monthly',
  rbacMiddleware('ATTENDANCE_READ'),
  attendanceController.studentMonthly,
);

/**
 * @openapi
 * /attendance/class/{classId}/{sectionId}/daily:
 *   get:
 *     tags: [Attendance]
 *     summary: একটি ক্লাস/সেকশনের একদিনের attendance summary (teacher dashboard)
 *     description: '`ATTENDANCE_READ` permission লাগে। PRESENT/ABSENT/LATE/EXCUSED সংখ্যা ফেরত দেয়।'
 *     parameters:
 *       - { name: classId, in: path, required: true, schema: { type: string, format: uuid } }
 *       - { name: sectionId, in: path, required: true, schema: { type: string, format: uuid } }
 *       - { name: date, in: query, required: true, schema: { type: string, format: date, example: '2026-07-05' } }
 *     responses:
 *       200: { description: summary }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  '/class/:classId/:sectionId/daily',
  rbacMiddleware('ATTENDANCE_READ'),
  attendanceController.dailyClassSummary,
);

// ── Staff attendance ──

/**
 * @openapi
 * /attendance/staff/check-in:
 *   post:
 *     tags: [Attendance]
 *     summary: staff check-in
 *     description: >-
 *       `ATTENDANCE_MARK` permission লাগে। userId না দিলে লগইন করা ইউজারের check-in হয়।
 *       একই দিনে দুবার check-in করলে 409।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [attendance_date]
 *             properties:
 *               userId: { type: string, format: uuid, description: 'optional — না দিলে নিজের' }
 *               attendance_date: { type: string, format: date }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       201: { description: checked in }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post(
  '/staff/check-in',
  rbacMiddleware('ATTENDANCE_MARK'),
  attendanceController.staffCheckIn,
);

/**
 * @openapi
 * /attendance/staff/check-out:
 *   post:
 *     tags: [Attendance]
 *     summary: staff check-out (কাজের মিনিট স্বয়ংক্রিয় হিসাব)
 *     description: >-
 *       `ATTENDANCE_MARK` permission লাগে। check-in না থাকলে 404, আগেই check-out হয়ে থাকলে 409।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [attendance_date]
 *             properties:
 *               userId: { type: string, format: uuid, description: 'optional — না দিলে নিজের' }
 *               attendance_date: { type: string, format: date }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       200: { description: checked out }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post(
  '/staff/check-out',
  rbacMiddleware('ATTENDANCE_MARK'),
  attendanceController.staffCheckOut,
);

/**
 * @openapi
 * /attendance/staff/{userId}/monthly:
 *   get:
 *     tags: [Attendance]
 *     summary: একজন staff-এর মাসিক কাজের ঘণ্টা (HR / payroll)
 *     description: '`ATTENDANCE_READ` permission লাগে। days_present, total_work_minutes, total_work_hours ফেরত দেয়।'
 *     parameters:
 *       - { name: userId, in: path, required: true, schema: { type: string, format: uuid } }
 *       - { name: year, in: query, required: true, schema: { type: integer, example: 2026 } }
 *       - { name: month, in: query, required: true, schema: { type: integer, minimum: 1, maximum: 12, example: 7 } }
 *     responses:
 *       200: { description: মাসিক কাজের ঘণ্টা }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  '/staff/:userId/monthly',
  rbacMiddleware('ATTENDANCE_READ'),
  attendanceController.staffMonthly,
);

export default router;
