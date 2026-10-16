import { supabase } from "@/lib/supabase";
import type { StaffInvitationInput, StaffMember, StaffRole } from "@/types/staff";

export const staffService = {
  async getMyRole(): Promise<{ data: StaffRole | null; error: Error | null }> {
    const { data, error } = await supabase.rpc("get_my_role");
    if (error) return { data: null, error };
    return { data: data as StaffRole, error: null };
  },

  async getStaff() {
    const { data, error } = await supabase
      .from("profiles")
      .select(`id, full_name, role, is_active, created_at, user_branches ( branches ( id, name ) )`)
      .order("created_at", { ascending: true });

    if (error) return { data: null, error };

    const staff: StaffMember[] = (data || []).map((row) => {
      const rawBranches = (row as { user_branches?: unknown }).user_branches;
      const branchList = Array.isArray(rawBranches) ? rawBranches : [];
      return {
        id: row.id,
        full_name: row.full_name,
        role: row.role as StaffRole,
        is_active: row.is_active,
        created_at: row.created_at,
        branches: branchList
          .map((ub) => {
            const b = (ub as { branches?: unknown }).branches;
            return Array.isArray(b) ? b[0] : b;
          })
          .filter(Boolean) as StaffMember["branches"],
      };
    });
    return { data: staff, error: null };
  },

  async updateStaffRole(profileId: string, role: StaffRole) {
    return await supabase.rpc("update_staff_role", { p_profile_id: profileId, p_role: role });
  },

  async setStaffActive(profileId: string, isActive: boolean) {
    return await supabase.rpc("set_staff_active", { p_profile_id: profileId, p_is_active: isActive });
  },

  async getInvitations() {
    return await supabase.from("staff_invitations").select("*").order("created_at", { ascending: false });
  },

  async inviteStaff(invitation: StaffInvitationInput) {
    const email = invitation.email.trim().toLowerCase();
    const { data, error } = await supabase.functions.invoke("invite-staff", {
      body: { email, branch_ids: invitation.branch_ids },
    });
    if (error) {
      const details = data && typeof data === "object" && "error" in data ? String(data.error) : error.message;
      return { data: null, error: new Error(details || "Could not send staff invitation email.") };
    }
    if (!data?.ok) return { data: null, error: new Error(data?.error || "Could not send staff invitation email.") };
    return { data, error: null };
  },

  async revokeInvitation(id: string) {
    return await supabase.from("staff_invitations").update({ status: "revoked" }).eq("id", id);
  },
};
