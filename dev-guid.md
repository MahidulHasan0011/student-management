students.routes.js   → URL define করে
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
-------------------
teacher_id   ✅ এখানেই আছে
class_id     ✅ এখানেই আছে  
section_id   ✅ এখানেই আছে
subject_id   ✅ এখানেই আছে
Filter করলে (search ছাড়া)
javascript
// "class_id = 5 দেখাও" বললে
// শুধু subject_assignments table দেখলেই হয়!

SELECT COUNT(sa.id)
FROM subject_assignments sa
WHERE sa.class_id = 5   // ✅ JOIN ছাড়াই পারি!
Search করলে
javascript
// "John" নামের teacher খুঁজলে
// teacher এর নাম subject_assignments এ নাই!
// users table এ আছে → JOIN লাগবেই

SELECT COUNT(DISTINCT sa.id)
FROM subject_assignments sa
LEFT JOIN teachers t ON sa.teacher_id = t.id
LEFT JOIN users u    ON t.user_id = u.id  // এখানে "John" আছে
WHERE u.full_name ILIKE '%John%'
তাহলে hasSearch দিয়ে কী করছি?
javascript
const countQuery = hasSearch
    //  search আছে = অন্য table এ নাম খুঁজতে হবে = JOIN লাগবে
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
-----------------
name        ✅ এখানেই আছে
start_date  ✅ এখানেই আছে
end_date    ✅ এখানেই আছে
javascript
// "Math" session খুঁজলে
SELECT COUNT(*) FROM academic_sessions
WHERE name ILIKE '%Math%'
// ✅ JOIN লাগেই না! সব এক table এ!
search করলেও, filter করলেও — সব কিছু academic_sessions table এই আছে। তাই সবসময় একই COUNT query — hasSearch দরকার নাই।

Summary — এক কথায়
প্রশ্ন	উত্তর
hasSearch কেন?	Search এ অন্য table এ যেতে হয়, তাই JOIN লাগে
JOIN ছাড়া count কেন?	JOIN করলে database এর কাজ বেশি → slow
academic_sessions এ নাই কেন?	সব data এক table এ, JOIN লাগেই না
সহজ কথা: অন্য ঘরে খুঁজতে হলে hasSearch = true → সব ঘর খোলো। নিজের ঘরেই থাকলে hasSearch = false → শুধু নিজের ঘর দেখো। 





Module                 JOIN           hasSearch       Type  

students               সবসময়          ❌            Multi-table

student_enrollments    সবসময়          ❌            Multi-table

subject_assignments    searchএ         ✅            Conditional

exams                  সবসময়          ❌            Multi-table

exam_results           সবসময়          ❌            Multi-table

role_permissions       সবসময়          ❌            Multi-table

sections               সবসময়          ❌            Multi-table

teachers               সবসময়          ❌            Multi-table

users                  সবসময়          ❌            Multi-table

academic_sessions      কখনো না        ❌            Single table

classes                কখনো না        ❌            Single table

permissions            কখনো না        ❌            Single table

roles                  কখনো না        ❌            Single table

subjects               কখনো না        ❌            Single table




তোমার gender column-এর জন্য PostgreSQL Enum Type ব্যবহার করা ভালো হবে। তবে PostgreSQL Enum-এর ভেতরে 1 = MALE, 2 = FEMALE এভাবে mapping রাখা যায় না। Enum শুধুমাত্র string value সংরক্ষণ করে।



errorResponse শুধু error.middleware-এর ভেতরে বসে। Service বা Repository-তে না।

**ES Module
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