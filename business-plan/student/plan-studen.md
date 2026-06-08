১. ছাত্র ভর্তির দুইটি পথ
নতুন ছাত্র: প্রথমবার আসে, তাকে Admission Test দিতে হয়। তবে Admin যদি Admission Test বন্ধ করে রাখেন, তাহলে নতুন ছাত্র সরাসরি FIFO (First In First Out) ভিত্তিতে roll পাবে — মানে যে আগে ভর্তি হয়েছে সে আগে roll পাবে।
পুরাতন ছাত্র: সে ইতিমধ্যে enrolled, তাই তাকে Quiz + Mid + Final — এই তিনটি পরীক্ষা দিতে হয়। এর মার্কস exam_results টেবিলে জমা হয়।



যদি Admission Test চালু থাকে: নতুন ও পুরাতন সব ছাত্র একসাথে rank হয়। ফলে একজন নতুন ছাত্র যদি ভালো পরীক্ষা দেয়, সে পুরাতন ছাত্রের আগেও rank পেতে পারে।
যদি Admission Test বন্ধ থাকে: পুরাতন ছাত্রদের rank হয়, নতুন ছাত্ররা FIFO-তে roll পায় (মানে পুরাতনদের roll শেষ হওয়ার পর নতুনরা ক্রমানুসারে roll পায়)।



Rank অনুযায়ী roll number generate হয় এবং student_enrollments.roll_number আপডেট হয়। এটা একটা async job হিসেবে queue-এ যায়, যাতে একসাথে অনেক ছাত্রের roll generate করতে পারফরম্যান্স সমস্যা না হয়।
Rank 1 → Roll 1
Rank 2 → Roll 2
...

৫. Section Assignment Logic
Class-এ Section আছে?
│
├── না → সরাসরি Class-এ sequential roll assign
│
└── হ্যাঁ → Admin প্রতি section-এর capacity set করেন
              (যেমন A=20, B=20, C=20)
              Rank 1-20 → Section A
              Rank 21-40 → Section B
              Rank 41-60 → Section C
এই capacity sections টেবিলে একটি max_capacity column যোগ করতে হবে (এখন নেই, যোগ করতে হবে)।






 Queue & Job Architecture
QueueJobকাজranking.queueranking.job.jsমার্কস যোগ করে sort করে rank দেয়roll.queueroll.job.jsrank থেকে roll number generate করে
এই দুইটি job sequential হতে হবে — ranking শেষ না হলে roll generate হবে না।







Students — প্রথমে users টেবিলে account, তারপর students টেবিলে profile, তারপর student_enrollments-এ class + section assign। Roll number শেষে আসে ranking-এর পরে।