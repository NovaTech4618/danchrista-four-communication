-- Phase 1 Section 15 audit fix.
-- Returns/replacements must use the canonical inventory movement RPC.
-- Direct inventory.quantity updates are intentionally blocked by the ledger guard.

create or replace function public.approve_sale_return(p_request_id uuid,p_decision_note text default null)
returns uuid language plpgsql security definer set search_path='public' as $$
declare
 r public.sale_return_requests%rowtype;
 x record;
 inv public.inventory%rowtype;
 outflow uuid;
begin
 if auth.uid() is null or not public.has_permission('sales.return_manage') then
   raise exception 'Only the Boss can approve returns, refunds or replacements';
 end if;
 select * into r from public.sale_return_requests
 where id=p_request_id and company_id=public.get_my_company_id() for update;
 if r.id is null or r.status<>'pending' then raise exception 'Return request not found or no longer pending'; end if;

 if r.action='replacement' then
   select * into inv from public.inventory
   where id=r.replacement_inventory_id and company_id=r.company_id for update;
   if not found or inv.quantity<coalesce(r.replacement_quantity,0) then
     raise exception 'Replacement stock is unavailable';
   end if;
 end if;

 for x in
   select sri.quantity,sri.sale_item_id,si.inventory_id,si.unit_price
   from public.sale_return_items sri
   join public.sale_items si on si.id=sri.sale_item_id
   where sri.request_id=r.id
 loop
   select * into inv from public.inventory
   where id=x.inventory_id and company_id=r.company_id for update;
   if not found then raise exception 'Inventory item no longer exists'; end if;
   perform public.record_inventory_movement(
     inv.id,'sale_return',x.quantity,coalesce(inv.cost_price,0),
     'sale_return',r.id,r.reason
   );
 end loop;

 if r.action='replacement' then
   perform public.record_inventory_movement(
     r.replacement_inventory_id,'replacement_out',
     r.replacement_quantity,coalesce(inv.cost_price,0),
     'sale_return',r.id,'Replacement issued'
   );
 elsif r.action='refund' then
   insert into public.financial_transactions(
     company_id,branch_id,direction,category,amount,payment_method,
     description,source_type,source_id,occurred_at,recorded_by
   )
   values(
     r.company_id,r.branch_id,'out','customer_refund',r.refund_amount,
     coalesce(r.refund_payment_method,'cash'),
     'Customer refund for sale '||left(r.sale_id::text,8),
     'sale_refund',r.id,now(),auth.uid()
   ) returning id into outflow;
 end if;

 update public.sale_return_requests
 set status='used',approved_by=auth.uid(),decided_at=now(),used_at=now(),
     notes=case when p_decision_note is null then notes
                else coalesce(notes,'')||' Boss: '||p_decision_note end
 where id=r.id;

 perform public.write_audit_log(
   'sale.return_approved','sale_return_request',r.id,null,null,
   jsonb_build_object('approved_by',auth.uid(),'action',r.action,
     'refund_amount',r.refund_amount,'sale_id',r.sale_id,
     'decision_note',p_decision_note)
 );
 return r.id;
end; $$;
