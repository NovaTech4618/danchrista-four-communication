-- Danchrista Assistant is a free shop feature.
-- Remove the old Premium access gate from the database policies while
-- keeping conversations/messages private to the authenticated shop user.

drop policy if exists "premium members can create assistant conversations" on public.assistant_conversations;
drop policy if exists "premium members can update assistant conversations" on public.assistant_conversations;
drop policy if exists "premium members can view assistant conversations" on public.assistant_conversations;
drop policy if exists "premium members can create assistant messages" on public.assistant_messages;
drop policy if exists "premium members can view assistant messages" on public.assistant_messages;

drop policy if exists "danchrista staff can create assistant conversations" on public.assistant_conversations;
create policy "danchrista staff can create assistant conversations"
on public.assistant_conversations for insert to authenticated
with check (
  created_by = (select auth.uid())
  and company_id = (select public.get_my_company_id())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.company_id = assistant_conversations.company_id
      and p.is_active = true
  )
);

drop policy if exists "danchrista staff can update assistant conversations" on public.assistant_conversations;
create policy "danchrista staff can update assistant conversations"
on public.assistant_conversations for update to authenticated
using (
  created_by = (select auth.uid())
  and company_id = (select public.get_my_company_id())
)
with check (
  created_by = (select auth.uid())
  and company_id = (select public.get_my_company_id())
);

drop policy if exists "danchrista staff can view assistant conversations" on public.assistant_conversations;
create policy "danchrista staff can view assistant conversations"
on public.assistant_conversations for select to authenticated
using (
  created_by = (select auth.uid())
  and company_id = (select public.get_my_company_id())
);

drop policy if exists "danchrista staff can create assistant messages" on public.assistant_messages;
create policy "danchrista staff can create assistant messages"
on public.assistant_messages for insert to authenticated
with check (
  user_id = (select auth.uid())
  and company_id = (select public.get_my_company_id())
  and exists (
    select 1 from public.assistant_conversations c
    where c.id = assistant_messages.conversation_id
      and c.company_id = assistant_messages.company_id
      and c.created_by = (select auth.uid())
  )
);

drop policy if exists "danchrista staff can view assistant messages" on public.assistant_messages;
create policy "danchrista staff can view assistant messages"
on public.assistant_messages for select to authenticated
using (
  user_id = (select auth.uid())
  and company_id = (select public.get_my_company_id())
  and exists (
    select 1 from public.assistant_conversations c
    where c.id = assistant_messages.conversation_id
      and c.company_id = assistant_messages.company_id
      and c.created_by = (select auth.uid())
  )
);
