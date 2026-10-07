export type MoneyAccountType = "cash" | "bank" | "mobile_money" | "pos" | "other";
export type MoneyAccount = { id:string; company_id:string; name:string; account_type:MoneyAccountType; opening_balance:number; is_active:boolean; created_at:string; };
export type MoneyAccountMovement = { id:string; company_id:string; account_id:string; direction:"in"|"out"; amount:number; category:string; description:string; occurred_at:string; transfer_group_id:string|null; created_by:string|null; created_at:string; };
export type MoneyAccountMovementInput = { account_id:string; direction:"in"|"out"; amount:number; category:string; description:string; occurred_at?:string; };
