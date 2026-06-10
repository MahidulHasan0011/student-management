ধরো তোমার project production এ আছে। হাজার হাজার real data আছে।
এখন তুমি students টেবিলে একটা নতুন column যোগ করতে চাও।

schema.sql আপডেট করলে → কিন্তু production server জানে না কী change হয়েছে
migrations ফাইল দিলে → শুধু নতুন change টুকু run করো, পুরনো data নষ্ট হয় না



schema.sql vs migrations

                schema.sql                                          migrations

কী              পুরো database এর current picture                    প্রতিটি change এর ইতিহাস

কখন run করে    Fresh/new setup এ                                  প্রতিটি change deploy করার সময়

Data নষ্ট হয়      হ্যাঁ (DROP করে নতুন করে বানায়)                      না (শুধু change apply করে)

Team কাজ        সবাই একই schema পায়                               কে কখন কী change করেছে track করা যায়



ভবিষ্যতে নতুন change হলে নতুন migration ফাইল

migrations/
├── 001_create_roles_and_permissions.sql  ← touch করো না
├── 002_create_users.sql                  ← touch করো না
├── ...
├── 012_create_attendance_logs.sql        ← touch করো না
│
│   -- ভবিষ্যতে নতুন change --
├── 013_add_profile_photo_to_users.sql    ← নতুন ফাইল
├── 014_add_phone_to_students.sql         ← নতুন ফাইল
└── 015_create_notifications_table.sql    ← নতুন ফাইল



-- Migration: 013
-- Description: Add profile_photo column to users table
-- Date: 2025-06-10

ALTER TABLE public.users
ADD COLUMN profile_photo TEXT NULL;



১. একবার লেখা migration ফাইল কখনো edit করো না
২. নতুন change মানেই নতুন ফাইল
৩. নম্বর সবসময় বাড়তে থাকে
৪. schema.sql সবসময় সব migration এর combined result