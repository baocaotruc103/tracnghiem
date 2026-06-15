-- CẢNH BÁO: Hãy CHẠY lệnh này để xóa các bảng cũ (Nếu bạn đã chạy file schema.sql lần trước)
-- drop table if exists public.test_attempts;
-- drop table if exists public.profiles;

-- 1. Tạo bảng users tuỳ chỉnh
create table public.users (
  id serial primary key,
  ho_ten text not null,
  ten_dang_nhap text not null unique,
  mat_khau text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tắt RLS để Frontend có thể query trực tiếp dễ dàng (chỉ dùng cho bài tập/học tập)
alter table public.users disable row level security;

-- 2. Tạo lại bảng test_attempts trỏ đến bảng users mới
create table public.test_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id integer references public.users(id) not null,
  score integer not null,
  total_questions integer not null,
  answers_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.test_attempts disable row level security;
