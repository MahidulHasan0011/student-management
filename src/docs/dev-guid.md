students.routes.js → URL define করে
↓
students.controller.js → request handle করে
↓
students.service.js → business logic
↓
students.repository.js → DB query

👉 Service কখনো DB query লিখবে না
👉 Service শুধু Repository call করবে

Controller → Service → Repository → DB
Service → transaction control (BEGIN/COMMIT/ROLLBACK)

hasSearch কেন আছে
আগে একটা গল্প দিয়ে বুঝি
ধরো তোমার স্কুলে ৫টা আলমারি আছে —

আলমারি ১ → ছাত্রদের নাম
আলমারি ২ → ক্লাসের নাম
আলমারি ৩ → বিষয়ের নাম
আলমারি ৪ → শিক্ষকের নাম
আলমারি ৫ → সেকশনের নাম
তুমি যদি বলো "জন নামের শিক্ষক খোঁজো" — তাহলে শুধু আলমারি ১ দেখলে হবে না, আলমারি ৪ (শিক্ষক) তেও যেতে হবে।

কিন্তু যদি বলো "ক্লাস ৫ এর assignment দেখাও" — তাহলে শুধু মূল তালিকা দেখলেই হয়, অন্য আলমারিতে যেতে হয় না।

এখন Code এ বুঝি
subject_assignments Table দেখো
subject_assignments

---

teacher_id ✅ এখানেই আছে
class_id ✅ এখানেই আছে  
section_id ✅ এখানেই আছে
subject_id ✅ এখানেই আছে
Filter করলে (search ছাড়া)
javascript
// "class_id = 5 দেখাও" বললে
// শুধু subject_assignments table দেখলেই হয়!

SELECT COUNT(sa.id)
FROM subject_assignments sa
WHERE sa.class_id = 5 // ✅ JOIN ছাড়াই পারি!
Search করলে
javascript
// "John" নামের teacher খুঁজলে
// teacher এর নাম subject_assignments এ নাই!
// users table এ আছে → JOIN লাগবেই

SELECT COUNT(DISTINCT sa.id)
FROM subject_assignments sa
LEFT JOIN teachers t ON sa.teacher_id = t.id
LEFT JOIN users u ON t.user_id = u.id // এখানে "John" আছে
WHERE u.full_name ILIKE '%John%'
তাহলে hasSearch দিয়ে কী করছি?
javascript
const countQuery = hasSearch
// search আছে = অন্য table এ নাম খুঁজতে হবে = JOIN লাগবে
? `SELECT COUNT(DISTINCT sa.id) ${baseJoins}`

    // search নাই = নিজের table এই সব আছে = JOIN ছাড়া FAST!
    : `SELECT COUNT(sa.id) FROM subject_assignments sa ${whereClause}`;

Real Example
Request 1: GET /assignments?class_id=5
→ hasSearch = false
→ Fast COUNT (JOIN ছাড়া) ✅ দ্রুত!

Request 2: GET /assignments?search=John  
→ hasSearch = true
→ JOIN সহ COUNT ✅ কারণ "John" users table এ আছে
academic_sessions এ কেন hasSearch নাই?
academic_sessions

---

name ✅ এখানেই আছে
start_date ✅ এখানেই আছে
end_date ✅ এখানেই আছে
javascript
// "Math" session খুঁজলে
SELECT COUNT(\*) FROM academic_sessions
WHERE name ILIKE '%Math%'
// ✅ JOIN লাগেই না! সব এক table এ!
search করলেও, filter করলেও — সব কিছু academic_sessions table এই আছে। তাই সবসময় একই COUNT query — hasSearch দরকার নাই।

Summary — এক কথায়
প্রশ্ন উত্তর
hasSearch কেন? Search এ অন্য table এ যেতে হয়, তাই JOIN লাগে
JOIN ছাড়া count কেন? JOIN করলে database এর কাজ বেশি → slow
academic_sessions এ নাই কেন? সব data এক table এ, JOIN লাগেই না
সহজ কথা: অন্য ঘরে খুঁজতে হলে hasSearch = true → সব ঘর খোলো। নিজের ঘরেই থাকলে hasSearch = false → শুধু নিজের ঘর দেখো।

Module JOIN hasSearch Type

students সবসময় ❌ Multi-table

student_enrollments সবসময় ❌ Multi-table

subject_assignments searchএ ✅ Conditional

exams সবসময় ❌ Multi-table

exam_results সবসময় ❌ Multi-table

role_permissions সবসময় ❌ Multi-table

sections সবসময় ❌ Multi-table

teachers সবসময় ❌ Multi-table

users সবসময় ❌ Multi-table

academic_sessions কখনো না ❌ Single table

classes কখনো না ❌ Single table

permissions কখনো না ❌ Single table

roles কখনো না ❌ Single table

subjects কখনো না ❌ Single table

তোমার gender column-এর জন্য PostgreSQL Enum Type ব্যবহার করা ভালো হবে। তবে PostgreSQL Enum-এর ভেতরে 1 = MALE, 2 = FEMALE এভাবে mapping রাখা যায় না। Enum শুধুমাত্র string value সংরক্ষণ করে।

errorResponse শুধু error.middleware-এর ভেতরে বসে। Service বা Repository-তে না।

\*\*ES Module
package.json-এ:

        {
        "type": "module"
        }

ex:
import { Router } from 'express';
import { userController } from './user.controller.js';

        export default router;

View

একাধিক টেবিল থেকে ডেটা join করে virtual table তৈরি করে।

AUTH refresh service

// Refresh token rotation যোগ করছি। আগে concept-টা ছোট করে বুঝিয়ে নিই, তারপর code।
// Rotation মানে কী
// এখন তোমার system-এ refresh token ৭ দিন ধরে একই থাকে। কেউ যদি সেই token চুরি করে, ৭ দিন ধরে সে চাইলেই নতুন access token বানাতে পারবে — তোমার জানার কোনো উপায় নেই।
// Rotation-এর নিয়ম: প্রতিবার refresh token ব্যবহার করলে, পুরনোটা বাতিল হয়ে যাবে এবং নতুন একটা refresh token দেওয়া হবে।
// তাই যদি কেউ token চুরি করে এবং দুজনেই (real user + attacker) একই token দিয়ে refresh করার চেষ্টা করে —
// যেই আগে করবে সেটাই কাজ করবে, পরেরজন ব্যর্থ হবে এবং পুরো session invalidate হয়ে যাবে (security alert হিসেবে)।

// এখন refresh() method আপডেট করছি — পুরনো token verify করে, সাথে সাথে নতুন refresh token বানিয়ে Redis-এ store করবে (atomic না করলে race condition হতে পারে,

// ব্যবহারকারী → POST /auth/refresh { refreshToken: "OLD_TOKEN" }
// ↓
// OLD_TOKEN ঠিক আছে কিনা verify
// ↓
// Redis-এ যেটা আছে তার সাথে মিলছে কিনা চেক
// ↓
// ┌── মিলছে না/নেই ──┐ ┌── মিলছে ──┐
// ↓ ↓
// Redis থেকে মুছে দাও নতুন accessToken + নতুন refreshToken বানাও
// 401 দিয়ে বলো Redis-এ নতুনটা সেভ করো (পুরনোটা automatic overwrite)
// "আবার login করো" client-কে দুটোই পাঠাও




presign url :https://www.awesomescreenshot.com/image/61498598?key=2bff9c26d696abbb4ab630656bb4ed43

** MinIO
Step 1: Docker Install করুন
যদি Docker না থাকে তাহলে আগে Docker Desktop install করুন।

Windows এ:
Docker Desktop install
WSL2 Enable
Docker চালু করুন
চেক করুন: docker --version


Step 2: MinIO Run করুন
CMD অথবা PowerShell এ

docker run -d --name minio ^
-p 9000:9000 ^
-p 9001:9001 ^
-e MINIO_ROOT_USER=minioadmin ^
-e MINIO_ROOT_PASSWORD=minioadmin ^
-v minio_data:/data ^
quay.io/minio/minio server /data --console-address ":9001"


Linux/Mac হলে
docker run -d --name minio \
-p 9000:9000 \
-p 9001:9001 \
-e MINIO_ROOT_USER=minioadmin \
-e MINIO_ROOT_PASSWORD=minioadmin \
-v minio_data:/data \
quay.io/minio/minio server /data --console-address ":9001"


Step 3: MinIO Console Open করুন
Browser এ যান : http://localhost:9001

Login

Username:
minioadmin

Password:
minioadmin


Step 4: Bucket Create করুন
Console থেকে

Buckets
↓
Create Bucket
↓
school-erp

Bucket name : school-erp


Step 5: আপনার .env Update করুন

STORAGE_PROVIDER=minio
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_REGION=us-east-1
STORAGE_BUCKET=school-erp
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_FORCE_PATH_STYLE=true
STORAGE_UPLOAD_URL_TTL=300
STORAGE_DOWNLOAD_URL_TTL=300





চলো, একদম সহজ করে বুঝি। আমি তোমাকে একটা রেস্টুরেন্টের গল্প দিয়ে বোঝাই — তাহলে পুরো জিনিসটা মাথায় বসে যাবে। 🍔

প্রথমে ৪টা চরিত্র চিনে নাও
ফাইলের নাম	রেস্টুরেন্টে কে	কাজ
Service (ranking.service.js)	🧑‍💼 ম্যানেজার	সিদ্ধান্ত নেয় "রান্না শুরু করা যাবে কিনা"
Queue (ranking.queue.js)	📋 অর্ডার স্লিপের পেরেক	অর্ডার লিখে ঝুলিয়ে রাখে
Job/Worker (ranking.job.js)	👨‍🍳 বাবুর্চি	পেরেক থেকে স্লিপ নিয়ে কাজ শুরু করে
Core/Engine (ranking.engine.js)	🔪 রেসিপি বই	আসল রান্নার নিয়ম, কীভাবে কাটবে-বাটবে
মনে রাখো: ম্যানেজার নিজে রান্না করে না। সে শুধু অর্ডার পেরেকে ঝুলিয়ে দেয়। বাবুর্চি পরে সেটা দেখে রান্না করে।

কেন এই ঝামেলা? (সবচেয়ে জরুরি প্রশ্ন)
ধরো, একটা exam publish হলো। সাথে সাথে যদি ১০০০ ছাত্রের rank+roll হিসাব করতে যাই — তাহলে exam publish করা বাটনটা আটকে থাকবে ৩০ সেকেন্ড। ইউজার ভাববে অ্যাপ হ্যাং। 😫

তাই আমরা বলি:

"অর্ডারটা পেরেকে ঝুলিয়ে দাও, ইউজারকে সাথে সাথে 'হয়ে গেছে' বলে দাও। পেছনে বাবুর্চি আস্তে আস্তে রান্না করবে।"

এটাই Queue ব্যবহারের আসল কারণ।

এবার পুরো চেইন — ধাপে ধাপে

Exam Publish হলো
      │
      ▼
🧑‍💼 ranking.service (autoTriggerAfterPublish)
      │  "লক আছে? রেজাল্ট রেডি? ঠিক আছে, অর্ডার দাও"
      ▼
📋 ranking.queue  ─── অর্ডার স্লিপ পেরেকে ঝুলল
      │
      ▼
👨‍🍳 ranking.job (Worker)  ─── স্লিপ নামিয়ে কাজ শুরু
      │  📖 ranking.engine কে ডাকে → "কে ফার্স্ট, কে সেকেন্ড হিসাব করো"
      │     (rankedList তৈরি হলো: [১নং=করিম, ২নং=রহিম...])
      ▼
📋 roll.queue  ─── এবার ২য় অর্ডার স্লিপ ঝুলল ("এদের roll নম্বর দাও")
      │
      ▼
👨‍🍳 roll.job (Worker)
      │  📖 roll.engine কে ডাকে → roll নম্বর বসাও + history সেভ + lock
      ▼
✅ শেষ! cache মুছে দেয় (পুরনো তথ্য যেন না দেখায়)
খেয়াল করো — দুইটা আলাদা কিউ (ranking + roll) পরপর চেইন হয়েছে। কেন?

প্রথম বাবুর্চি শুধু কে কত নম্বরে ঠিক করে (হিসাব)।
দ্বিতীয় বাবুর্চি সেই তালিকা নিয়ে roll নম্বর খাতায় লেখে (ডাটাবেসে সেভ)।
কাজ দুইভাগ করলে একটা ফেল করলে শুধু সেটাই আবার চেষ্টা হয়, পুরোটা না।

প্রতিটা ফাইল আসলে কী করে (এক লাইনে)
🧑‍💼 ranking.queue.js — চালাক পেরেক


const jobId = `ranking:${classId}:${sessionId}:${suffix}`;
এই jobId-টা হলো ম্যাজিক। ধরো তুমি ভুল করে ৩ বার বাটন চাপলে — একই jobId হওয়ায় BullMQ বাকি ২টা ফেলে দেয়। মানে একই ক্লাসের rank দুইবার হিসাব হবে না। (এটাকে বলে idempotency)

👨‍🍳 ranking.job.js — প্রথম বাবুর্চি

engine ডেকে rankedList বানায়
তারপর enqueueRollJob(...) দিয়ে পরের কিউতে পাঠায় (চেইন এখানেই হয়)
📖 ranking.engine.js — রেসিপি বই

এখানে HTTP নেই, queue নেই — শুধু হিসাব।
Scenario 1: পুরনো ছাত্র নম্বর দিয়ে, নতুন ছাত্র লাইনে (FIFO)।
Scenario 2: সবাই মিলে একসাথে নম্বর দিয়ে rank।
এটা এত সাদামাটা বলেই আলাদা করে টেস্ট করা সহজ (ডাটাবেস/সার্ভার লাগে না)।
👨‍🍳 roll.job.js — দ্বিতীয় বাবুর্চি

roll.engine ডাকে, শেষে cache মুছে দেয়।
📖 roll.engine.js — সবচেয়ে গুরুত্বপূর্ণ
পুরো কাজটা একটাই transaction-এ করে:

🔒 advisory lock নেয় (দুই বাবুর্চি একসাথে একই ক্লাসে হাত দিতে পারবে না)
roll নম্বর বসায়
history snapshot সেভ করে
ranking lock করে
audit log লেখে
এর মধ্যে যেকোনো একটা ফেল করলে সব বাতিল (rollback)। যেন অর্ধেক কাজ হয়ে না থাকে।

দুইটা "চালাকি" আলাদা করে বুঝে নাও
১. jobId (queue-তে) → একই অর্ডার দুইবার ঝুলতে দেয় না।

২. advisory_xact_lock (engine-এ) → যদি কোনোভাবে দুইটা কাজ একসাথেও চলে যায়, তাহলেও একজনকে দাঁড় করিয়ে রাখে আরেকজন শেষ হওয়া পর্যন্ত।

দুইটা মিলে ডবল সুরক্ষা — একই roll নম্বর দুইজন ছাত্র পাবে না। ✅

cache.service.js কেন?
ধরো ১০০ জন rank দেখতে চায়। প্রতিবার ডাটাবেসে যাওয়া কষ্টকর। তাই প্রথমবার হিসাব করে Redis-এ জমা রাখি (৩৬০০ সেকেন্ড)। পরের ৯৯ জন সেখান থেকে সাথে সাথে পায়।

কিন্তু নতুন rank হলে পুরনো জমানো তথ্য ভুল হয়ে যায় — তাই roll.job শেষে cacheService.del(...) দিয়ে মুছে দেয়।

এক বাক্যে পুরো সিস্টেম:

ম্যানেজার অর্ডার পেরেকে ঝুলায় → বাবুর্চি-১ হিসাব করে পরের পেরেকে ঝুলায় → বাবুর্চি-২ roll লিখে তালা মারে → পুরনো cache মুছে দেয়।

কোন ফাইলটা নিয়ে আরও গভীরে যেতে চাও? 🙂

c#12-12
ok i understod in @src/modules/ranking/ranking.service.js  i see call enqueueRankingJob this @src/queues/ranking.queue.js  ok  but in this file i see   return addJob(rankingQueue, 'calculate-ranking', data, { jobId }); it pass in @src/services/queue.service.js  i need to understand  wher it call jobs
দারুণ প্রশ্ন! 🎯 এটাই আসল বিভ্রান্তির জায়গা — আর প্রায় সবাই এখানেই আটকায়।

তুমি খুঁজছো: "addJob তো data পাঠায়, কিন্তু কোথায় গিয়ে job টা কল হয়?"

উত্তর একটু অদ্ভুত: সরাসরি কোথাও কল হয় না! কোনো ফাইল আরেকটা ফাইলকে "job চালাও" বলে ডাকে না। মাঝখানে একজন অদৃশ্য পিয়ন আছে — তার নাম Redis। 📮

চিঠির বাক্সের গল্প 📮
ধরো তোমার বাড়িতে একটা চিঠির বাক্স (letter box) আছে।


তুমি চিঠি লেখো → বাক্সে ফেলো → চলে গেলে
                    (Redis)
                       │
              📮 বাক্সে চিঠি জমে থাকে
                       │
পিয়ন এসে বাক্স খোলে → চিঠি পড়ে → কাজ করে
এখানে তুমি আর পিয়ন কখনো সামনাসামনি দেখা করো না! তুমি শুধু বাক্সে ফেলো, পিয়ন শুধু বাক্স থেকে তোলে। মাঝখানে বাক্স (Redis) সংযোগকারী।

এবার কোডে মিলাই
✍️ দিক ১ — চিঠি ফেলা (data পাঠানো)

ranking.service.js
   └─ enqueueRankingJob(data)          ← "একটা অর্ডার দাও"
        └─ ranking.queue.js
             └─ addJob(rankingQueue, 'calculate-ranking', data)
                  └─ queue.service.js
                       └─ queue.add(...)   ← 📮 Redis-এ চিঠি জমা হলো
এখানেই কিন্তু কাজ শেষ। এই লাইনটা রান হওয়ার পর ফাংশন return করে চলে যায়। কোনো job চলে না। শুধু Redis-এ একটা এন্ট্রি বসল: "ranking queue-তে একটা কাজ পড়ে আছে।"

👨‍🍳 দিক ২ — চিঠি তোলা (job চালানো)
এই দিকটা তুমি খুঁজে পাচ্ছিলে না। এটা শুরু হয় সার্ভার চালু হওয়ার সময়, আলাদাভাবে:


server.js
   └─ import('./jobs/index.js')        ← সার্ভার স্টার্টে একবার চলে
        └─ jobs/index.js
             └─ import { rankingWorker } from './ranking.job.js'
                  └─ ranking.job.js
                       └─ createWorker('ranking', processor)
                            └─ queue.service.js
                                 └─ new Worker('ranking', processor)  ← 📮 পিয়ন নিয়োগ!
এই new Worker('ranking', ...) লাইনটাই পিয়ন। এটা তৈরি হওয়ার সাথে সাথে Redis-এর 'ranking' বাক্সটার দিকে সারাক্ষণ তাকিয়ে থাকে। যখনই বাক্সে নতুন চিঠি পড়ে, পিয়ন সাথে সাথে সেটা তুলে processor(job) ফাংশনটা চালায়।

পুরো ছবিটা এক ফ্রেমে

   ┌─────────────────┐                      ┌─────────────────┐
   │  service         │                     │  ranking.job.js  │
   │  enqueueRankingJob                     │  processor(job)  │
   │       │          │                     │       ▲          │
   │       ▼          │                     │       │          │
   │  addJob()        │                     │  createWorker    │
   └───────┼──────────┘                     └───────┼──────────┘
           │                                        │
           │ queue.add()                new Worker() │ (সারাক্ষণ তাকিয়ে)
           ▼                                        │
        ╔═══════════════════════════════════════════╗
        ║          📮 REDIS ('ranking' box)          ║
        ║   [ চিঠি: calculate-ranking + data ]       ║
        ╚═══════════════════════════════════════════╝
বাম দিক চিঠি ফেলে → চলে যায়।
ডান দিক চিঠি তোলে → কাজ করে।
দুই দিক একে অপরকে চেনে না। শুধু একই নাম ('ranking') ব্যবহার করে বলেই একই বাক্স খুঁজে পায়।
নামটাই আসল চাবি 🔑
লক্ষ্য করো — দুই জায়গায় একই স্ট্রিং 'ranking':

জায়গা	কোড
চিঠি ফেলা	createQueue('ranking') → ranking.queue.js:3
চিঠি তোলা	createWorker('ranking', ...) → ranking.job.js:38
এই নামটা হুবহু মিলতে হবে। নাহলে পিয়ন ভুল বাক্সের দিকে তাকিয়ে থাকবে, চিঠি কেউ তুলবে না। 😅

তোমার আসল প্রশ্নের সরাসরি উত্তর
"addJob → এরপর কোথায় job কল হয়?"

addJob-এর পর কোড থেমে যায়। পরে, সম্পূর্ণ আলাদাভাবে, new Worker(...) (যেটা সার্ভার স্টার্টে তৈরি হয়েছিল) Redis থেকে চিঠিটা তুলে processor চালায়। এই দুইয়ের মধ্যে সরাসরি ফাংশন কল নেই — সংযোগটা Redis-এর মাধ্যমে, নাম ('ranking') মিলিয়ে।

এই কারণেই এটাকে বলে asynchronous / decoupled — চিঠি লেখা আর চিঠি পড়া সম্পূর্ণ আলাদা সময়ে, আলাদা জায়গায় ঘটে। এমনকি তুমি চাইলে পিয়নকে (worker) আলাদা কম্পিউটারেও রাখতে পারো — node src/jobs/index.js আলাদা চালিয়ে! 🚀

আর কোনো অংশ ঘোলাটে লাগছে?










Exponential Backoff with Jitter। 🚀

শুধু Exponential Backoff হলে

সবাই একই নিয়ম মানে:

১ম বার চেষ্টা → Fail
১ সেকেন্ড অপেক্ষা

২য় বার চেষ্টা → Fail
২ সেকেন্ড অপেক্ষা

৩য় বার চেষ্টা → Fail
৪ সেকেন্ড অপেক্ষা

সমস্যা হলো, সবাই একই সময়ে আবার চেষ্টা করবে।

১ সেকেন্ড পরে:
👦👦👦👦👦👦👦👦👦👦

২ সেকেন্ড পরে:
👦👦👦👦👦👦👦👦👦👦

৪ সেকেন্ড পরে:
👦👦👦👦👦👦👦👦👦👦

দোকানদারের উপর আবার একসাথে অনেক চাপ পড়ে।

API Server-এর ক্ষেত্রেও একই ঘটনা ঘটে।

Jitter কী?

Jitter = একটু Randomness (এলোমেলো সময়) যোগ করা।

অর্থাৎ সবাই ৪ সেকেন্ড অপেক্ষা করবে না।

বরং:

রাহিম → ৩.৫ সেকেন্ড
করিম → ৪.২ সেকেন্ড
জামাল → ৪.৮ সেকেন্ড
রুবেল → ৩.১ সেকেন্ড
সুমন → ৪.৫ সেকেন্ড

এখন সবাই একসাথে আসছে না।

৩.১s → রুবেল
৩.৫s → রাহিম
৪.২s → করিম
৪.৫s → সুমন
৪.৮s → জামাল

দোকানদারের জন্য কাজ করা অনেক সহজ হয়ে গেল। ✅

API-এর বাস্তব উদাহরণ

ধরো তোমার Shopify App API Call করছে।

প্রথম Request:

GET /products

Server বলল:

{
  "error": "Too Many Requests"
}
Jitter ছাড়া
Try 1 → Wait 1s
Try 2 → Wait 2s
Try 3 → Wait 4s
Try 4 → Wait 8s

১০০০ জন User একই Pattern Follow করলে:

১ সেকেন্ডে ১০০০ Request
২ সেকেন্ডে ১০০০ Request
৪ সেকেন্ডে ১০০০ Request

Server আবার চাপের মধ্যে পড়ে যায়।

Jitter সহ

Base Delay:

1s
2s
4s
8s

কিন্তু Random Time যোগ করা হলো:

1.3s
2.7s
4.5s
8.2s

অন্য User-এর জন্য:

1.8s
2.1s
5.0s
7.6s

এখন Request গুলো ছড়িয়ে-ছিটিয়ে আসবে।

Server একসাথে হাজার Request পাবে না। ✅

JavaScript Example
const baseDelay = 1000;

for (let attempt = 1; attempt <= 5; attempt++) {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);

  const jitter = Math.random() * 1000;

  const waitTime = exponentialDelay + jitter;

  console.log(
    `Attempt ${attempt}: ${Math.round(waitTime)}ms`
  );
}

Output এমন হতে পারে:

Attempt 1: 1450ms
Attempt 2: 2780ms
Attempt 3: 4320ms
Attempt 4: 8950ms
Attempt 5: 16340ms

প্রতিবার Output আলাদা হবে কারণ Math.random() নতুন Random Value দেয়।

Full Jitter (সবচেয়ে জনপ্রিয়)

AWS-এর মতো বড় কোম্পানিগুলো প্রায়ই এই Strategy ব্যবহার করে।

Formula:

waitTime = Math.random() * exponentialDelay;

ধরো:

Exponential Delay = 8000ms

তাহলে Wait Time হতে পারে:

523ms
2345ms
4567ms
7899ms

অর্থাৎ 0 থেকে 8000ms-এর মধ্যে যেকোনো Random Value।

এতে হাজার হাজার Client-এর Retry Time আলাদা হয়ে যায়।

সহজে মনে রাখার উপায়

Exponential Backoff:

"প্রতি Fail-এর পর অপেক্ষার সময় দ্বিগুণ করো।"

Jitter:

"অপেক্ষার সময়ের মধ্যে একটু Randomness যোগ করো।"

Exponential Backoff + Jitter:

"প্রতি Fail-এর পর বেশি সময় অপেক্ষা করো, কিন্তু সবাই যেন একই সময়ে Retry না করে।"

এ কারণেই Production System-এ সাধারণত "Exponential Backoff with Jitter" ব্যবহার করা হয়, শুধু Exponential Backoff নয়।

bullmq 5.79 — modern version, তাই custom backoff strategy সরাসরি supported