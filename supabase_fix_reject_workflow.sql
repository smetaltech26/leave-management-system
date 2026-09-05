-- ====================================================================
-- ฟังก์ชันสำหรับปฏิเสธคำขอลา (Reject Leave Request Workflow)
-- วัตถุประสงค์: ป้องกันปัญหา Row-Level Security (RLS) ที่ทำให้ผู้อนุมัติ
--              ไม่สามารถอัปเดตสถานะของผู้อนุมัติท่านอื่นใน Step ถัดไปได้
-- วิธีใช้: นำโค้ดทั้งหมดนี้ไปวางที่หน้า SQL Editor ของ Supabase แล้วกด RUN ได้เลยครับ
-- ====================================================================

CREATE OR REPLACE FUNCTION public.reject_leave_request(
    p_request_id VARCHAR,
    p_step_number INT,
    p_comment TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- ให้รันด้วยสิทธิ์สูงสุดของระบบ ข้าม RLS ของตาราง approval_steps
AS $$
BEGIN
    -- 1. อัปเดตทุก approval_steps ตั้งแต่ step_number ที่กดปฏิเสธเป็นต้นไป ให้เป็น Rejected ทั้งหมด
    UPDATE public.approval_steps
    SET status = 'Rejected',
        comment = CASE 
            WHEN step_number = p_step_number THEN p_comment 
            ELSE COALESCE(NULLIF(comment, ''), 'ไม่อนุมัติ (ตามลำดับขั้นที่ ' || p_step_number || ')') 
        END,
        action_date = COALESCE(action_date, timezone('utc'::text, now()))
    WHERE request_id = p_request_id
      AND step_number >= p_step_number;

    -- 2. อัปเดตสถานะของ leave_requests เป็น Rejected
    UPDATE public.leave_requests
    SET status = 'Rejected',
        reject_reason = p_comment,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_request_id;
END;
$$;

-- ให้สิทธิ์ผู้ใช้งานทุกกลุ่มเรียกใช้ฟังก์ชันนี้ได้
GRANT EXECUTE ON FUNCTION public.reject_leave_request(VARCHAR, INT, TEXT) TO authenticated, anon, service_role;
