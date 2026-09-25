import { supabase } from "@/lib/supabase";
import type { InventoryItem, InventoryItemInput } from "@/types/inventory";

const BUCKET = "inventory-images";
const IMAGE_EXPIRY_SECONDS = 60 * 60;

async function withSignedImage(item: InventoryItem): Promise<InventoryItem> {
  if (!item.image_path) return item;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(item.image_path, IMAGE_EXPIRY_SECONDS);
  if (error || !data?.signedUrl) return { ...item, image_url: null };
  return { ...item, image_url: data.signedUrl };
}

async function withSignedImages(items: InventoryItem[]): Promise<InventoryItem[]> {
  const paths = items.map((item) => item.image_path).filter((path): path is string => Boolean(path));
  if (!paths.length) return items;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, IMAGE_EXPIRY_SECONDS);
  const signedByPath = new Map((data || []).map((entry) => [entry.path, entry.signedUrl]));
  return items.map((item) => item.image_path ? { ...item, image_url: signedByPath.get(item.image_path) || null } : item);
}

function validateImage(file: File) {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(file.type)) return new Error("Use a JPG, PNG, or WebP image.");
  if (file.size > 5 * 1024 * 1024) return new Error("Image must be 5MB or smaller.");
  return null;
}

async function getCompanyId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { companyId: null, error: new Error("You must be signed in.") };
  const { data, error } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
  if (error || !data?.company_id) return { companyId: null, error: error || new Error("Your account is not linked to a company.") };
  return { companyId: data.company_id as string, error: null };
}

export const inventoryService = {
  async getInventory() {
    const result = await supabase.from("inventory").select("*").eq("is_active", true).order("item_name", { ascending: true });
    if (result.error) return result;
    return { ...result, data: await withSignedImages((result.data || []) as InventoryItem[]) };
  },
  async getInventoryById(id: string) {
    const result = await supabase.from("inventory").select("*").eq("id", id).single();
    if (result.error || !result.data) return result;
    return { ...result, data: await withSignedImage(result.data as InventoryItem) };
  },
  async getLowStock() {
    const { data, error } = await supabase.from("inventory").select("id,item_name,quantity,minimum_stock").eq("is_active", true).order("quantity", { ascending: true });
    if (error) return { data: null, error };
    return { data: (data || []).filter((i) => i.quantity <= i.minimum_stock).slice(0, 5), error: null };
  },
  async addInventoryItem(item: InventoryItemInput) {
    return await supabase.from("inventory").insert([item]).select("*").single();
  },
  async updateInventoryItem(id: string, item: InventoryItemInput) {
    return await supabase.from("inventory").update({ ...item, updated_at: new Date().toISOString() }).eq("id", id);
  },
  async deactivateInventoryItem(id: string) {
    return await supabase.from("inventory").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
  },
  async uploadItemImage(itemId: string, file: File) {
    const validationError = validateImage(file);
    if (validationError) return { data: null, error: validationError };
    const { companyId, error: companyError } = await getCompanyId();
    if (companyError || !companyId) return { data: null, error: companyError || new Error("Company not found.") };
    const current = await supabase.from("inventory").select("image_path").eq("id", itemId).single();
    if (current.error) return { data: null, error: current.error };
    const oldPath = current.data?.image_path || null;
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${companyId}/${itemId}.${extension}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
    if (error) return { data: null, error };
    const { error: updateError } = await supabase.from("inventory").update({ image_path: path, image_url: null, updated_at: new Date().toISOString() }).eq("id", itemId);
    if (updateError) {
      if (path !== oldPath) await supabase.storage.from(BUCKET).remove([path]);
      return { data: null, error: updateError };
    }
    if (oldPath && oldPath !== path) {
      const { error: removeOldError } = await supabase.storage.from(BUCKET).remove([oldPath]);
      if (removeOldError) return { data: null, error: removeOldError };
    }
    const signed = await supabase.storage.from(BUCKET).createSignedUrl(path, IMAGE_EXPIRY_SECONDS);
    return { data: signed.data?.signedUrl || null, error: signed.error };
  },
  async removeItemImage(itemId: string) {
    const current = await supabase.from("inventory").select("image_path").eq("id", itemId).single();
    if (current.error) return current;
    const oldPath = current.data?.image_path || null;
    const updated = await supabase.from("inventory").update({ image_path: null, image_url: null, updated_at: new Date().toISOString() }).eq("id", itemId);
    if (updated.error) return updated;
    if (oldPath) {
      const { error } = await supabase.storage.from(BUCKET).remove([oldPath]);
      if (error) return { data: null, error };
    }
    return updated;
  },
  async setOpeningStock(inventoryId: string, quantity: number, costPrice: number, sellingPrice: number, minimumSellingPrice: number, minimumStock = 5) {
    return await supabase.rpc("set_inventory_opening_stock", {
      p_inventory_id: inventoryId,
      p_quantity: quantity,
      p_cost_price: costPrice,
      p_selling_price: sellingPrice,
      p_minimum_selling_price: minimumSellingPrice,
      p_minimum_stock: minimumStock,
    });
  },
  async createInventoryTransfer(inventoryId: string, toBranchId: string, quantity: number, notes?: string | null) {
    return await supabase.rpc("create_inventory_transfer", { p_inventory_id: inventoryId, p_to_branch_id: toBranchId, p_quantity: quantity, p_notes: notes?.trim() || null });
  },
  async getTransferHistory(limit = 50) {
    return await supabase.from("inventory_transfers").select("id, inventory_id, from_branch_id, to_branch_id, quantity, status, notes, created_at").order("created_at", { ascending: false }).limit(limit);
  },
};
