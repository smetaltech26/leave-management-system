-- 1. สร้าง Buckets สำหรับเก็บรูปโปรไฟล์และไฟล์แนบ
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true) ON CONFLICT (id) DO NOTHING;

-- 2. สร้าง Policy อนุญาตให้ทุกคนอ่านไฟล์ได้ (Public Read)
CREATE POLICY "Allow public read for avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Allow public read for attachments" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');

-- 3. สร้าง Policy อนุญาตให้เขียนไฟล์ได้ (สำหรับสคริปต์ดูดไฟล์)
CREATE POLICY "Allow insert for avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Allow update for avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
CREATE POLICY "Allow insert for attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments');
CREATE POLICY "Allow update for attachments" ON storage.objects FOR UPDATE USING (bucket_id = 'attachments');

-- 4. มอบสิทธิ์การใช้งานให้ anon และ authenticated
GRANT ALL ON storage.objects TO anon, authenticated, service_role;
GRANT ALL ON storage.buckets TO anon, authenticated, service_role;
