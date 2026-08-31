import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ComplianceChecklist } from "@/components/admin/ComplianceChecklist";
import { supabase } from "@/integrations/supabase/client";
import { getBusinessTracker, saveBusinessTracker } from "@/lib/business-tracker.functions";
import type {
  BusinessTrackerState,
  ComplianceProfile,
  ComplianceTask,
} from "@/lib/business-tracker";

export const Route = createFileRoute("/admin/compliance")({
  head: () => ({
    meta: [
      { title: "LLP Compliance Tracker — Aghanims Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCompliancePage,
});

function AdminCompliancePage() {
  const getTrackerFn = useServerFn(getBusinessTracker);
  const saveTrackerFn = useServerFn(saveBusinessTracker);
  const [state, setState] = useState<BusinessTrackerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error("Your admin session has expired");
        const result = await getTrackerFn({ data: { token } });
        setState(result.state);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to load the compliance tracker",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [getTrackerFn]);

  const completion = useMemo(() => {
    if (!state) return { complete: 0, applicable: 0, percent: 0 };
    const applicable = state.tasks.filter((task) => task.status !== "not_applicable");
    const complete = applicable.filter((task) => task.status === "filed").length;
    return {
      complete,
      applicable: applicable.length,
      percent: applicable.length ? Math.round((complete / applicable.length) * 100) : 0,
    };
  }, [state]);

  const save = async () => {
    if (!state) return;
    setSaving(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Your admin session has expired");
      const result = await saveTrackerFn({ data: { token, state } });
      setState({ ...state, updatedAt: result.updatedAt });
      toast.success("Compliance tracker saved privately.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the compliance tracker");
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (key: keyof ComplianceProfile, value: boolean | string) => {
    setState((current) =>
      current ? { ...current, profile: { ...current.profile, [key]: value } } : current,
    );
  };

  const updateTask = (id: string, patch: Partial<ComplianceTask>) => {
    setState((current) =>
      current
        ? {
            ...current,
            tasks: current.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
          }
        : current,
    );
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        Loading private operations system…
      </div>
    );
  }

  if (!state) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 text-sm text-red-800">
        The private compliance tracker could not be loaded. Storefront CMS, orders and products were
        not changed.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white shopify-border p-6 md:p-8 shadow-sm border-l-4 border-l-amber-500">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">verified_user</span>
                LLP Compliance Tracker
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded">
                ENCRYPTED ADMIN SYSTEM
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Track LLP registrations, statutory filings, tax applicability, due dates, evidence,
              and professional review notes from one private workspace.
            </p>
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2">
              Never save full PAN, TAN, GSTIN, bank numbers, passwords, OTPs or document scans in
              tracker notes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
            <div className="bg-surface-container-low px-4 py-3 min-w-[170px]">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                Compliance
              </p>
              <p className="text-xl font-bold text-primary">{completion.percent}%</p>
              <p className="text-[10px] text-on-surface-variant">
                {completion.complete} of {completion.applicable} applicable items
              </p>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-primary text-on-primary px-6 py-4 font-bold text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {saving ? "Saving compliance…" : "Save compliance"}
            </button>
          </div>
        </div>
      </div>

      <ComplianceChecklist state={state} updateProfile={updateProfile} updateTask={updateTask} />
    </div>
  );
}
