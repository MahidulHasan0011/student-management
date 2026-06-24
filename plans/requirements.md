# Student Management System — Requirements Document

> এই ডকুমেন্টে প্রজেক্টের সম্পূর্ণ চাহিদা, এখন পর্যন্ত যা করা হয়েছে, এবং যা বাকি আছে তা লেখা আছে।
> এটা একটা living document — নতুন সিদ্ধান্ত নেওয়া হলে এখানে আপডেট করতে হবে।

---

## ১. প্রজেক্ট পরিচিতি

একটি স্কুল ব্যবস্থাপনা সিস্টেম (School/Student Management System — SMS) যা নিচের কাজগুলো করে:

- ছাত্র, শিক্ষক, অভিভাবকের তথ্য ব্যবস্থাপনা
- ক্লাস, সেকশন, বিষয়, শিক্ষাবর্ষ ব্যবস্থাপনা
- পরীক্ষা ও রেজাল্ট এন্ট্রি
- **স্বয়ংক্রিয় Roll Number ও Rank Generation** (মেধাক্রম অনুযায়ী)
- উপস্থিতি ব্যবস্থাপনা (ছাত্র ও স্টাফ)
- Role-based Access Control (RBAC)
- ফি ব্যবস্থাপনা (পরিকল্পিত, এখনো implement হয়নি)

---

## ২. টেকনিক্যাল স্ট্যাক

| উপাদান | প্রযুক্তি |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| Module System | **ESM** (`"type": "module"` — `require()`/`module.exports` ব্যবহার নিষিদ্ধ) |
| Cache | Redis |
| Queue/Background Job | BullMQ |
| Auth | JWT (access + refresh token, rotation সহ) |
| Password Hashing | bcryptjs |

---

## ৩. প্রজেক্ট স্ট্রাকচার (Architecture)

```
src/
├── server.js               এন্ট্রি পয়েন্ট — Express app + BullMQ worker চালু করে
├── app.js                  Express app কনফিগারেশন (middleware, route mounting)
│
├── config/
│   ├── env.js               সব environment variable
│   ├── db.js                PostgreSQL pool + withTransaction() helper
│   └── redis.js             Redis client + TTL constants
│
├── api/v1/index.js          সব module-এর route এক জায়গায় mount হয়
│
├── modules/                  প্রতিটা module-এ ৪টা layer: repository → service → controller → routes
│   ├── auth/                 Login, refresh (rotation সহ), logout, /me
│   ├── users/                 User CRUD, password change/reset
│   ├── roles/                 Role CRUD + bulk permission sync
│   ├── permissions/           Permission CRUD
│   ├── role-permissions/      Role-Permission একক assign/revoke (granular)
│   ├── academic-sessions/     শিক্ষাবর্ষ CRUD, activate/deactivate, admission-test টগল
│   ├── classes/                Class CRUD
│   ├── sections/               Section CRUD, capacity/occupancy ব্যবস্থাপনা
│   ├── subjects/               Subject CRUD
│   ├── teachers/                Teacher CRUD (user+teacher transaction-এ তৈরি)
│   ├── students/                Student CRUD (user+student transaction-এ তৈরি, student_code auto-gen)
│   ├── student-enrollments/     Enrollment তৈরি — section optional/capacity validation
│   ├── exams/                    Exam CRUD + Publish/Unpublish workflow
│   ├── exam-results/              ❌ এখনো খালি — তৈরি করতে হবে
│   └── ranking/                   Manual ranking/roll trigger endpoint (HTTP → queue)
│
├── core/                      বিজনেস লজিক ইঞ্জিন — কোনো HTTP/queue জানে না, pure logic
│   ├── ranking.engine.js        Merit list + FIFO + tie-breaking + Scenario 1/2 লজিক
│   ├── roll.engine.js            Rank থেকে roll_number + section বিতরণ
│   ├── attendance.engine.js       মাসিক attendance শতকরা হিসাব
│   └── permission.engine.js       Redis cache-first permission resolution
│
├── services/                  Infrastructure wrapper
│   ├── cache.service.js          Generic Redis get/set/del wrapper
│   └── queue.service.js           BullMQ Queue/Worker factory + addJob helper
│
├── queues/                    Queue সংজ্ঞা
│   ├── ranking.queue.js
│   └── roll.queue.js
│
├── jobs/                       Worker — queue থেকে job নিয়ে core/ engine কল করে
│   ├── ranking.job.js
│   └── roll.job.js
│
├── middlewares/
│   ├── auth.middleware.js        JWT verify, req.user সেট করে
│   ├── rbac.middleware.js         req.user.roleId দিয়ে permission চেক করে
│   └── error.middleware.js        Global error handler (AppError + PG error code handle করে)
│
└── utils/
    ├── AppError.js                Custom error class — { message, statusCode, errors }
    ├── response.js                successResponse() / errorResponse() — সব API-র standard format
    ├── pagination.js              getPagination() / buildMeta()
    ├── queryBuilder.js             buildWhereClause() — search + filter (alias-aware)
    └── order.js                   buildOrder() — allowed sort field map থেকে নিরাপদ ORDER BY

database/
├── schema.sql                   সব টেবিল + enum তৈরি
├── seed.sql                      Default roles/permissions/super-admin + demo data
├── db-init.js                     schema/migrations/views/seed রান করার script
├── db-truncate.js                 সব টেবিল খালি করার script
├── migrations/
│   └── 001_roll_rank_system.sql   exam.status, ranking_locked, ranking_locks, ranking_history
└── views/
    ├── student_full_profile.sql     ছাত্র প্রোফাইল + enrollment এক query-তে
    ├── exam_result_summary.sql       Marksheet-ready ফলাফল
    ├── student_merit_list.sql        মেধাক্রম view — RANK() + ৫-ধাপ tie-breaking
    └── teacher_assignment_overview.sql শিক্ষক-ক্লাস-সেকশন-বিষয় বরাদ্দ
```

**নিয়ম:** প্রতিটা module-এ Repository (raw SQL) → Service (business logic + validation) → Controller (try/catch + response) → Routes (middleware chain) এই ক্রম বাধ্যতামূলক।

---

## ৪. ডাটাবেস স্কিমা — সম্পূর্ণ টেবিল তালিকা

| টেবিল | উদ্দেশ্য | Soft Delete |
|---|---|---|
| `permissions` | অনুমতির নাম (যেমন `STUDENT_CREATE`) | হ্যাঁ |
| `roles` | ভূমিকা (SUPER_ADMIN, ADMIN, TEACHER, STUDENT) | হ্যাঁ |
| `role_permissions` | Role ↔ Permission ম্যাপিং | হ্যাঁ |
| `users` | সব ব্যবহারকারীর কেন্দ্রীয় account | হ্যাঁ |
| `academic_sessions` | শিক্ষাবর্ষ (একসাথে একটাই active) | হ্যাঁ |
| `classes` | ক্লাস (Class 1, Class 2...) | হ্যাঁ |
| `sections` | সেকশন (A/B/C), max_capacity সহ | হ্যাঁ |
| `subjects` | বিষয় bank (global, reusable) | হ্যাঁ |
| `teachers` | শিক্ষক প্রোফাইল (users-এর extension) | হ্যাঁ |
| `students` | ছাত্র প্রোফাইল (users-এর extension) | হ্যাঁ |
| `subject_assignments` | শিক্ষক → ক্লাস → সেকশন → বিষয় → সেশন বরাদ্দ | হ্যাঁ |
| `student_enrollments` | ছাত্র ভর্তি — ক্লাস/সেকশন/সেশন/roll_number + ranking_locked, admission_date | হ্যাঁ |
| `exams` | পরীক্ষা — exam_type, status (DRAFT/PUBLISHED) | হ্যাঁ |
| `exam_results` | পরীক্ষার নম্বর (exam+student+subject unique) | হ্যাঁ |
| `fee_structures` | ফি কাঠামো | হ্যাঁ |
| `student_attendance` | দৈনিক ছাত্র উপস্থিতি | হ্যাঁ |
| `attendance_logs` | স্টাফ check-in/out (GPS সহ) | হ্যাঁ |
| `leaves` | ছুটির আবেদন | হ্যাঁ |
| `ranking_locks` | ক্লাস+সেশন ভিত্তিক ranking lock অবস্থা | না |
| `ranking_history` | প্রতিবার rank generate হলে snapshot | না |

### গুরুত্বপূর্ণ enum

```
gender_enum:      MALE, FEMALE, OTHER
exam_type_enum:   ADMISSION, QUIZ, MID, FINAL
exam_status_enum: DRAFT, PUBLISHED          (migration 001-এ যুক্ত)
```

---

## ৫. মূল বিজনেস রুলস (Business Rules)

### ৫.১ — Academic Session
- একসাথে শুধু একটাই session is_active = true থাকতে পারবে (transaction দিয়ে atomic switch)।
- Active session delete করা যাবে না — আগে deactivate করতে হবে।
- প্রতিটা session-এর নিজস্ব admission_test_enabled (true/false) flag আছে।

### ৫.২ — Class ও Section
- একটা Class-এ section থাকতেও পারে, না-ও থাকতে পারে (section_id nullable)।
- Class-এ section থাকলে → enrollment করার সময় section_id বাধ্যতামূলক।
- Class-এ section না থাকলে → section_id দেওয়া নিষিদ্ধ (ভুল input হলে error)।
- প্রতিটা Section-এর max_capacity (ঐচ্ছিক) — পূর্ণ হয়ে গেলে নতুন enrollment আটকে যায়।
- Section A পূর্ণ হলে roll generation নিজে থেকে B-তে, তারপর C-তে বরাদ্দ করে (sequential fill)।

### ৫.৩ — Student ভর্তি প্রক্রিয়া (২ ধরনের ছাত্র)

| ছাত্র টাইপ | পরীক্ষা | Rank পাওয়ার পদ্ধতি |
|---|---|---|
| OLD (পুরাতন/promoted) | QUIZ + MID + FINAL | মোট নম্বর দিয়ে merit list rank |
| NEW (নতুন ভর্তি) | ADMISSION (ঐচ্ছিক) | নিচের দুই Scenario অনুযায়ী |

**Scenario 1 — admission_test_enabled = false:**
- OLD ছাত্ররা merit list rank পায় (QUIZ+MID+FINAL মোট নম্বর অনুযায়ী)।
- NEW ছাত্ররা ভর্তির তারিখ (admission_date) অনুযায়ী FIFO rank পায়, merit list-এর পরে শুরু হয়।

**Scenario 2 — admission_test_enabled = true:**
- OLD ছাত্রদের score = QUIZ+MID+FINAL মোট।
- NEW ছাত্রদের score = ADMISSION exam নম্বর।
- দুই দলকে merge করে single merit list বানানো হয়, score অনুযায়ী descending rank।

### ৫.৪ — Tie-breaking নিয়ম (deterministic ranking-এর জন্য, ক্রমানুসারে প্রয়োগ হয়)
```
১. মোট score (descending)
২. FINAL exam score (descending)
৩. MID exam score (descending)
৪. admission_date (ascending — আগে ভর্তি অগ্রাধিকার পায়)
৫. created_at (ascending)
৬. student_id (ascending — চূড়ান্ত guarantee, সব সমান হলেও deterministic)
```
এই নিয়ম database/views/student_merit_list.sql-এ SQL RANK() window function দিয়ে এবং core/ranking.engine.js-এর _sortAndRank()-এ (Scenario 2-এর merge করার পর পুনরায়) প্রয়োগ করা হয়েছে।

### ৫.৫ — Exam ও Result Publishing
- পরীক্ষা তৈরি হলে ডিফল্ট status DRAFT।
- শুধুমাত্র PUBLISHED status-এর exam-এর result ranking calculation-এ ব্যবহৃত হয়।
- Publish করার আগে validation: class+session থাকা আবশ্যক, এবং কমপক্ষে একটা result entry থাকতে হবে।
- Publish হয়ে গেলে result correction-এর জন্য আলাদা workflow লাগবে (এখনো বানানো হয়নি — দেখুন ৭ নং অধ্যায়)।

### ৫.৬ — Ranking Trigger কখন চলবে
- শুধুমাত্র exam_type = 'FINAL' পরীক্ষার জন্যই ranking/roll generation চলবে — QUIZ/MID/ADMISSION দিয়ে কখনো চলবে না। এই rule তিন জায়গায় defense আছে: exam.service.js, core/ranking.engine.js, modules/ranking/ranking.service.js।
- Scenario 1 (admission test বন্ধ): FINAL result publish হওয়ার সাথে সাথেই trigger হওয়া উচিত (auto-trigger — এখনো implement হয়নি, ৭ নং দেখুন)।
- Scenario 2 (admission test চালু): FINAL এবং ADMISSION — দুটোই publish হলে তখনই trigger হবে (এখনো implement হয়নি)।

### ৫.৭ — Ranking Lock
- Rank generate হয়ে গেলে সেই class+session-এর জন্য ranking_locks.is_locked = true সেট হবে (টেবিল migration-এ আছে, লজিক এখনো core engine-এ যুক্ত হয়নি — ৭ নং দেখুন)।
- Lock থাকা অবস্থায় automatic recalculation নিষিদ্ধ।
- শুধু admin manual RECALCULATE_RANKING action দিয়ে unlock → recalculate → আবার lock করতে পারবে (endpoint এখনো নেই)।

### ৫.৮ — Ranking History
- প্রতিবার rank generate/recalculate হলে ranking_history টেবিলে snapshot (student_id, total_score, rank, roll, version, generated_at) সংরক্ষণ হবে (টেবিল আছে, snapshot লেখার logic এখনো roll.engine.js-এ যুক্ত হয়নি — ৭ নং দেখুন)।

### ৫.৯ — RBAC (Role-Based Access Control)
- প্রতিটা route-এ permission নাম দিয়ে চেক হয় (যেমন "CLASS_CREATE"), role নাম দিয়ে না (যেমন ভুলভাবে "ADMIN" দেওয়া নিষিদ্ধ — এটা আগে একবার bug হয়েছিল)।
- Permission resolution Redis cache-first (core/permission.engine.js) — cache miss হলে DB থেকে এনে cache করে।
- Role-এর permission বদলালে cache invalidate করতে হবে (permissionEngine.invalidate(roleId))।

### ৫.১০ — Auth
- Login → access token (১৫ মিনিট) + refresh token (৭ দিন), refresh token Redis-এ সংরক্ষিত।
- Refresh token rotation প্রয়োগ করা আছে — প্রতিবার /auth/refresh কল করলে নতুন refresh token ইস্যু হয়, পুরনোটা invalid হয়ে যায় (token theft protection)।
- Logout → Redis থেকে refresh token মুছে যায়।

---

## ৬. এখন পর্যন্ত যা সম্পন্ন (Completed Modules)

| # | Module | অবস্থা |
|---|---|---|
| 1 | Auth (login/refresh/logout/me) | সম্পূর্ণ, rotation সহ |
| 2 | Users | সম্পূর্ণ |
| 3 | Roles | সম্পূর্ণ |
| 4 | Permissions | সম্পূর্ণ |
| 5 | Role-Permissions (granular) | সম্পূর্ণ |
| 6 | Academic Sessions | সম্পূর্ণ (activate/deactivate/admission-test toggle) |
| 7 | Classes | সম্পূর্ণ |
| 8 | Sections | সম্পূর্ণ (capacity + occupancy endpoint) |
| 9 | Subjects | সম্পূর্ণ |
| 10 | Teachers | সম্পূর্ণ (transaction-based user+profile creation) |
| 11 | Students | সম্পূর্ণ (transaction-based, student_code auto-gen) |
| 12 | Student Enrollments | সম্পূর্ণ (section optional + capacity validation) |
| 13 | Exams | সম্পূর্ণ (CRUD + publish/unpublish) |
| 14 | Ranking (manual trigger endpoint) | সম্পূর্ণ |
| 15 | core/ranking.engine.js | সম্পূর্ণ (Scenario 1+2, tie-breaking) |
| 16 | core/roll.engine.js | সম্পূর্ণ (section distribution সহ) |
| 17 | core/attendance.engine.js | লজিক সম্পূর্ণ, কিন্তু কোনো module/route এখনো এটা ব্যবহার করছে না |
| 18 | core/permission.engine.js | সম্পূর্ণ |
| 19 | Queue/Job infrastructure (BullMQ) | সম্পূর্ণ |
| 20 | Database views (৪টা) | সম্পূর্ণ |
| 21 | Migration system | সম্পূর্ণ (db:migrate script) |

---

## ৭. যা এখনো বাকি (Pending / TODO)

### ৭.১ — Exam Results module (সবচেয়ে জরুরি)
src/modules/exam-results/ ফোল্ডার খালি। লাগবে:
- exam-result.repository.js / .service.js / .controller.js / .routes.js
- Marks entry/update (একই exam+student+subject-এর জন্য unique constraint মানতে হবে)
- Grade auto-calculate (marks range থেকে A+/A/B... ইত্যাদি)
- এর ভেতরেই Auto-trigger logic বসবে (৭.২ দেখুন)

### ৭.২ — Auto-trigger (Ranking Lock যুক্ত করে)
- FINAL exam-এর সব result entry সম্পূর্ণ + publish হলে স্বয়ংক্রিয়ভাবে ranking queue trigger হওয়া উচিত (এখন শুধু manual API call দিয়েই হয়)।
- Scenario 2-এ FINAL ও ADMISSION — দুটোই publish না হলে trigger হবে না, এই দ্বৈত-শর্ত চেক এখনো লেখা হয়নি।
- exam.service.js-এর isResultEntryComplete() মেথড আছে, কিন্তু এটা কল করে কেউ queue trigger করছে না এখনো।

### ৭.৩ — ranking_locks টেবিল ব্যবহার
- টেবিল migration-এ তৈরি হয়েছে, কিন্তু core/ranking.engine.js বা core/roll.engine.js এখনো এই টেবিল পড়ে/লেখে না।
- Lock থাকলে নতুন ranking job আটকানোর logic core engine-এ যুক্ত করতে হবে।

### ৭.৪ — RECALCULATE_RANKING endpoint
- Admin-only manual action: unlock → recalculate → ranking_history-তে নতুন version snapshot → আবার lock।
- modules/ranking/-এ নতুন endpoint লাগবে (POST /ranking/recalculate)।

### ৭.৫ — Ranking History snapshot সংরক্ষণ
- ranking_history টেবিল আছে, কিন্তু core/roll.engine.js-এর generateRolls() এখনো এখানে snapshot লেখে না। Roll assign করার সময় একইসাথে history-তে insert করা উচিত (transaction-এর ভেতরেই)।

### ৭.৬ — Duplicate Job / Concurrency Protection
- BullMQ job-এ এখনো jobId ব্যবহার করে deduplication করা হয়নি — একই class+session-এর জন্য দুইবার ranking job submit হলে race condition হতে পারে।
- সমাধান: addJob()-এ deterministic jobId (যেমন ranking-classId-academicSessionId) দিয়ে BullMQ-কে duplicate আটকাতে বলা।

### ৭.৭ — Result Correction Workflow
- Publish হওয়ার পর result বদলাতে চাইলে কী হবে — Unpublish করে আবার publish করতে হবে, কিন্তু ranking_locked থাকলে কী করণীয় তা এখনো সংজ্ঞায়িত হয়নি।

### ৭.৮ — Edge Cases (এখনো হ্যান্ডেল করা হয়নি)
- ছাত্র transfer (এক class/section থেকে অন্য class-এ — শুধু section transfer আছে, class transfer নেই)
- Ranking generate হওয়ার পর ছাত্র withdrawal/delete হলে roll numbering-এর কী হবে
- Late admission (rank lock হওয়ার পরে নতুন ছাত্র এলে)

### ৭.৯ — Attendance module (HTTP layer)
- core/attendance.engine.js logic আছে, কিন্তু কোনো modules/attendance/ (repository/service/controller/routes) এখনো বানানো হয়নি। student_attendance ও attendance_logs টেবিল আছে কিন্তু API নেই।

### ৭.১০ — অন্য বাকি module (schema-তে টেবিল আছে, API নেই)
- subject_assignments (শিক্ষক-বিষয়-ক্লাস বরাদ্দ) — schema আছে, কোনো module নেই
- leaves (ছুটি ব্যবস্থাপনা) — schema আছে, কোনো module নেই
- fee_structures (ফি ব্যবস্থাপনা) — schema আছে, কোনো module নেই

---

## ৮. কোডিং নিয়ম (Conventions — অবশ্যই মানতে হবে)

1. পুরো প্রজেক্ট ESM — কোথাও require()/module.exports লেখা চলবে না, সব import/export।
2. প্রতিটা module-এ স্তর: Repository (raw SQL only) → Service (validation + business rule, AppError throw করে) → Controller (try/catch, successResponse/errorResponse ব্যবহার) → Routes (authMiddleware + rbacMiddleware('PERMISSION_NAME'))।
3. Soft delete সবসময় — deleted_at IS NULL চেক ছাড়া কোনো SELECT/UPDATE নয়।
4. List/search endpoint-এ buildWhereClause() + buildOrder() + getPagination()/buildMeta() ব্যবহার বাধ্যতামূলক — কাঁচা query string বসিয়ে filter লেখা নিষিদ্ধ।
5. একাধিক টেবিলে write লাগলে (যেমন user+student) withTransaction() ব্যবহার করতে হবে — partial write হতে দেওয়া যাবে না।
6. RBAC-এ সবসময় permission নাম ("STUDENT_CREATE") দিতে হবে, কখনো role নাম ("ADMIN") নয়।
7. নতুন কোনো ফাইল লেখার পর node --check ফাইলনাম দিয়ে syntax verify করা এবং grep দিয়ে CommonJS leftover চেক করা আবশ্যক।
8. নতুন টেবিল/কলাম স্কিমাতে সরাসরি না বদলে — database/migrations/00X_নাম.sql আকারে আলাদা ফাইলে যুক্ত করতে হবে।

---

## ৯. চালানোর নির্দেশনা

```
npm install

# .env বানাও (.env.example দেখে)
cp .env.example .env

# ডাটাবেস সেটআপ (ক্রমানুসারে)
npm run db:schema      টেবিল তৈরি
npm run db:migrate      ranking lock/history + exam status যুক্ত করে
npm run db:views         ৪টা view তৈরি
npm run db:seed           default roles/permissions/super-admin

# সার্ভার চালু (Express + BullMQ worker একসাথে)
npm run dev
```

ডিফল্ট সুপার অ্যাডমিন: admin@school.com / Admin@1234 (লগইন করেই পাসওয়ার্ড বদলে নিতে হবে)

---

## ১০. পরবর্তী কাজের অগ্রাধিকার ক্রম (Suggested Order)

```
১. exam-results module (CRUD) — সবচেয়ে জরুরি, বাকি সব কিছু এর উপর নির্ভরশীল
২. auto-trigger logic (exam-results সম্পূর্ণ হওয়ার পর publish হলে ranking চালু)
৩. ranking_locks ব্যবহার (lock চেক + lock সেট করা core engine-এ)
৪. ranking_history snapshot সংরক্ষণ
৫. RECALCULATE_RANKING endpoint
৬. duplicate job protection (jobId)
৭. attendance module (HTTP layer)
৮. subject_assignments, leaves, fee_structures module
```
