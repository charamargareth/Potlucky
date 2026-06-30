-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

alter table public.profiles enable row level security;
alter table public.savings_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.contributions enable row level security;
alter table public.reminder_settings enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications enable row level security;

-- ------------------------------------------------------------
-- Helper: cek apakah user adalah anggota grup tertentu
-- ------------------------------------------------------------
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_owner(p_group_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
create policy "profiles_select_own_or_groupmate"
on public.profiles for select
using (
  id = auth.uid()
  or exists (
    select 1 from public.group_members gm1
    join public.group_members gm2 on gm1.group_id = gm2.group_id
    where gm1.user_id = auth.uid() and gm2.user_id = public.profiles.id
  )
);

create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

-- ------------------------------------------------------------
-- SAVINGS GROUPS
-- ------------------------------------------------------------
create policy "groups_select_member"
on public.savings_groups for select
using (public.is_group_member(id));

create policy "groups_insert_authenticated"
on public.savings_groups for insert
with check (created_by = auth.uid());

create policy "groups_update_owner"
on public.savings_groups for update
using (public.is_group_owner(id));

create policy "groups_delete_owner"
on public.savings_groups for delete
using (public.is_group_owner(id));

-- ------------------------------------------------------------
-- GROUP MEMBERS
-- ------------------------------------------------------------
create policy "members_select_groupmate"
on public.group_members for select
using (public.is_group_member(group_id));

create policy "members_insert_self_via_invite"
on public.group_members for insert
with check (user_id = auth.uid());

create policy "members_delete_self_or_owner"
on public.group_members for delete
using (user_id = auth.uid() or public.is_group_owner(group_id));

create policy "members_update_owner"
on public.group_members for update
using (public.is_group_owner(group_id) or user_id = auth.uid());

-- ------------------------------------------------------------
-- CONTRIBUTIONS
-- ------------------------------------------------------------
create policy "contributions_select_groupmate"
on public.contributions for select
using (public.is_group_member(group_id));

create policy "contributions_insert_groupmate"
on public.contributions for insert
with check (user_id = auth.uid() and public.is_group_member(group_id));

create policy "contributions_update_own"
on public.contributions for update
using (user_id = auth.uid());

create policy "contributions_delete_own"
on public.contributions for delete
using (user_id = auth.uid());

-- ------------------------------------------------------------
-- REMINDER SETTINGS
-- ------------------------------------------------------------
create policy "reminders_select_own"
on public.reminder_settings for select
using (user_id = auth.uid());

create policy "reminders_insert_own"
on public.reminder_settings for insert
with check (user_id = auth.uid());

create policy "reminders_update_own"
on public.reminder_settings for update
using (user_id = auth.uid());

create policy "reminders_delete_own"
on public.reminder_settings for delete
using (user_id = auth.uid());

-- ------------------------------------------------------------
-- PUSH SUBSCRIPTIONS
-- ------------------------------------------------------------
create policy "push_subs_select_own"
on public.push_subscriptions for select
using (user_id = auth.uid());

create policy "push_subs_insert_own"
on public.push_subscriptions for insert
with check (user_id = auth.uid());

create policy "push_subs_delete_own"
on public.push_subscriptions for delete
using (user_id = auth.uid());

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
create policy "notifications_select_own"
on public.notifications for select
using (user_id = auth.uid());

create policy "notifications_update_own"
on public.notifications for update
using (user_id = auth.uid());

create policy "notifications_delete_own"
on public.notifications for delete
using (user_id = auth.uid());

-- service_role (dipakai oleh Edge Functions / cron) otomatis bypass RLS,
-- jadi tidak perlu policy insert khusus untuk notifications dari trigger.
