-- Keep the repository-defined sale price approval index; remove the identical duplicate.
drop index if exists public.sale_price_approval_requests_company_status_idx;
