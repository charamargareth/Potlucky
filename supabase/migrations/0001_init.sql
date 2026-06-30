-- ============================================================
-- NABUNG BARENG — Skema Database Utama
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES
-- Dibuat otomatis saat user pertama kali login via Google OAuth
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  daily_budget numeric(14,2) default 0, -- budget harian user, dipakai untuk rekomendasi nabung
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. SAVINGS GROUPS
-- 1 grup = 1 pool tabungan bersama dengan 1 target utama
-- ------------------------------------------------------------
create table public.savings_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  target_amount numeric(14,2) not null default 0,
  target_date date, -- deadline target (opsional)
  period_type text not null default 'monthly' check (period_type in ('daily','weekly','monthly')),
  invite_code text not null unique, -- kode 6-8 karakter untuk join
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_savings_groups_invite_code on public.savings_groups(invite_code);

-- ------------------------------------------------------------
-- 3. GROUP MEMBERS
-- Relasi user <-> grup, termasuk role & target pribadi dalam grup
-- ------------------------------------------------------------
create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.savings_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  personal_target numeric(14,2), -- target individu opsional dalam grup (null = ikut target grup rata-rata)
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index idx_group_members_group on public.group_members(group_id);
create index idx_group_members_user on public.group_members(user_id);

-- ------------------------------------------------------------
-- 4. CONTRIBUTIONS (logbook / catatan nabung)
-- Setiap entri nabung dari hari 1 sampai akhir
-- ------------------------------------------------------------
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.savings_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  note text,
  contributed_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_contributions_group on public.contributions(group_id, contributed_on desc);
create index idx_contributions_user on public.contributions(user_id, contributed_on desc);

-- ------------------------------------------------------------
-- 5. REMINDER SETTINGS
-- Pengaturan jadwal pengingat nabung per user per grup
-- ------------------------------------------------------------
create table public.reminder_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.savings_groups(id) on delete cascade,
  frequency text not null default 'daily' check (frequency in ('daily','weekly','monthly','off')),
  remind_hour smallint not null default 19 check (remind_hour between 0 and 23),
  remind_minute smallint not null default 0 check (remind_minute between 0 and 59),
  remind_weekday smallint check (remind_weekday between 0 and 6), -- dipakai jika frequency weekly (0=Minggu)
  remind_day_of_month smallint check (remind_day_of_month between 1 and 28), -- dipakai jika frequency monthly
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, group_id)
);

-- ------------------------------------------------------------
-- 6. PUSH SUBSCRIPTIONS
-- Endpoint Web Push API per device per user
-- ------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index idx_push_subscriptions_user on public.push_subscriptions(user_id);

-- ------------------------------------------------------------
-- 7. NOTIFICATIONS (log notifikasi in-app)
-- ------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.savings_groups(id) on delete cascade,
  type text not null check (type in ('reminder','member_contributed','target_reached','member_joined','milestone')),
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, created_at desc);

-- ============================================================
-- FUNCTION: generate invite code unik
-- ============================================================
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- tanpa karakter ambigu (0,O,1,I)
  code text := '';
  i int;
begin
  for i in 1..7 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return code;
end;
$$;

-- ============================================================
-- TRIGGER: auto-set invite_code saat grup dibuat
-- ============================================================
create or replace function public.set_invite_code()
returns trigger
language plpgsql
as $$
declare
  new_code text;
  tries int := 0;
begin
  if new.invite_code is null or new.invite_code = '' then
    loop
      new_code := public.generate_invite_code();
      tries := tries + 1;
      if not exists (select 1 from public.savings_groups where invite_code = new_code) then
        exit;
      end if;
      if tries > 20 then
        raise exception 'Gagal membuat kode undangan unik';
      end if;
    end loop;
    new.invite_code := new_code;
  end if;
  return new;
end;
$$;

create trigger trg_set_invite_code
before insert on public.savings_groups
for each row execute function public.set_invite_code();

-- ============================================================
-- TRIGGER: auto-create profile saat user baru sign up (Google OAuth)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- TRIGGER: owner otomatis jadi member saat grup dibuat
-- ============================================================
create or replace function public.add_owner_as_member()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$;

create trigger trg_add_owner_as_member
after insert on public.savings_groups
for each row execute function public.add_owner_as_member();

-- ============================================================
-- TRIGGER: notifikasi otomatis saat ada kontribusi baru
-- Memberi tahu anggota lain (bukan si penabung) bahwa seseorang baru nabung
-- ============================================================
create or replace function public.notify_on_contribution()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  contributor_name text;
  group_name text;
  member record;
  already_today boolean;
begin
  select full_name into contributor_name from public.profiles where id = new.user_id;
  select name into group_name from public.savings_groups where id = new.group_id;

  -- cek apakah ini kontribusi pertama user ini di hari tersebut (untuk pesan "udah nabung hari ini")
  select exists (
    select 1 from public.contributions
    where group_id = new.group_id and user_id = new.user_id
      and contributed_on = new.contributed_on and id <> new.id
  ) into already_today;

  for member in
    select gm.user_id from public.group_members gm
    where gm.group_id = new.group_id and gm.user_id <> new.user_id
  loop
    insert into public.notifications (user_id, group_id, type, title, body)
    values (
      member.user_id,
      new.group_id,
      'member_contributed',
      coalesce(contributor_name, 'Anggota') || ' baru menabung',
      coalesce(contributor_name, 'Seseorang') || ' menambahkan Rp ' ||
        to_char(new.amount, 'FM999,999,999,999') || ' ke ' || coalesce(group_name, 'grup')
    );
  end loop;

  return new;
end;
$$;

create trigger trg_notify_on_contribution
after insert on public.contributions
for each row execute function public.notify_on_contribution();

-- ============================================================
-- TRIGGER: notifikasi saat ada anggota baru join
-- ============================================================
create or replace function public.notify_on_member_joined()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  joiner_name text;
  group_name text;
  member record;
begin
  if new.role = 'owner' then
    return new; -- owner ditambahkan otomatis, tidak perlu notifikasi join
  end if;

  select full_name into joiner_name from public.profiles where id = new.user_id;
  select name into group_name from public.savings_groups where id = new.group_id;

  for member in
    select gm.user_id from public.group_members gm
    where gm.group_id = new.group_id and gm.user_id <> new.user_id
  loop
    insert into public.notifications (user_id, group_id, type, title, body)
    values (
      member.user_id,
      new.group_id,
      'member_joined',
      'Anggota baru bergabung',
      coalesce(joiner_name, 'Seseorang') || ' bergabung ke ' || coalesce(group_name, 'grup')
    );
  end loop;

  return new;
end;
$$;

create trigger trg_notify_on_member_joined
after insert on public.group_members
for each row execute function public.notify_on_member_joined();

-- ============================================================
-- TRIGGER: notifikasi saat target grup tercapai
-- ============================================================
create or replace function public.notify_on_target_reached()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  total numeric(14,2);
  target numeric(14,2);
  group_name text;
  already_notified boolean;
  member record;
begin
  select target_amount, name into target, group_name
  from public.savings_groups where id = new.group_id;

  if target is null or target <= 0 then
    return new;
  end if;

  select coalesce(sum(amount), 0) into total
  from public.contributions where group_id = new.group_id;

  if total < target then
    return new;
  end if;

  select exists (
    select 1 from public.notifications
    where group_id = new.group_id and type = 'target_reached'
  ) into already_notified;

  if already_notified then
    return new;
  end if;

  for member in
    select gm.user_id from public.group_members gm where gm.group_id = new.group_id
  loop
    insert into public.notifications (user_id, group_id, type, title, body)
    values (
      member.user_id,
      new.group_id,
      'target_reached',
      'Target tercapai!',
      'Target tabungan ' || coalesce(group_name, 'grup') || ' sudah tercapai. Selamat!'
    );
  end loop;

  return new;
end;
$$;

create trigger trg_notify_on_target_reached
after insert on public.contributions
for each row execute function public.notify_on_target_reached();
