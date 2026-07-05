import { attendanceRepository } from './attendance.repository.js';
import { attendanceEngine } from '../../core/attendance.engine.js';
import { studentRepository } from '../students/student.repository.js';
import { classRepository } from '../classes/class.repository.js';
import { sectionRepository } from '../sections/section.repository.js';
import { userRepository } from '../users/user.repository.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import {
  assertUuid,
  assertEnum,
  assertDate,
  assertInteger,
  assertArray,
  assertNumber,
  ATTENDANCE_STATUSES,
} from '../../utils/validators.js';

export const attendanceService = {
  // ── Student: একদিনের attendance mark (bulk) ──
  // body = { class_id, section_id, attendance_date, records: [{ student_id, status }] }
  async markStudents({ class_id, section_id, attendance_date, records }) {
    class_id = assertUuid(class_id, 'class_id');
    section_id = assertUuid(section_id, 'section_id', { required: false });
    attendance_date = assertDate(attendance_date, 'attendance_date');
    records = assertArray(records, 'records', { min: 1 });

    const cls = await classRepository.findById(class_id);
    if (!cls) throw new AppError('Class not found', 404);

    if (section_id) {
      const section = await sectionRepository.findById(section_id);
      if (!section) throw new AppError('Section not found', 404);
    }

    // প্রতিটি record validate + normalize (invalid status/student_id হলে এখানেই আটকাবে)
    const normalized = records.map((r, i) => ({
      student_id: assertUuid(r.student_id, `records[${i}].student_id`),
      status: assertEnum(r.status, `records[${i}].status`, ATTENDANCE_STATUSES),
    }));

    // একই student একবারের বেশি এলে duplicate — deterministic error
    const seen = new Set();
    for (const r of normalized) {
      if (seen.has(r.student_id)) {
        throw new AppError(`Duplicate student_id in records: ${r.student_id}`, 400);
      }
      seen.add(r.student_id);
    }

    const saved = await attendanceRepository.bulkMarkStudents({
      classId: class_id,
      sectionId: section_id || null,
      attendanceDate: attendance_date,
      records: normalized,
    });

    return { marked: saved.length, records: saved };
  },

  async listStudentAttendance(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);
    const [data, total] = await Promise.all([
      attendanceRepository.listStudentAttendance(queryOptions, { limit, offset }),
      attendanceRepository.countStudentAttendance(queryOptions),
    ]);
    return { data, meta: buildMeta({ total, page, limit }) };
  },

  // ── Student: মাসিক attendance % (core engine) — report card / guardian portal ──
  async getStudentMonthly(studentId, year, month) {
    studentId = assertUuid(studentId, 'studentId');
    year = assertInteger(year, 'year', { min: 2000, max: 2100 });
    month = assertInteger(month, 'month', { min: 1, max: 12 });

    const student = await studentRepository.findById(studentId);
    if (!student) throw new AppError('Student not found', 404);

    return attendanceEngine.calculateStudentMonthlyAttendance(studentId, year, month);
  },

  // ── Class: একদিনের attendance summary (core engine) — teacher dashboard ──
  async getDailyClassSummary(classId, sectionId, date) {
    classId = assertUuid(classId, 'classId');
    sectionId = assertUuid(sectionId, 'sectionId');
    date = assertDate(date, 'date');

    return attendanceEngine.calculateDailyClassSummary(classId, sectionId, date);
  },

  // ── Staff: check-in ──
  async staffCheckIn({ userId, attendance_date, ip_address, latitude, longitude }) {
    userId = assertUuid(userId, 'userId');
    attendance_date = assertDate(attendance_date, 'attendance_date');
    latitude = assertNumber(latitude, 'latitude', { required: false });
    longitude = assertNumber(longitude, 'longitude', { required: false });

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    // একই দিনে দুবার check-in আটকাও
    const existing = await attendanceRepository.findStaffLog(userId, attendance_date);
    if (existing) {
      throw new AppError('Already checked in for this date', 409);
    }

    return attendanceRepository.createCheckIn({
      userId,
      attendanceDate: attendance_date,
      ipAddress: ip_address,
      latitude,
      longitude,
    });
  },

  // ── Staff: check-out ──
  async staffCheckOut({ userId, attendance_date, latitude, longitude }) {
    userId = assertUuid(userId, 'userId');
    attendance_date = assertDate(attendance_date, 'attendance_date');
    latitude = assertNumber(latitude, 'latitude', { required: false });
    longitude = assertNumber(longitude, 'longitude', { required: false });

    const log = await attendanceRepository.findStaffLog(userId, attendance_date);
    if (!log) throw new AppError('No check-in found for this date', 404);
    if (log.check_out) throw new AppError('Already checked out for this date', 409);

    return attendanceRepository.setCheckOut({ logId: log.id, latitude, longitude });
  },

  // ── Staff: মাসিক কাজের ঘণ্টা (core engine) — HR / payroll ──
  async getStaffMonthly(userId, year, month) {
    userId = assertUuid(userId, 'userId');
    year = assertInteger(year, 'year', { min: 2000, max: 2100 });
    month = assertInteger(month, 'month', { min: 1, max: 12 });

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    return attendanceEngine.calculateStaffMonthlyWorkHours(userId, year, month);
  },
};
