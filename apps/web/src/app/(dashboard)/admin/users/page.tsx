"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, Shield, UserPlus, ScrollText, Loader2, Trash2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, fetchAuditLogs,
  type AdminUser, type AuditLogEntry,
} from "@/lib/admin-api";

const ROLES = ["CEO", "CFO", "OPERATIONS_HEAD", "HR_HEAD", "FINANCE_MANAGER", "PROJECT_MANAGER", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "SUB_MANAGER"];

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<AdminUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  const [form, setForm] = useState({ email: "", password: "", role: "EMPLOYEE" });
  const [editForm, setEditForm] = useState({ email: "", role: "", isActive: true });
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setLoading(true);
    searchTimer.current = setTimeout(async () => {
      setError(null);
      try {
        const result = await fetchAdminUsers({ page, limit: 50, search: search || undefined, role: roleFilter || undefined });
        setUsers(result.users);
        setTotal(result.total);
      } catch {
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, roleFilter, page]);

  useEffect(() => { loadAuditLogs(); }, [auditPage]);

  async function loadAuditLogs() {
    try {
      const result = await fetchAuditLogs({ page: auditPage, limit: 10 });
      setAuditLogs(result.logs);
      setAuditTotal(result.total);
    } catch { /* ignore */ }
  }

  async function handleCreate() {
    if (!form.email || !form.password) return;
    try {
      await createAdminUser(form);
      setShowAdd(false);
      setForm({ email: "", password: "", role: "EMPLOYEE" });
      setPage(1);
    } catch (e: any) {
      alert(e?.response?.data?.error || "Failed to create user");
    }
  }

  async function handleUpdate() {
    if (!showEdit) return;
    try {
      await updateAdminUser(showEdit.id, {
        email: editForm.email,
        role: editForm.role,
        isActive: editForm.isActive,
      });
      setShowEdit(null);
      setPage(1);
    } catch (e: any) {
      alert(e?.response?.data?.error || "Failed to update user");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteAdminUser(deleteId);
      setDeleteId(null);
      setPage(1);
    } catch (e: any) {
      alert(e?.response?.data?.error || "Failed to delete user");
    }
  }

  function openEdit(user: AdminUser) {
    setEditForm({ email: user.email, role: user.role, isActive: user.isActive });
    setShowEdit(user);
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      CEO: "bg-purple-500/10 text-purple-600",
      CFO: "bg-blue-500/10 text-blue-600",
      OPERATIONS_HEAD: "bg-cyan-500/10 text-cyan-600",
      HR_HEAD: "bg-pink-500/10 text-pink-600",
      FINANCE_MANAGER: "bg-indigo-500/10 text-indigo-600",
      PROJECT_MANAGER: "bg-orange-500/10 text-orange-600",
      MANAGER: "bg-amber-500/10 text-amber-600",
      TEAM_LEAD: "bg-lime-500/10 text-lime-600",
      EMPLOYEE: "bg-muted text-muted-foreground",
      SUB_MANAGER: "bg-teal-500/10 text-teal-600",
    };
    return `inline-block px-2 py-0.5 rounded text-[10px] font-bold ${colors[role] || "bg-muted text-muted-foreground"}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" /> User Management
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{total} user{total !== 1 ? "s" : ""} in the system</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowAudit(!showAudit); if (!showAudit) { setAuditPage(1); } }}
              className="border border-border px-3 py-1.5 rounded-md text-xs font-bold hover:bg-muted transition flex items-center gap-1">
              <ScrollText className="h-3.5 w-3.5" /> {showAudit ? "Hide Audit Logs" : "Audit Logs"}
            </button>
            <button onClick={() => setShowAdd(true)}
              className="bg-primary text-primary-foreground font-semibold text-xs py-1.5 px-3 rounded-md shadow-xs hover:opacity-90 transition flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Add User
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              placeholder="Search users..."
              className="w-full pl-8 pr-3 py-1.5 bg-card border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={roleFilter} onChange={(e) => { setPage(1); setRoleFilter(e.target.value); }}
            className="text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={() => { setSearch(""); setRoleFilter(""); setPage(1); }} className="text-xs text-primary hover:underline font-bold">Clear</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive text-xs gap-2">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 font-bold">
                  <th className="p-3 pl-4">User</th>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">MFA</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/40 transition">
                    <td className="p-3 pl-4">
                      <span className="font-bold text-foreground">{u.email}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : <span className="italic">—</span>}
                    </td>
                    <td className="p-3">
                      <span className={roleBadge(u.role)}>{u.role}</span>
                    </td>
                    <td className="p-3">
                      {u.isActive ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive text-[10px] font-bold">
                          <XCircle className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {u.mfaEnabled ? <span className="text-emerald-600 font-bold">Enabled</span> : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition text-[10px] font-bold">Edit</button>
                        <button onClick={() => setDeleteId(u.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground text-xs">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {total > 50 && (
          <div className="flex justify-between items-center pt-3 text-xs text-muted-foreground">
            <span>Page {page} of {Math.ceil(total / 50)}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="px-2 py-1 border border-border rounded disabled:opacity-30 font-bold">Prev</button>
              <button disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(page + 1)}
                className="px-2 py-1 border border-border rounded disabled:opacity-30 font-bold">Next</button>
            </div>
          </div>
        )}
      </div>

      {showAudit && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ScrollText className="h-4 w-4" /> Audit Logs
            </h3>
            <span className="text-[10px] text-muted-foreground font-bold">{auditTotal} entries</span>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 font-bold">
                  <th className="p-2 pl-3">Action</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">IP</th>
                  <th className="p-2 pr-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="p-2 pl-3 font-medium text-foreground">{log.action}</td>
                    <td className="p-2 text-muted-foreground">{log.user.email}</td>
                    <td className="p-2">
                      <span className={`font-bold ${(log.statusCode ?? 0) < 400 ? "text-emerald-600" : "text-destructive"}`}>
                        {log.statusCode || "—"}
                      </span>
                    </td>
                    <td className="p-2 text-muted-foreground font-mono">{log.ipAddress || "—"}</td>
                    <td className="p-2 pr-3 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground text-xs">No audit logs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {auditTotal > 10 && (
            <div className="flex justify-between items-center pt-3 text-xs text-muted-foreground">
              <span>Page {auditPage} of {Math.ceil(auditTotal / 10)}</span>
              <div className="flex gap-2">
                <button disabled={auditPage <= 1} onClick={() => setAuditPage(auditPage - 1)}
                  className="px-2 py-1 border border-border rounded disabled:opacity-30 font-bold">Prev</button>
                <button disabled={auditPage >= Math.ceil(auditTotal / 10)} onClick={() => setAuditPage(auditPage + 1)}
                  className="px-2 py-1 border border-border rounded disabled:opacity-30 font-bold">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs py-2">
            <div>
              <label className="block font-bold text-muted-foreground text-[10px] uppercase mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs" />
            </div>
            <div>
              <label className="block font-bold text-muted-foreground text-[10px] uppercase mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full p-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs" />
            </div>
            <div>
              <label className="block font-bold text-muted-foreground text-[10px] uppercase mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full p-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 border border-border rounded-md text-xs font-bold bg-card hover:bg-muted">Cancel</button>
            <button onClick={handleCreate} disabled={!form.email || !form.password}
              className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:opacity-90 disabled:opacity-50">Create</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showEdit} onOpenChange={(o) => { if (!o) setShowEdit(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs py-2">
            <div>
              <label className="block font-bold text-muted-foreground text-[10px] uppercase mb-1">Email</label>
              <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full p-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs" />
            </div>
            <div>
              <label className="block font-bold text-muted-foreground text-[10px] uppercase mb-1">Role</label>
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full p-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-bold text-muted-foreground text-[10px] uppercase">Active</label>
              <button onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                className={`relative w-9 h-5 rounded-full transition ${editForm.isActive ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition ${editForm.isActive ? "left-4" : "left-0.5"}`} />
              </button>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowEdit(null)} className="px-3 py-1.5 border border-border rounded-md text-xs font-bold bg-card hover:bg-muted">Cancel</button>
            <button onClick={handleUpdate} className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:opacity-90">Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Are you sure you want to delete this user? This will remove all associated data including employee records, notifications, and audit logs. This action cannot be undone.</p>
          <DialogFooter>
            <button onClick={() => setDeleteId(null)} className="px-3 py-1.5 border border-border rounded-md text-xs font-bold bg-card hover:bg-muted">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-1.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-md hover:opacity-90">Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
