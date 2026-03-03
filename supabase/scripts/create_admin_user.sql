-- 1) Supabase Dashboard에서 먼저 auth 사용자를 만드세요:
--    Authentication → Users → Add user
--    Email: dndnjsrud123@gmail.com
--    Password: (원하는 비밀번호 입력)
--    생성 후 아래 SQL을 실행하세요.

-- 2) 해당 이메일 사용자를 public.users에 ADMIN으로 등록
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'dndnjsrud123@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth user not found. Dashboard → Authentication → Users → Add user 로 dndnjsrud123@gmail.com 사용자를 먼저 만드세요.';
  END IF;

  INSERT INTO public.users (id, name, role)
  VALUES (v_user_id, 'Admin', 'ADMIN')
  ON CONFLICT (id) DO UPDATE
  SET role = 'ADMIN', name = COALESCE(public.users.name, 'Admin');
END $$;
