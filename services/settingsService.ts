import { supabase, getCurrentSession } from "@/lib/supabase";

export const settingsService = {
  async getProfileAndCompany() {
    const session = await getCurrentSession();

    if (!session?.user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    return await supabase
      .from("profiles")
      .select("id, full_name, role, company_id, companies(id, name, logo_url, owner_whatsapp_phone, slug, showcase_name, showcase_enabled, showcase_description, showcase_phone, showcase_address, showcase_services)")
      .eq("id", session.user.id)
      .single();
  },

  async updateFullName(userId: string, fullName: string) {
    return await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);
  },

  async updateCompanyName(companyId: string, name: string) {
    return await supabase
      .from("companies")
      .update({ name })
      .eq("id", companyId);
  },

  async updateOwnerWhatsAppPhone(companyId: string, phone: string | null) {
    return await supabase
      .from("companies")
      .update({ owner_whatsapp_phone: phone })
      .eq("id", companyId);
  },

  async updateCompanyLogo(companyId: string, logoUrl: string | null) {
    return await supabase
      .from("companies")
      .update({ logo_url: logoUrl })
      .eq("id", companyId);
  },

  async updateShowcase(companyId: string, payload: {
    slug: string;
    showcase_name: string | null;
    showcase_enabled: boolean;
    showcase_description: string | null;
    showcase_phone: string | null;
    showcase_address: string | null;
    showcase_services: string[];
  }) {
    return await supabase
      .from("companies")
      .update(payload)
      .eq("id", companyId);
  },
};
