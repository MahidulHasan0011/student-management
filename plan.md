Admission Exam
↓
exam_results

Quiz
↓
exam_results

Mid
↓
exam_results

Final
↓
exam_results

Generate Merit
↓

Total Marks Calculate

      ↓

Sort Desc

      ↓

Generate Rolls

      ↓

student_enrollments.roll_number update

<!-- structure -->

src/
│
├── app.js
├── server.js
│
├── config/
│ ├── db.js
│ ├── redis.js
│ ├── env.js
│ ├── socket.js
│
├── api/
│ ├── v1/
│ │ ├── index.js
│
├── modules/
│ ├── auth/
│ │ ├── auth.routes.js
│ │ ├── auth.controller.js
│ │ ├── auth.service.js
│ │ ├── auth.repository.js
│ │
│ ├── users/
│ ├── students/
│ ├── teachers/
│ ├── exams/
│ ├── attendance/
│ ├── roles/
│ ├── permissions/
│ ├── billing/
│
├── core/  
│ ├── roll.engine.js
│ ├── ranking.engine.js
│ ├── attendance.engine.js
│ ├── permission.engine.js
│
├── services/
│ ├── queue.service.js
│ ├── cache.service.js
│
├── queues/
│ ├── roll.queue.js
│ ├── ranking.queue.js
│
├── jobs/
│ ├── roll.job.js
│ ├── ranking.job.js
│
├── middlewares/
│ ├── auth.middleware.js
│ ├── rbac.middleware.js
│ ├── error.middleware.js
│
├── utils/
│ ├── queryBuilder.js
│ ├── pagination.js
│ ├── order.js
│ ├── response.js
│
└── docs/

HTTP request
↓
controller → service → queue.service.js (job পাঠায়)
↓
ranking.queue.js (Bull/BullMQ queue)
↓
(worker process, ভিন্ন event loop)
↓
ranking.job.js (queue থেকে job নেয়)
↓
ranking.engine.js (আসল calculation logic)
↓
roll.queue.js (পরের ধাপ trigger করে)
↓
roll.job.js → roll.engine.js
↓
student_enrollments.roll_number আপডেট

core/ — pure business logic, কোনো queue/HTTP জানে না, শুধু calculation

services/ — infrastructure wrapper (Redis cache, BullMQ queue client)

queues/ — queue definition (নাম, connection)

jobs/ — worker যা queue থেকে job নিয়ে core/-এর engine call করে

দুটোই রাখা ভালো — UI-তে যদি checklist থাকে তো PUT /roles/:id/permissions ব্যবহার হবে, আর যদি একটা একটা toggle button থাকে তো এই নতুন role-permissions,
POST/role-permissions {roleId, permissionId} একটা, permission assign
POST/role-permissions/bulk {roleId, permissionIds:[]} একাধিক assign, একসাথে
