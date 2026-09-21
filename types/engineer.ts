export type EngineerStatus = "active" | "inactive";

export type Engineer = {
  id: string;
  company_id: string;
  name: string;
  phone: string | null;
  business_name: string | null;
  address: string | null;
  notes: string | null;
  status: EngineerStatus;
  created_at: string;
  updated_at: string;
};

export type EngineerInput = {
  name: string;
  phone?: string | null;
  business_name?: string | null;
  address?: string | null;
  notes?: string | null;
};

export type EngineerTransactionType =
  | "parts_out"
  | "parts_in"
  | "payment_in"
  | "payment_out"
  | "opening_balance"
  | "adjustment_debit"
  | "adjustment_credit"
  | "faulty_return"
  | "replacement";

export type EngineerPaymentMethod = "cash" | "transfer" | "pos" | "other";

export type EngineerTransaction = {
  id: string;
  company_id: string;
  engineer_id: string;
  transaction_type: EngineerTransactionType;
  reference_id: string | null;
  description: string;
  debit: number;
  credit: number;
  payment_method: EngineerPaymentMethod | null;
  transaction_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type EngineerBalance = {
  engineer_id: string;
  total_debit: number;
  total_credit: number;
  balance: number;
};

export type EngineerAccountSummary = {
  total_debit: number;
  total_credit: number;
  balance: number;
};
