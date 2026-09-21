-- Section 11: engineer parts / credit operational access.
-- Staff/apprentices may record payments received from engineers as normal operations;
-- sensitive engineer balance administration remains owner-controlled.
create or replace function public.engineer_payment_in(p_engineer_id uuid, p_amount numeric, p_payment_method text default null, p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $function$
declare v_company_id uuid; v_transaction_id uuid; v_user_id uuid; v_balance numeric;
begin
 v_user_id:=auth.uid(); if v_user_id is null then raise exception 'Not authenticated'; end if;
 if not public.has_permission('engineers.work') and not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
 select company_id into v_company_id from public.profiles where id=v_user_id; if v_company_id is null then raise exception 'Company not found'; end if;
 if p_amount is null or p_amount<=0 then raise exception 'Payment amount must be greater than zero'; end if;
 if p_payment_method is not null and p_payment_method not in('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
 if not exists(select 1 from public.engineers where id=p_engineer_id and company_id=v_company_id and status='active') then raise exception 'Engineer not found or inactive'; end if;
 select greatest(coalesce(sum(t.debit),0)-coalesce(sum(t.credit),0),0) into v_balance from public.engineer_transactions t where t.company_id=v_company_id and t.engineer_id=p_engineer_id;
 if p_amount>v_balance then raise exception 'Payment exceeds engineer outstanding balance. Outstanding: %, requested: %',v_balance,p_amount; end if;
 insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,payment_method,notes,created_by) values(v_company_id,p_engineer_id,'payment_in','Payment received from engineer',0,p_amount,p_payment_method,p_notes,v_user_id) returning id into v_transaction_id;
 insert into public.engineer_payments(company_id,engineer_id,payment_type,amount,payment_method,transaction_id,notes,created_by) values(v_company_id,p_engineer_id,'payment_in',p_amount,p_payment_method,v_transaction_id,p_notes,v_user_id);
 return v_transaction_id;
end;$function$;
revoke execute on function public.engineer_payment_in(uuid,numeric,text,text) from public,anon;
grant execute on function public.engineer_payment_in(uuid,numeric,text,text) to authenticated;