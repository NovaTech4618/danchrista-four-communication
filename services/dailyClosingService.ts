import { hasPermission } from "@/lib/permissions";
import { getCurrentSession, supabase } from "@/lib/supabase";
import { staffService } from "@/services/staffService";

export type DailyClosing = {
  id: string;
  company_id: string;
  business_date: string;
  status: "open" | "closed";
  opening_cash: number;
  opening_cash_source: string | null;
  opening_cash_source_closing_id: string | null;
  expected_cash: number | null;
  actual_cash: number | null;
  cash_discrepancy: number | null;
  revenue_total: number;
  sales_revenue: number;
  repair_revenue: number;
  engineer_revenue: number;
  standalone_invoice_revenue: number;
  cash_received_total: number;
  customer_outstanding: number;
  engineer_outstanding: number;
  cogs_total: number;
  operating_expenses: number;
  engineer_direct_cost: number;
  gross_profit: number;
  net_profit: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  closed_by: string | null;
  closed_by_name?: string | null;
  closed_at: string | null;
  reopened_by: string | null;
  reopened_at: string | null;
  reopen_reason: string | null;
};

export type DailyClosingPaymentMethod = {
  id: string;
  daily_closing_id: string;
  payment_method: "cash" | "transfer" | "pos" | "other";
  expected_amount: number;
  actual_amount: number | null;
  discrepancy: number | null;
  transaction_count: number;
  notes: string | null;
};

export type PaymentMethodActuals = Record<DailyClosingPaymentMethod["payment_method"], number>;

export type DailyClosingServiceResult<T = DailyClosing> = {
  data: T | null;
  error: Error | null;
};

export class DailyClosingValidationError extends Error {
  readonly code = "validation" as const;

  constructor(message: string) {
    super(message);
    this.name = "DailyClosingValidationError";
  }
}

function validation<T = DailyClosing>(message: string): DailyClosingServiceResult<T> {
  return { data: null, error: new DailyClosingValidationError(message) };
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return new Error(message);
  }
  return new Error(fallback);
}

async function authorize(): Promise<Error | null> {
  const session = await getCurrentSession();
  if (!session?.user) return new Error("You must be signed in.");

  const roleResult = await staffService.getMyRole();
  if (roleResult.error) return normalizeError(roleResult.error, "Unable to verify your permissions.");
  if (!roleResult.data || !hasPermission(roleResult.data, "daily_closing")) {
    return new Error("You do not have permission to manage daily closing.");
  }

  return null;
}

function validateBusinessDate(value: string): Error | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new DailyClosingValidationError("Business date must use YYYY-MM-DD format.");
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    return new DailyClosingValidationError("Business date is invalid.");
  }
  return null;
}

function validateNonNegativeAmount(value: number, label: string): Error | null {
  if (!Number.isFinite(value)) return new DailyClosingValidationError(`${label} must be a valid number.`);
  if (value < 0) return new DailyClosingValidationError(`${label} cannot be negative.`);
  return null;
}

function validatePaymentMethodActuals(actuals: PaymentMethodActuals): Error | null {
  for (const method of ["cash", "transfer", "pos", "other"] as const) {
    const error = validateNonNegativeAmount(actuals[method], `${method.toUpperCase()} actual amount`);
    if (error) return error;
  }
  return null;
}

async function callRpc<T>(
  operation: string,
  rpc: () => Promise<{ data: T | null; error: unknown }>,
): Promise<DailyClosingServiceResult<T>> {
  try {
    const authError = await authorize();
    if (authError) return { data: null, error: authError };

    const result = await rpc();
    if (result.error) return { data: null, error: normalizeError(result.error, `Unable to ${operation}.`) };
    return { data: result.data, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error, `Unable to ${operation}.`) };
  }
}

export const dailyClosingService = {
  async getByDate(businessDate: string): Promise<DailyClosingServiceResult> {
    const dateError = validateBusinessDate(businessDate);
    if (dateError) return { data: null, error: dateError };

    try {
      const authError = await authorize();
      if (authError) return { data: null, error: authError };

      const result = await supabase
        .from("daily_closings")
        .select("*")
        .eq("business_date", businessDate)
        .maybeSingle();
      if (result.error) return { data: null, error: normalizeError(result.error, "Unable to load daily closing.") };
      if (!result.data) return { data: null, error: null };

      let closedByName: string | null = null;
      if (result.data.closed_by) {
        const profile = await supabase.from("profiles").select("full_name").eq("id", result.data.closed_by).maybeSingle();
        if (!profile.error) closedByName = profile.data?.full_name ?? null;
      }

      return { data: { ...result.data, closed_by_name: closedByName } as DailyClosing, error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error, "Unable to load daily closing.") };
    }
  },

  async getPaymentMethods(dailyClosingId: string): Promise<DailyClosingServiceResult<DailyClosingPaymentMethod[]>> {
    if (!dailyClosingId.trim()) return validation<DailyClosingPaymentMethod[]>("Daily closing ID is required.");

    try {
      const authError = await authorize();
      if (authError) return { data: null, error: authError };

      const result = await supabase
        .from("daily_closing_payment_methods")
        .select("id,daily_closing_id,payment_method,expected_amount,actual_amount,discrepancy,transaction_count,notes")
        .eq("daily_closing_id", dailyClosingId)
        .order("payment_method");
      if (result.error) return { data: null, error: normalizeError(result.error, "Unable to load payment methods.") };
      return { data: (result.data ?? []) as DailyClosingPaymentMethod[], error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error, "Unable to load payment methods.") };
    }
  },

  async open(businessDate: string, initialOpeningCash?: number | null): Promise<DailyClosingServiceResult> {
    const dateError = validateBusinessDate(businessDate);
    if (dateError) return { data: null, error: dateError };

    if (initialOpeningCash !== undefined && initialOpeningCash !== null) {
      const amountError = validateNonNegativeAmount(initialOpeningCash, "Opening cash");
      if (amountError) return { data: null, error: amountError };
    }

    return callRpc("open daily closing", async () => {
      const result = await supabase.rpc("open_daily_closing", {
        p_business_date: businessDate,
        p_initial_opening_cash: initialOpeningCash ?? null,
      });
      return { data: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: result.error };
    });
  },

  async reconcile(dailyClosingId: string): Promise<DailyClosingServiceResult> {
    if (!dailyClosingId.trim()) return validation("Daily closing ID is required.");

    return callRpc("reconcile daily closing", async () => {
      const result = await supabase.rpc("reconcile_daily_closing", {
        p_daily_closing_id: dailyClosingId,
      });
      return { data: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: result.error };
    });
  },

  async close(
    dailyClosingId: string,
    actualCash: number,
    notes?: string | null,
    paymentMethodActuals?: PaymentMethodActuals,
  ): Promise<DailyClosingServiceResult> {
    if (!dailyClosingId.trim()) return validation("Daily closing ID is required.");
    const amountError = validateNonNegativeAmount(actualCash, "Actual cash");
    if (amountError) return { data: null, error: amountError };
    if (paymentMethodActuals) {
      const methodsError = validatePaymentMethodActuals(paymentMethodActuals);
      if (methodsError) return { data: null, error: methodsError };
    }

    return callRpc("close daily closing", async () => {
      const result = paymentMethodActuals
        ? await supabase.rpc("close_daily_closing_with_payment_methods", {
            p_daily_closing_id: dailyClosingId,
            p_actual_cash: actualCash,
            p_notes: notes?.trim() || null,
            p_payment_methods: paymentMethodActuals,
          })
        : await supabase.rpc("close_daily_closing", {
            p_daily_closing_id: dailyClosingId,
            p_actual_cash: actualCash,
            p_notes: notes?.trim() || null,
          });
      return { data: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: result.error };
    });
  },

  async reopen(dailyClosingId: string, reason: string): Promise<DailyClosingServiceResult> {
    if (!dailyClosingId.trim()) return validation("Daily closing ID is required.");
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 3) return validation("A reopen reason must be at least 3 characters.");

    return callRpc("reopen daily closing", async () => {
      const result = await supabase.rpc("reopen_daily_closing", {
        p_daily_closing_id: dailyClosingId,
        p_reason: normalizedReason,
      });
      return { data: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: result.error };
    });
  },
};
