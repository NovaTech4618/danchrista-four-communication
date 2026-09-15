-- Phase 1 final customer/repair/invoice financial integrity.
-- No production rows are rewritten by this migration.

ALTER TABLE public.repair_payments ADD COLUMN IF NOT EXISTS idempotency_key uuid;
CREATE UNIQUE INDEX IF NOT EXISTS repair_payments_idempotency_key_uq
  ON public.repair_payments(company_id,idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_repair_customer_debt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare cid uuid; total numeric;
begin
  select d.customer_id,greatest(coalesce(new.final_cost,new.estimated_cost,0),0)
    into cid,total from public.devices d
   where d.id=new.device_id and d.company_id=new.company_id;
  if cid is not null and total>0 then
    insert into public.customer_debt_ledger(company_id,branch_id,customer_id,source_type,source_id,debit,credit,notes,created_by)
    values(new.company_id,new.branch_id,cid,'repair',new.id,total,0,'Repair charge',auth.uid()) on conflict do nothing;
  end if;
  return new;
end; $function$;

CREATE OR REPLACE FUNCTION public.sync_repair_financial_adjustment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare
  old_total numeric:=greatest(coalesce(old.final_cost,old.estimated_cost,0),0);
  new_total numeric:=greatest(coalesce(new.final_cost,new.estimated_cost,0),0);
  delta numeric:=round(new_total-old_total,2);
  v_customer_id uuid; paid numeric; current_balance numeric;
begin
  if delta=0 then return new; end if;
  if old.status in ('Completed','Collected') then
    raise exception 'A completed repair has recognized revenue and its amount is immutable. Use an explicit adjustment workflow instead of editing the historical charge.';
  end if;
  select d.customer_id into v_customer_id from public.devices d where d.id=new.device_id and d.company_id=new.company_id;
  if v_customer_id is null then return new; end if;
  select coalesce(sum(rp.amount),0)+coalesce((select sum(ip.amount) from public.invoice_payments ip join public.invoices i on i.id=ip.invoice_id where i.repair_id=new.id and i.company_id=new.company_id and i.status<>'void' and ip.company_id=new.company_id),0)
    into paid from public.repair_payments rp where rp.repair_id=new.id and rp.company_id=new.company_id;
  if delta<0 and -delta>greatest(old_total-paid,0) then raise exception 'Repair amount cannot be reduced below the amount still owed. Current outstanding: %',greatest(old_total-paid,0); end if;
  perform pg_advisory_xact_lock(hashtextextended(new.company_id::text||':'||v_customer_id::text,0));
  select coalesce(sum(debit-credit),0) into current_balance from public.customer_debt_ledger d where d.company_id=new.company_id and d.customer_id=v_customer_id;
  if delta<0 and -delta>greatest(current_balance,0) then raise exception 'Repair adjustment would create a negative customer balance. Current outstanding: %',greatest(current_balance,0); end if;
  insert into public.customer_debt_ledger(company_id,branch_id,customer_id,source_type,source_id,debit,credit,notes,created_by)
  values(new.company_id,new.branch_id,v_customer_id,'adjustment',new.id,greatest(delta,0),greatest(-delta,0),case when delta>0 then 'Repair amount increase adjustment' else 'Repair amount decrease adjustment' end,auth.uid());
  return new;
end; $function$;

DROP TRIGGER IF EXISTS repair_financial_adjustment_sync ON public.repairs;
CREATE TRIGGER repair_financial_adjustment_sync
AFTER UPDATE OF estimated_cost,final_cost ON public.repairs FOR EACH ROW
WHEN (OLD.estimated_cost IS DISTINCT FROM NEW.estimated_cost OR OLD.final_cost IS DISTINCT FROM NEW.final_cost)
EXECUTE FUNCTION public.sync_repair_financial_adjustment();

CREATE OR REPLACE FUNCTION public.protect_repair_financial_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare has_history boolean;
begin
  if new.device_id is not distinct from old.device_id then return new; end if;
  select exists(select 1 from public.repair_payments where repair_id=old.id
                union all select 1 from public.invoices where repair_id=old.id
                union all select 1 from public.customer_debt_ledger where source_type='repair' and source_id=old.id)
    into has_history;
  if has_history then raise exception 'A repair with financial history cannot be moved to another customer/device.'; end if;
  return new;
end; $function$;
DROP TRIGGER IF EXISTS protect_repair_financial_identity ON public.repairs;
CREATE TRIGGER protect_repair_financial_identity BEFORE UPDATE OF device_id ON public.repairs FOR EACH ROW EXECUTE FUNCTION public.protect_repair_financial_identity();

CREATE OR REPLACE FUNCTION public.create_invoice(p_invoice_number text,p_customer_id uuid DEFAULT NULL::uuid,p_repair_id uuid DEFAULT NULL::uuid,p_sale_id uuid DEFAULT NULL::uuid,p_subtotal numeric DEFAULT 0,p_discount numeric DEFAULT 0,p_total numeric DEFAULT 0,p_due_at timestamp with time zone DEFAULT NULL::timestamp with time zone,p_notes text DEFAULT NULL::text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare v_id uuid;v_company uuid;v_branch uuid;v_source_total numeric;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
  v_company:=public.get_my_company_id(); if v_company is null then raise exception 'Company not found'; end if;
  if trim(coalesce(p_invoice_number,''))='' then raise exception 'Invoice number is required'; end if;
  if p_subtotal<0 or p_discount<0 or p_total<0 or p_discount>p_subtotal then raise exception 'Invalid invoice amounts'; end if;
  if round(p_total,2)<>round(p_subtotal-p_discount,2) then raise exception 'Invoice total must equal subtotal minus discount'; end if;
  if p_repair_id is not null and p_sale_id is not null then raise exception 'Invoice cannot be linked to both a repair and a sale'; end if;
  if p_customer_id is not null and not exists(select 1 from public.customers where id=p_customer_id and company_id=v_company) then raise exception 'Customer not found'; end if;
  if p_repair_id is not null then
    select r.branch_id,greatest(coalesce(r.final_cost,r.estimated_cost,0),0) into v_branch,v_source_total from public.repairs r where r.id=p_repair_id and r.company_id=v_company;
    if not found then raise exception 'Repair not found'; end if;
    if round(p_total,2)<>round(v_source_total,2) then raise exception 'Linked repair invoice total must equal the repair charge'; end if;
  elsif p_sale_id is not null then
    select s.branch_id,greatest(coalesce(s.total,0),0) into v_branch,v_source_total from public.sales s where s.id=p_sale_id and s.company_id=v_company;
    if not found then raise exception 'Sale not found'; end if;
    if round(p_total,2)<>round(v_source_total,2) then raise exception 'Linked sale invoice total must equal the sale total'; end if;
  end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  insert into public.invoices(company_id,branch_id,customer_id,repair_id,sale_id,invoice_number,subtotal,discount,total,due_at,notes,created_by)
  values(v_company,v_branch,p_customer_id,p_repair_id,p_sale_id,trim(p_invoice_number),p_subtotal,p_discount,p_total,p_due_at,p_notes,auth.uid()) returning id into v_id;
  if p_customer_id is not null and p_total>0 and p_repair_id is null and p_sale_id is null then
    perform public.record_customer_debt(p_customer_id,'invoice',v_id,p_total,0,v_id,v_branch,'Invoice issued');
  end if;
  return v_id;
end; $function$;

CREATE OR REPLACE FUNCTION public.create_invoice_with_item(p_invoice_number text,p_customer_id uuid DEFAULT NULL::uuid,p_repair_id uuid DEFAULT NULL::uuid,p_sale_id uuid DEFAULT NULL::uuid,p_subtotal numeric DEFAULT 0,p_discount numeric DEFAULT 0,p_total numeric DEFAULT 0,p_due_at timestamp with time zone DEFAULT NULL::timestamp with time zone,p_notes text DEFAULT NULL::text,p_description text DEFAULT 'Repair / service'::text,p_quantity numeric DEFAULT 1,p_unit_price numeric DEFAULT 0)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare v_id uuid;v_company uuid;v_branch uuid;v_line_total numeric;v_source_total numeric;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
  v_company:=public.get_my_company_id(); if v_company is null then raise exception 'Company not found'; end if;
  if trim(coalesce(p_invoice_number,''))='' then raise exception 'Invoice number is required'; end if;
  if p_quantity<=0 or p_unit_price<0 or trim(coalesce(p_description,''))='' then raise exception 'Invalid invoice item'; end if;
  v_line_total:=round(p_quantity*p_unit_price,2);
  if p_subtotal<0 or p_discount<0 or p_total<0 or p_discount>p_subtotal then raise exception 'Invalid invoice amounts'; end if;
  if round(p_subtotal,2)<>v_line_total then raise exception 'Invoice subtotal must equal its item total'; end if;
  if round(p_total,2)<>round(p_subtotal-p_discount,2) then raise exception 'Invoice total must equal subtotal minus discount'; end if;
  if p_repair_id is not null and p_sale_id is not null then raise exception 'Invoice cannot be linked to both a repair and a sale'; end if;
  if p_customer_id is not null and not exists(select 1 from public.customers where id=p_customer_id and company_id=v_company) then raise exception 'Customer not found'; end if;
  if p_repair_id is not null then
    select r.branch_id,greatest(coalesce(r.final_cost,r.estimated_cost,0),0) into v_branch,v_source_total from public.repairs r where r.id=p_repair_id and r.company_id=v_company;
    if not found then raise exception 'Repair not found'; end if;
    if round(p_total,2)<>round(v_source_total,2) then raise exception 'Linked repair invoice total must equal the repair charge'; end if;
  elsif p_sale_id is not null then
    select s.branch_id,greatest(coalesce(s.total,0),0) into v_branch,v_source_total from public.sales s where s.id=p_sale_id and s.company_id=v_company;
    if not found then raise exception 'Sale not found'; end if;
    if round(p_total,2)<>round(v_source_total,2) then raise exception 'Linked sale invoice total must equal the sale total'; end if;
  end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  insert into public.invoices(company_id,branch_id,customer_id,repair_id,sale_id,invoice_number,subtotal,discount,total,due_at,notes,created_by)
  values(v_company,v_branch,p_customer_id,p_repair_id,p_sale_id,trim(p_invoice_number),p_subtotal,p_discount,p_total,p_due_at,p_notes,auth.uid()) returning id into v_id;
  insert into public.invoice_items(invoice_id,company_id,description,quantity,unit_price) values(v_id,v_company,trim(p_description),p_quantity,p_unit_price);
  if p_customer_id is not null and p_total>0 and p_repair_id is null and p_sale_id is null then
    perform public.record_customer_debt(p_customer_id,'invoice',v_id,p_total,0,v_id,v_branch,'Invoice issued');
  end if;
  return v_id;
end; $function$;

CREATE OR REPLACE FUNCTION public.create_repair_invoice(p_repair_id uuid,p_invoice_number text,p_due_at timestamp with time zone DEFAULT NULL::timestamp with time zone,p_notes text DEFAULT NULL::text,p_description text DEFAULT 'Repair service'::text,p_amount numeric DEFAULT NULL::numeric,p_discount numeric DEFAULT NULL::numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare v_company uuid;v_branch uuid;v_customer uuid;v_total numeric(14,2);v_discount numeric(14,2);v_subtotal numeric(14,2);v_invoice uuid;v_existing uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if; if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if; v_company:=public.get_my_company_id();
  select r.branch_id,d.customer_id,greatest(coalesce(r.final_cost,r.estimated_cost,0),0) into v_branch,v_customer,v_total from public.repairs r join public.devices d on d.id=r.device_id where r.id=p_repair_id and r.company_id=v_company;
  if not found then raise exception 'Repair not found'; end if; if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  if trim(coalesce(p_invoice_number,''))='' then raise exception 'Invoice number is required'; end if;
  select id into v_existing from public.invoices where repair_id=p_repair_id and company_id=v_company and status<>'void' order by created_at asc limit 1; if v_existing is not null then return v_existing; end if;
  if p_amount is not null and round(p_amount,2)<>round(v_total,2) then raise exception 'Repair invoice amount must equal the repair charge'; end if;
  v_discount:=greatest(coalesce(p_discount,0),0); if v_discount>v_total then raise exception 'Discount cannot exceed invoice amount'; end if; v_subtotal:=v_total+v_discount;
  insert into public.invoices(company_id,branch_id,customer_id,repair_id,invoice_number,subtotal,discount,total,due_at,notes,created_by) values(v_company,v_branch,v_customer,p_repair_id,trim(p_invoice_number),v_subtotal,v_discount,v_total,p_due_at,p_notes,auth.uid()) returning id into v_invoice;
  insert into public.invoice_items(invoice_id,company_id,description,quantity,unit_price) values(v_invoice,v_company,trim(coalesce(nullif(p_description,''),'Repair service')),1,v_total); return v_invoice;
end; $function$;

CREATE OR REPLACE FUNCTION public.record_invoice_payment(p_invoice_id uuid,p_amount numeric,p_payment_method text DEFAULT 'cash'::text,p_notes text DEFAULT NULL::text,p_idempotency_key uuid DEFAULT NULL::uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare v_company uuid;v_customer uuid;v_branch uuid;v_total numeric;v_paid numeric;v_id uuid;v_existing uuid;v_user uuid:=auth.uid();v_key uuid:=coalesce(p_idempotency_key,gen_random_uuid());v_status text;v_repair_id uuid;v_sale_id uuid;
begin
  if v_user is null then raise exception 'Not authenticated'; end if; if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if; if p_amount is null or p_amount<=0 then raise exception 'Payment amount must be greater than zero'; end if; if lower(trim(p_payment_method)) not in ('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
  v_company:=public.get_my_company_id(); if v_company is null then raise exception 'Company not found'; end if;
  if p_idempotency_key is not null then select id into v_existing from public.invoice_payments where company_id=v_company and idempotency_key=p_idempotency_key; if v_existing is not null then return v_existing; end if; end if;
  select i.customer_id,i.branch_id,i.total,i.status,i.repair_id,i.sale_id into v_customer,v_branch,v_total,v_status,v_repair_id,v_sale_id from public.invoices i where i.id=p_invoice_id and i.company_id=v_company for update;
  if not found then raise exception 'Invoice not found'; end if; if v_status='void' then raise exception 'Cannot record payment on a void invoice'; end if; if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  select coalesce(sum(amount),0) into v_paid from public.invoice_payments where invoice_id=p_invoice_id and company_id=v_company; if p_amount>greatest(v_total-v_paid,0) then raise exception 'Payment exceeds invoice balance. Remaining: %',greatest(v_total-v_paid,0); end if;
  insert into public.invoice_payments(company_id,branch_id,invoice_id,customer_id,amount,payment_method,notes,recorded_by,idempotency_key) values(v_company,v_branch,p_invoice_id,v_customer,p_amount,lower(trim(p_payment_method)),p_notes,v_user,v_key) returning id into v_id;
  if v_customer is not null and v_sale_id is null then perform public.record_customer_debt(v_customer,'payment',v_id,0,p_amount,p_invoice_id,v_branch,case when v_repair_id is not null then 'Payment for repair invoice ' else 'Payment for invoice ' end||p_invoice_id::text); end if;
  update public.invoices set status=case when v_paid+p_amount>=v_total then 'paid' when v_paid+p_amount>0 then 'part_paid' else 'issued' end where id=p_invoice_id;
  if v_repair_id is not null then update public.repairs set deposit=coalesce((select sum(rp.amount) from public.repair_payments rp where rp.repair_id=v_repair_id and rp.company_id=v_company),0)+coalesce((select sum(ip.amount) from public.invoice_payments ip join public.invoices ii on ii.id=ip.invoice_id where ii.repair_id=v_repair_id and ii.company_id=v_company and ip.company_id=v_company and ii.status<>'void'),0) where id=v_repair_id and company_id=v_company; end if;
  return v_id;
exception when unique_violation then select id into v_existing from public.invoice_payments where company_id=v_company and idempotency_key=v_key; if v_existing is not null then return v_existing; end if; raise; end; $function$;

DROP FUNCTION IF EXISTS public.record_repair_payment(uuid,numeric,text,timestamp with time zone,text);
CREATE OR REPLACE FUNCTION public.record_repair_payment(p_repair_id uuid,p_amount numeric,p_payment_method text DEFAULT 'Cash'::text,p_payment_date timestamp with time zone DEFAULT now(),p_notes text DEFAULT NULL::text,p_idempotency_key uuid DEFAULT NULL::uuid)
RETURNS TABLE(payment_id uuid,repair_id uuid,amount numeric,total_cost numeric,total_paid numeric,outstanding numeric,payment_status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare v_company_id uuid;v_total_cost numeric(14,2);v_paid numeric(14,2);v_payment_id uuid;v_user_id uuid:=auth.uid();v_branch uuid;v_existing uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if; if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if; if p_amount is null or p_amount<=0 then raise exception 'Payment amount must be greater than zero'; end if; if lower(trim(coalesce(p_payment_method,''))) not in ('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
  select r.company_id,greatest(coalesce(r.final_cost,r.estimated_cost,0),0),r.branch_id into v_company_id,v_total_cost,v_branch from public.repairs r where r.id=p_repair_id for update;
  if v_company_id is null then raise exception 'Repair not found'; end if; if v_company_id<>public.get_my_company_id() then raise exception 'Repair does not belong to your company'; end if; if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  if p_idempotency_key is not null then
    select id into v_existing from public.repair_payments where company_id=v_company_id and idempotency_key=p_idempotency_key;
    if v_existing is not null then
      select coalesce(sum(rp.amount),0)+coalesce((select sum(ip.amount) from public.invoice_payments ip join public.invoices i on i.id=ip.invoice_id where i.repair_id=p_repair_id and i.company_id=v_company_id and ip.company_id=v_company_id and i.status<>'void'),0) into v_paid from public.repair_payments rp where rp.repair_id=p_repair_id and rp.company_id=v_company_id;
      return query select rp.id,rp.repair_id,rp.amount,v_total_cost,v_paid,greatest(v_total_cost-v_paid,0),case when v_total_cost=0 or v_paid>=v_total_cost then 'Paid' when v_paid>0 then 'Partially paid' else 'Unpaid' end from public.repair_payments rp where rp.id=v_existing; return;
    end if;
  end if;
  select coalesce(sum(rp.amount),0)+coalesce((select sum(ip.amount) from public.invoice_payments ip join public.invoices i on i.id=ip.invoice_id where i.repair_id=p_repair_id and i.company_id=v_company_id and ip.company_id=v_company_id and i.status<>'void'),0) into v_paid from public.repair_payments rp where rp.repair_id=p_repair_id and rp.company_id=v_company_id;
  if v_paid+p_amount>v_total_cost then raise exception 'Payment exceeds outstanding repair balance. Outstanding: %',greatest(v_total_cost-v_paid,0); end if;
  insert into public.repair_payments(company_id,repair_id,amount,payment_method,payment_date,notes,recorded_by,idempotency_key) values(v_company_id,p_repair_id,p_amount,lower(trim(coalesce(p_payment_method,'cash'))),coalesce(p_payment_date,now()),p_notes,v_user_id,p_idempotency_key) returning id into v_payment_id;
  update public.repairs set deposit=v_paid+p_amount where id=p_repair_id;
  return query select v_payment_id,p_repair_id,p_amount,v_total_cost,v_paid+p_amount,greatest(v_total_cost-(v_paid+p_amount),0),case when v_total_cost=0 or v_paid+p_amount>=v_total_cost then 'Paid' when v_paid+p_amount>0 then 'Partially paid' else 'Unpaid' end;
exception when unique_violation then select id into v_existing from public.repair_payments where company_id=v_company_id and idempotency_key=p_idempotency_key; if v_existing is not null then select coalesce(sum(rp.amount),0)+coalesce((select sum(ip.amount) from public.invoice_payments ip join public.invoices i on i.id=ip.invoice_id where i.repair_id=p_repair_id and i.company_id=v_company_id and ip.company_id=v_company_id and i.status<>'void'),0) into v_paid from public.repair_payments rp where rp.repair_id=p_repair_id and rp.company_id=v_company_id; return query select rp.id,rp.repair_id,rp.amount,v_total_cost,v_paid,greatest(v_total_cost-v_paid,0),case when v_total_cost=0 or v_paid>=v_total_cost then 'Paid' when v_paid>0 then 'Partially paid' else 'Unpaid' end from public.repair_payments rp where rp.id=v_existing; return; end if; raise; end; $function$;

CREATE OR REPLACE FUNCTION public.sync_sale_customer_debt() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare cid uuid;amount numeric;begin cid:=new.customer_id;amount:=coalesce(new.total,0);if cid is not null and amount>0 then insert into public.customer_debt_ledger(company_id,branch_id,customer_id,source_type,source_id,debit,credit,notes,created_by) values(new.company_id,new.branch_id,cid,'sale',new.id,amount,0,'Sales charge',auth.uid());insert into public.customer_debt_ledger(company_id,branch_id,customer_id,source_type,source_id,debit,credit,notes,created_by) values(new.company_id,new.branch_id,cid,'payment',new.id,0,amount,'Sale payment received',auth.uid());end if;return new;end;$function$;

CREATE OR REPLACE VIEW public.repair_balance_view AS
WITH charges AS (SELECT r.id repair_id,r.company_id,r.branch_id,r.device_id,r.status,greatest(coalesce(sum(d.debit-d.credit),0),0) total_amount FROM public.repairs r LEFT JOIN public.customer_debt_ledger d ON d.company_id=r.company_id AND d.source_id=r.id AND d.source_type IN ('repair','adjustment') GROUP BY r.id,r.company_id,r.branch_id,r.device_id,r.status),paid AS (SELECT r.id repair_id,r.company_id,coalesce((select sum(rp.amount) from public.repair_payments rp where rp.repair_id=r.id and rp.company_id=r.company_id),0)+coalesce((select sum(ip.amount) from public.invoice_payments ip join public.invoices i on i.id=ip.invoice_id where i.repair_id=r.id and i.company_id=r.company_id and i.status<>'void' and ip.company_id=r.company_id),0) paid_amount FROM public.repairs r)
SELECT c.repair_id,c.company_id,c.branch_id,c.device_id,c.status,c.total_amount,p.paid_amount,case when c.status in ('Cancelled','Returned Unrepaired') then 0 else greatest(c.total_amount-p.paid_amount,0) end outstanding,case when c.status in ('Cancelled','Returned Unrepaired') then 'Not chargeable' when p.paid_amount>=c.total_amount then 'Paid' when p.paid_amount>0 then 'Partially paid' else 'Unpaid' end payment_status FROM charges c join paid p on p.repair_id=c.repair_id and p.company_id=c.company_id WHERE c.total_amount>0;

CREATE OR REPLACE VIEW public.invoice_balance_view AS
WITH invoice_paid AS (SELECT ip.invoice_id,ip.company_id,coalesce(sum(ip.amount),0) paid FROM public.invoice_payments ip GROUP BY ip.invoice_id,ip.company_id),repair_source AS (SELECT r.id repair_id,r.company_id,coalesce(v.total_amount,0) total_amount,coalesce(v.paid_amount,0) paid_amount,coalesce(v.outstanding,0) outstanding FROM public.repairs r join public.repair_balance_view v on v.repair_id=r.id and v.company_id=r.company_id)
SELECT i.id,i.company_id,i.branch_id,i.invoice_number,i.customer_id,i.repair_id,i.sale_id,i.status,i.subtotal,i.discount,i.total,i.issued_at,i.due_at,i.notes,case when i.repair_id is not null then rs.paid_amount when i.sale_id is not null then i.total else coalesce(ip.paid,0) end paid_amount,case when i.status='void' then 0 when i.repair_id is not null then rs.outstanding when i.sale_id is not null then 0 else greatest(i.total-coalesce(ip.paid,0),0) end outstanding,case when i.status='void' then 'Void' when i.repair_id is not null and rs.outstanding<=0 then 'Paid' when i.repair_id is not null and rs.paid_amount>0 then 'Partially paid' when i.repair_id is not null then 'Unpaid' when i.sale_id is not null then 'Paid' when coalesce(ip.paid,0)>=i.total then 'Paid' when coalesce(ip.paid,0)>0 then 'Partially paid' else 'Unpaid' end payment_status FROM public.invoices i LEFT JOIN invoice_paid ip on ip.invoice_id=i.id and ip.company_id=i.company_id LEFT JOIN repair_source rs on rs.repair_id=i.repair_id and rs.company_id=i.company_id;

CREATE OR REPLACE VIEW public.customer_financial_reconciliation AS
WITH ledger AS (SELECT customer_id,company_id,coalesce(sum(debit-credit),0) ledger_balance FROM public.customer_debt_ledger GROUP BY customer_id,company_id),repairs_source AS (SELECT d.customer_id,r.company_id,coalesce(sum(v.outstanding),0) repair_outstanding FROM public.repairs r join public.devices d on d.id=r.device_id join public.repair_balance_view v on v.repair_id=r.id and v.company_id=r.company_id GROUP BY d.customer_id,r.company_id),standalone AS (SELECT i.customer_id,i.company_id,coalesce(sum(v.outstanding),0) invoice_outstanding FROM public.invoices i join public.invoice_balance_view v on v.id=i.id WHERE i.repair_id is null and i.sale_id is null and i.status<>'void' and i.customer_id is not null GROUP BY i.customer_id,i.company_id)
SELECT c.id customer_id,c.company_id,c.full_name,c.phone,coalesce(l.ledger_balance,0) ledger_balance,coalesce(r.repair_outstanding,0)+coalesce(s.invoice_outstanding,0) source_balance,round(coalesce(l.ledger_balance,0)-(coalesce(r.repair_outstanding,0)+coalesce(s.invoice_outstanding,0)),2) discrepancy FROM public.customers c LEFT JOIN ledger l on l.customer_id=c.id and l.company_id=c.company_id LEFT JOIN repairs_source r on r.customer_id=c.id and r.company_id=c.company_id LEFT JOIN standalone s on s.customer_id=c.id and s.company_id=c.company_id;