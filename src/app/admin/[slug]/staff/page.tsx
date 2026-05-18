"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { Loader2, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { hasPermission, permissionsForRole } from "@/lib/auth-roles";
import { useAuth } from "@/providers/AuthProvider";
import { Role } from "@/types";
import { AdminAlert, AdminEmptyState } from "../_components/AdminState";
import { demoStaff, isDemoRestaurant } from "@/data/demo-restaurant";

type StaffMember = {
  id: string;
  restaurantId: string;
  restaurantSlug?: string;
  userId: string;
  email: string;
  displayName: string;
  role: Role;
  isActive: boolean;
};

const roles: Role[] = ["OWNER", "MANAGER", "STAFF"];

function staffIdFromEmail(restaurantId: string, email: string) {
  return `${restaurantId}-${email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export default function StaffManagementPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [listenerError, setListenerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    displayName: "",
    email: "",
    role: "MANAGER" as Role,
  });

  useEffect(() => {
    if (!user?.restaurantId) return;

    const staffQuery = query(
      collection(db, "restaurantStaff"),
      where("restaurantSlug", "==", user.restaurantId)
    );

    return onSnapshot(staffQuery, (snapshot) => {
      setStaff(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })) as StaffMember[]);
      setListenerError(null);
    }, (error) => {
      if (process.env.NODE_ENV !== "production" && user.restaurantId && isDemoRestaurant(user.restaurantId)) {
        setStaff(demoStaff);
        setListenerError(null);
        return;
      }
      console.warn("Staff listener error:", error instanceof Error ? error.message : error);
      setListenerError("Could not subscribe to staff records. Check Firestore rules.");
      toast.error("Failed to load staff.");
    });
  }, [user?.restaurantId]);

  const sortedStaff = useMemo(() => {
    return [...staff].sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [staff]);

  const isLocalDemo = process.env.NODE_ENV !== "production" && !!user?.restaurantId && isDemoRestaurant(user.restaurantId);
  const canManageStaff = hasPermission(user, "staff:manage");

  const inviteStaff = async () => {
    const restaurantId = user?.restaurantId;
    if (!restaurantId || !inviteForm.email.trim()) return;
    setSaving(true);
    try {
      const staffId = staffIdFromEmail(restaurantId, inviteForm.email);
      const userId = `staff-${staffId}`;
      const payload = {
        restaurantId,
        restaurantSlug: restaurantId,
        userId,
        email: inviteForm.email.trim().toLowerCase(),
        displayName: inviteForm.displayName.trim() || inviteForm.email.trim(),
        role: inviteForm.role,
        isActive: true,
        invitedBy: user.id,
        inviteStatus: "PENDING",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (isLocalDemo) {
        setStaff((current) => [{ id: staffId, ...payload }, ...current] as StaffMember[]);
        setInviteForm({ displayName: "", email: "", role: "MANAGER" });
        toast.success("Staff invite created locally.");
        return;
      }

      await setDoc(doc(db, "restaurantStaff", staffId), payload, { merge: true });
      await setDoc(doc(db, "users", userId), {
        uid: userId,
        email: payload.email,
        displayName: payload.displayName,
        role: payload.role,
        restaurantId,
        restaurantSlug: restaurantId,
        permissions: permissionsForRole(payload.role),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setInviteForm({ displayName: "", email: "", role: "MANAGER" });
      toast.success("Staff invite record created.");
    } catch (error) {
      console.error("Invite staff error:", error);
      toast.error("Could not create staff invite.");
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (member: StaffMember, role: Role) => {
    try {
      if (isLocalDemo) {
        setStaff((current) => current.map((entry) => entry.id === member.id ? { ...entry, role } : entry));
        toast.success("Role updated locally.");
        return;
      }
      await updateDoc(doc(db, "restaurantStaff", member.id), {
        role,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", member.userId), {
        role,
        permissions: permissionsForRole(role),
        updatedAt: serverTimestamp(),
      }).catch(() => undefined);
      toast.success("Role updated.");
    } catch (error) {
      console.error("Role update error:", error);
      toast.error("Could not update role.");
    }
  };

  const toggleEnabled = async (member: StaffMember) => {
    try {
      if (isLocalDemo) {
        setStaff((current) => current.map((entry) => entry.id === member.id ? { ...entry, isActive: !entry.isActive } : entry));
        toast.success(member.isActive ? "Staff disabled locally." : "Staff enabled locally.");
        return;
      }
      await updateDoc(doc(db, "restaurantStaff", member.id), {
        isActive: !member.isActive,
        updatedAt: serverTimestamp(),
      });
      toast.success(member.isActive ? "Staff disabled." : "Staff enabled.");
    } catch (error) {
      console.error("Staff toggle error:", error);
      toast.error("Could not update staff status.");
    }
  };

  const removeStaff = async (member: StaffMember) => {
    if (!confirm(`Remove ${member.displayName} from this restaurant?`)) return;
    try {
      if (isLocalDemo) {
        setStaff((current) => current.filter((entry) => entry.id !== member.id));
        toast.success("Staff member removed locally.");
        return;
      }
      await deleteDoc(doc(db, "restaurantStaff", member.id));
      toast.success("Staff member removed.");
    } catch (error) {
      console.error("Remove staff error:", error);
      toast.error("Could not remove staff member.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
        <p className="text-muted-foreground">Invite staff, assign roles, and enable or disable access.</p>
      </div>

      {!canManageStaff && (
        <AdminAlert>Your role can view staff records but cannot manage users.</AdminAlert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Invite Staff</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_220px_auto]">
          <Input placeholder="Name" value={inviteForm.displayName} onChange={(event) => setInviteForm({ ...inviteForm, displayName: event.target.value })} />
          <Input placeholder="Email" type="email" value={inviteForm.email} onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })} />
          <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({ ...inviteForm, role: (value || "MANAGER") as Role })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={inviteStaff} disabled={!canManageStaff || saving || !inviteForm.email.trim()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Invite
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5" /> Staff List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {listenerError && <AdminAlert>{listenerError}</AdminAlert>}
          {sortedStaff.map((member) => (
            <div key={member.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_220px_auto_auto] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{member.displayName}</p>
                  <Badge variant={member.isActive ? "secondary" : "outline"}>
                    {member.isActive ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <Select value={member.role} onValueChange={(value) => updateRole(member, (value || member.role) as Role)} disabled={!canManageStaff}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toggleEnabled(member)} disabled={!canManageStaff}>
                {member.isActive ? "Disable" : "Enable"}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => removeStaff(member)} disabled={!canManageStaff}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          {!listenerError && sortedStaff.length === 0 && (
            <AdminEmptyState>No staff yet. Create the first invite above.</AdminEmptyState>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
