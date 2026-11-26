export type Device = {
  id: string;
  customer_id: string;
  device_type: string;
  brand: string;
  model: string;
  imei?: string | null;
  serial_number: string | null;
  color: string | null;
  storage?: string | null;
  condition: string | null;
  physical_condition?: string | null;
  accessories: string | null;
  problem: string;
  created_at: string;
  customers?: { full_name: string; phone?: string | null } | null;
};
