import { Router } from 'express';
import authRoutes from '../../modules/auth/auth.routes.js';
import roleRoutes from '../../modules/roles/role.routes.js';
import permissionRoutes from '../../modules/permissions/permission.routes.js';
import userRoutes from '../../modules/users/user.routes.js';
import studentRoutes from '../../modules/students/student.Routes.js';
import academicSessionRoutes from '../../modules/academic-sessions/academic-session.routes.js';
import teacherRoutes from '../../modules/teachers/teacher.routes.js';
import classRoutes from '../../modules/classes/class.routes.js';
import subjectRoutes from '../../modules/subjects/subject.routes.js';
import sectionRoutes from '../../modules/sections/section.routes.js';
import assignmentRoutes from '../../modules/subject-assignments/subject-assignment.routes.js';
import studentEnrollmentRoutes from '../../modules/student-enrollments/student-enrollment.routes.js';
import examRoutes from '../../modules/exams/exam.routes.js';
import resultRoutes from '../../modules/results/result.routes.js';
import rolePermissionRoutes from '../../modules/role-permissions/role-permission.routes.js';

const router = Router();

// use routes
router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/academic-sessions', academicSessionRoutes);
router.use('/teachers', teacherRoutes);
router.use('/classes', classRoutes);
router.use('/subjects', subjectRoutes);
router.use('/sections', sectionRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/enrollments', studentEnrollmentRoutes);
router.use('/exams', examRoutes);
router.use('/results', resultRoutes);
router.use('/role-permissions', rolePermissionRoutes);

export default router;
