"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Plus, ShieldCheck, UserPlus } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { branchService } from "@/services/branchService";
import { staffService } from "@/services/staffService";
import type { Branch, StaffInvitation, StaffMember, StaffRole } from "@/types/staff";
import { STAFF_ROLES } from "@/types/staff";

const ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Owner",
  branch_manager: "Branch Manager",
  technician: "Technician",
  front_desk: "Front Desk",
};

const MANAGEABLE_ROLES = STAFF_ROLES.filter((role) => role !== "owner");
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15";

export default function StaffPage() {
  const [myRole, setMyRole] = useState<StaffRole | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchName, setBranchName] = useState("");
  const [savingBranch, setSavingBranch] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("technician");
  const [inviteBranchIds, setInviteBranchIds] = useState<string[]>([]);
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => { void loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [roleRes, branchRes, staffRes, inviteRes] = await Promise.all([
      staffService.getMyRole(),
      branchService.getBranches(),
      staffService.getStaff(),
      staffService.getInvitations(),
    ]);
    if (roleRes.data) setMyRole(roleRes.data);
    if (branchRes.data) setBranches(branchRes.data as Branch[]);
    if (staffRes.data) setStaff(staffRes.data);
    if (inviteRes.data) setInvitations(inviteRes.data as StaffInvitation[]);
    if (roleRes.error || staffRes.error || inviteRes.error) toast.error("Some staff information could not be loaded.");
    setLoading(false);
  }

  const canManage = myRole === "owner" || myRole === "branch_manager";
  const canManageBranches = myRole === "owner";

  async function handleAddBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!branchName.trim()) return toast.error("Branch name is required.");
    setSavingBranch(true);
    const { error } = await branchService.addBranch({ name: branchName.trim(), address: null, phone: null });
    setSavingBranch(false);
    if (error) return toast.error(error.message);
    setBranchName("");
    toast.success("Branch added.");
    void loadAll();
  }

  async function handleRoleChange(profileId: string, role: StaffRole) {
    const { error } = await staffService.updateStaffRole(profileId, role);
    if (error) return toast.error(error.message);
    toast.success("Staff role updated.");
    void loadAll();
  }

  async function handleToggleActive(profileId: string, isActive: boolean) {
    const { error } = await staffService.setStaffActive(profileId, !isActive);
    if (error) return toast.error(error.message);
    toast.success(!isActive ? "Staff member reactivated." : "Staff member deactivated.");
    void loadAll();
  }

  function toggleInviteBranch(id: string) {
    setInviteBranchIds((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return toast.error("Email is required.");
    if (inviteBranchIds.length === 0) return toast.error("Assign at least one branch.");
    setSendingInvite(true);
    const { error } = await staffService.inviteStaff({ email: inviteEmail.trim(), role: inviteRole, branch_ids: inviteBranchIds });
    setSendingInvite(false);
    if (error) return toast.error(error.message);
    setInviteEmail("");
    setInviteBranchIds([]);
    toast.success("Staff invitation created.");
    void loadAll();
  }

  async function handleRevoke(id: string) {
    const { error } = await staffService.revokeInvitation(id);
    if (error) return toast.error(error.message);
    toast.success("Invitation revoked.");
    void loadAll();
  }

  if (loading) return <AppLayout><div className="space-y-4"><div className="h-8 w-56 animate-pulse rounded bg-slate-100" /><div className="h-40 animate-pulse rounded-2xl bg-slate-100" /></div></AppLayout>;

  if (!canManage) return <AppLayout><Card className="border-dashed border-slate-200 shadow-none"><CardContent className="flex flex-col items-center gap-2 py-12 text-center"><ShieldCheck className="size-6 text-slate-300" /><p className="text-slate-500">Only owners and branch managers can manage staff.</p></CardContent></Card></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-7">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Organization</p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-slate-950">Staff Management</h1>
          <p className="mt-1 text-sm text-slate-500">Ame3ing and approved managers can add staff, control roles, and deactivate access without touching the database.</p>
        </header>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader><div className="flex items-center gap-2"><Building2 className="size-4 text-teal-600" /><CardTitle className="font-heading text-lg">Branches</CardTitle></div></CardHeader>
          <CardContent>
            <div className="mb-5 space-y-2">
              {branches.map((b) => <div key={b.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5"><div className="flex items-center gap-2"><span className="font-semibold text-slate-900">{b.name}</span>{b.is_main && <Badge variant="secondary">Main</Badge>}</div><span className={`text-xs font-medium ${b.is_active ? "text-teal-700" : "text-slate-400"}`}>{b.is_active ? "Active" : "Inactive"}</span></div>)}
            </div>
            {canManageBranches && <form onSubmit={handleAddBranch} className="flex gap-2"><input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="New branch name" className={inputClass} /><Button type="submit" disabled={savingBranch}><Plus className="size-4" />{savingBranch ? "Adding..." : "Add"}</Button></form>}
            {!canManageBranches && <p className="text-xs text-slate-400">Branch structure is controlled by Ame3ing.</p>}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="font-heading text-lg">Staff</CardTitle><p className="text-sm text-slate-500">Owner accounts stay protected. Managers can manage non-owner staff.</p></CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3 text-left">Name</th><th className="px-3 py-3 text-left">Role</th><th className="px-3 py-3 text-left">Branches</th><th className="px-3 py-3 text-left">Status</th><th className="px-3 py-3 text-right">Access</th></tr></thead>
                <tbody>
                  {staff.map((s) => {
                    const isOwner = s.role === "owner";
                    return <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-900">{s.full_name || "Unnamed"}</td>
                      <td className="px-3 py-3">{isOwner ? <Badge variant="secondary">Owner</Badge> : <select value={s.role} onChange={(e) => void handleRoleChange(s.id, e.target.value as StaffRole)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-teal-500">{MANAGEABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select>}</td>
                      <td className="px-3 py-3 text-slate-600">{s.branches.map((b) => b.name).join(", ") || "—"}</td>
                      <td className="px-3 py-3"><Badge variant={s.is_active ? "secondary" : "destructive"}>{s.is_active ? "Active" : "Inactive"}</Badge></td>
                      <td className="px-3 py-3 text-right">{isOwner ? <span className="text-xs font-medium text-slate-400">Protected</span> : <button onClick={() => void handleToggleActive(s.id, s.is_active)} className="text-xs font-medium text-slate-500 underline hover:text-slate-800">{s.is_active ? "Deactivate" : "Reactivate"}</button>}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader><div className="flex items-center gap-2"><UserPlus className="size-4 text-teal-600" /><CardTitle className="font-heading text-lg">Add Staff</CardTitle></div><p className="text-sm text-slate-500">Create an invitation for a technician, front-desk staff member, or branch manager. They create their account from the staff invitation on the sign-in page.</p></CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="grid gap-4 md:grid-cols-2">
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="staff@email.com" className={inputClass} />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as StaffRole)} className={inputClass}>{MANAGEABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select>
              <div className="md:col-span-2"><p className="mb-2 text-sm font-medium text-slate-700">Branch access</p><div className="flex flex-wrap gap-2">{branches.filter((b) => b.is_active).map((b) => <button type="button" key={b.id} onClick={() => toggleInviteBranch(b.id)} className={`rounded-full border px-3 py-1 text-sm font-medium transition ${inviteBranchIds.includes(b.id) ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"}`}>{b.name}</button>)}</div></div>
              <div className="md:col-span-2"><Button type="submit" disabled={sendingInvite}>{sendingInvite ? "Creating..." : "Create staff invitation"}</Button></div>
            </form>
            {invitations.length > 0 && <div className="mt-6 space-y-2">{invitations.map((inv) => <div key={inv.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm"><div><span className="font-medium text-slate-900">{inv.email}</span><span className="ml-2 text-slate-500">{ROLE_LABELS[inv.role]} · {inv.status}</span></div>{inv.status === "pending" && <button onClick={() => void handleRevoke(inv.id)} className="text-xs font-medium text-rose-600 underline">Revoke</button>}</div>)}</div>}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
