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
│   ├── db.js
│   ├── redis.js
│   ├── env.js
│   ├── socket.js
│
├── api/
│   ├── v1/
│   │   ├── index.js
│
├── modules/
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.repository.js
│   │
│   ├── users/
│   ├── students/
│   ├── teachers/
│   ├── exams/
│   ├── attendance/
│   ├── roles/
│   ├── permissions/
│   ├── billing/
│
├── core/
│   ├── roll.engine.js
│   ├── ranking.engine.js
│   ├── attendance.engine.js
│   ├── permission.engine.js
│
├── services/
│   ├── queue.service.js
│   ├── cache.service.js
│
├── queues/
│   ├── roll.queue.js
│   ├── ranking.queue.js
│
├── jobs/
│   ├── roll.job.js
│   ├── ranking.job.js
│
├── middlewares/
│   ├── auth.middleware.js
│   ├── rbac.middleware.js
│   ├── error.middleware.js
│
├── utils/
│   ├── queryBuilder.js
│   ├── pagination.js
│   ├── order.js
│   ├── response.js
│
└── docs/







Module                         দায়িত্ব

auth/                          Login, JWT token, session

students/                      Student CRUD, enrollment

teachers/                      Teacher profile, subject assignment

exams/                         পরীক্ষা তৈরি, মার্কস এন্ট্রি

attendance/                    Student ও Staff উভয়ের attendanc

eroles/permissions/            RBAC system

billing/                       ফি ব্যবস্থাপনা (future scope)

core/roll.engine.js            Roll generation logic

core/ranking.engine.js         Merit list তৈরি


