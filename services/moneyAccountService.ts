import { supabase } from "@/lib/supabase";
import type { MoneyAccount, MoneyAccountMovement, MoneyAccountMovementInput, MoneyAccountType } from "@/types/moneyAccount";

const DEFAULT_ACCOUNTS: Array<{name:string;account_type:MoneyAccountType}> = [
  {name:"Cash",account_type:"cash"}, {name:"OPay",account_type:"mobile_money"},
  {name:"Moniepoint",account_type:"pos"}, {name:"GTBank",account_type:"bank"},
];

async function companyId(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {id:null,error:new Error("You must be signed in.")};
  const {data,error}=await supabase.from("profiles").select("company_id").eq("id",user.id).single();
  return {id:data?.company_id??null,error:error??(!data?.company_id?new Error("Your account is not linked to a company."):null)};
}

export const moneyAccountService={
  async getAccounts(){
    const c=await companyId(); if(c.error||!c.id)return {data:null,error:c.error};
    const {data:existing,error}=await supabase.from("money_accounts").select("*").eq("company_id",c.id).eq("is_active",true).order("name");
    if(error)return {data:null,error};
    const names=new Set((existing??[]).map((x)=>x.name));
    const missing=DEFAULT_ACCOUNTS.filter((x)=>!names.has(x.name)).map((x)=>({...x,company_id:c.id}));
    if(missing.length) await supabase.from("money_accounts").insert(missing);
    return await supabase.from("money_accounts").select("*").eq("company_id",c.id).eq("is_active",true).order("name").returns<MoneyAccount[]>();
  },
  async getManualMovements(){
    return await supabase.from("money_account_movements").select("*").order("occurred_at",{ascending:false}).limit(300).returns<MoneyAccountMovement[]>();
  },
  async getBusinessTransactions(){
    return await supabase.from("financial_transactions").select("id,direction,category,amount,payment_method,payment_account,description,occurred_at,source_type,source_id").not("payment_account","is",null).order("occurred_at",{ascending:false}).limit(5000);
  },
  async addMovement(input:MoneyAccountMovementInput){
    const c=await companyId(); if(c.error||!c.id)return {data:null,error:c.error};
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return {data:null,error:new Error("You must be signed in.")};
    return await supabase.from("money_account_movements").insert({...input,company_id:c.id,created_by:user.id,occurred_at:input.occurred_at||new Date().toISOString()}).select().single();
  },
  async transfer(fromAccountId:string,toAccountId:string,amount:number,description:string,occurredAt?:string){
    return await supabase.rpc("transfer_money_between_accounts",{p_from_account:fromAccountId,p_to_account:toAccountId,p_amount:amount,p_description:description,p_occurred_at:occurredAt||new Date().toISOString()});
  },
  async updateOpeningBalance(accountId:string,openingBalance:number){
    return await supabase.from("money_accounts").update({opening_balance:openingBalance,updated_at:new Date().toISOString()}).eq("id",accountId).select().single();
  },
};
