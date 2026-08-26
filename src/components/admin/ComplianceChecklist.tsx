import {
  STATUS_LABELS,
  type BusinessTrackerState,
  type ComplianceProfile,
  type ComplianceStatus,
  type ComplianceTask,
} from "@/lib/business-tracker";

const profileLabels: Array<[keyof ComplianceProfile, string, string]> = [
  ["llpIncorporated", "LLP incorporated", "Certificate and LLPIN received"],
  [
    "llpAgreementFiled",
    "LLP Agreement / Form 3",
    "Signed agreement and filing acknowledgement retained",
  ],
  ["panObtained", "PAN obtained", "Mark status only — do not enter the full PAN here"],
  ["tanObtained", "TAN obtained", "Only when TDS obligations make TAN necessary"],
  ["gstRegistered", "GST registered", "Controls whether GST filing tasks are applicable"],
  ["bankAccountOpened", "LLP bank account", "Dedicated business account opened"],
  ["professionalTaxReviewed", "Professional Tax reviewed", "Maharashtra applicability checked"],
  ["shopsActReviewed", "Shops Act reviewed", "Premises/workforce applicability checked"],
];

const categoryOrder: ComplianceTask["category"][] = [
  "Formation",
  "MCA",
  "Income tax",
  "GST & TDS",
  "State & workforce",
  "Books",
];

export function ComplianceChecklist({
  state,
  updateProfile,
  updateTask,
}: {
  state: BusinessTrackerState;
  updateProfile: (key: keyof ComplianceProfile, value: boolean | string) => void;
  updateTask: (id: string, patch: Partial<ComplianceTask>) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="bg-white shopify-border p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-primary">LLP setup snapshot</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Status flags only; no tax identifier values are collected.
            </p>
          </div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            Financial year
            <input
              value={state.profile.fiscalYear}
              onChange={(event) => updateProfile("fiscalYear", event.target.value)}
              className="block mt-1 w-36 bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm text-primary"
              placeholder="2026-27"
            />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {profileLabels.map(([key, label, help]) => (
            <label
              key={key}
              className="flex gap-3 items-start bg-surface-container-lowest border border-outline-variant/40 p-4 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={Boolean(state.profile[key])}
                onChange={(event) => updateProfile(key, event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>
                <span className="block text-xs font-bold text-primary">{label}</span>
                <span className="block text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                  {help}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {categoryOrder.map((category) => {
        const tasks = state.tasks.filter((task) => task.category === category);
        if (!tasks.length) return null;
        return (
          <section key={category} className="bg-white shopify-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/40 flex items-center justify-between">
              <h3 className="font-bold text-primary">{category}</h3>
              <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                {tasks.length} items
              </span>
            </div>
            <div className="divide-y divide-outline-variant/30">
              {tasks.map((task) => (
                <article key={task.id} className="p-5 md:p-6 space-y-4">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-primary text-sm">{task.title}</h4>
                        <span
                          className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded ${task.applicability === "core" ? "bg-red-100 text-red-800" : task.applicability === "conditional" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}
                        >
                          {task.applicability}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                        {task.details}
                      </p>
                      <p className="text-[11px] text-primary mt-2 font-medium">
                        Cadence: {task.cadence}
                      </p>
                      {task.sourceUrl && (
                        <a
                          href={task.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex mt-2 text-[11px] text-blue-700 underline font-bold"
                        >
                          {task.sourceLabel} ↗
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:min-w-[390px]">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                        Status
                        <select
                          value={task.status}
                          onChange={(event) =>
                            updateTask(task.id, { status: event.target.value as ComplianceStatus })
                          }
                          className="block mt-1 w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-xs text-primary"
                        >
                          {(Object.keys(STATUS_LABELS) as ComplianceStatus[]).map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                        Your due date
                        <input
                          type="date"
                          value={task.dueDate}
                          onChange={(event) => updateTask(task.id, { dueDate: event.target.value })}
                          className="block mt-1 w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-xs text-primary"
                        />
                      </label>
                    </div>
                  </div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                    Private working note — no full identifiers or credentials
                    <textarea
                      rows={2}
                      value={task.notes}
                      maxLength={1000}
                      onChange={(event) => updateTask(task.id, { notes: event.target.value })}
                      className="block mt-1 w-full bg-surface-container-low border border-outline-variant/40 p-3 text-xs normal-case tracking-normal font-normal text-primary"
                      placeholder="e.g. Asked CA to confirm applicability; acknowledgement stored in private Drive folder."
                    />
                  </label>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
