-- Chạy file này trên Supabase SQL Editor để cập nhật hàm sinh câu hỏi theo User

CREATE OR REPLACE FUNCTION get_personalized_questions(p_user_id integer, p_num_questions integer)
RETURNS SETOF public.bo_de AS $$
BEGIN
  RETURN QUERY 
  WITH user_seen AS (
    -- Quét toàn bộ lịch sử để lấy ra các ID câu hỏi đã làm
    SELECT DISTINCT jsonb_object_keys(answers_data) AS q_id
    FROM public.test_attempts
    WHERE user_id = p_user_id AND answers_data IS NOT NULL
  )
  SELECT b.* 
  FROM public.bo_de b
  LEFT JOIN user_seen u ON u.q_id = b.id::text OR u.q_id = b.cau_hoi
  ORDER BY 
    (u.q_id IS NOT NULL) ASC, -- Câu chưa làm (FALSE) sẽ lên đầu, câu đã làm (TRUE) xuống dưới
    RANDOM()                  -- Trộn ngẫu nhiên trong từng nhóm
  LIMIT p_num_questions;
END;
$$ LANGUAGE plpgsql;
