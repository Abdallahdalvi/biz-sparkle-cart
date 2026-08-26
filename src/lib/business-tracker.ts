export type ComplianceStatus =
  | "not_started"
  | "in_progress"
  | "ready_to_file"
  | "filed"
  | "not_applicable";

export type ComplianceApplicability = "core" | "conditional" | "operational";

export interface ComplianceTask {
  id: string;
  title: string;
  category: "Formation" | "MCA" | "Income tax" | "GST & TDS" | "State & workforce" | "Books";
  applicability: ComplianceApplicability;
  cadence: string;
  dueDate: string;
  status: ComplianceStatus;
  details: string;
  notes: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface ComplianceProfile {
  fiscalYear: string;
  llpIncorporated: boolean;
  llpAgreementFiled: boolean;
  panObtained: boolean;
  tanObtained: boolean;
  gstRegistered: boolean;
  bankAccountOpened: boolean;
  professionalTaxReviewed: boolean;
  shopsActReviewed: boolean;
}

export interface BusinessTrackerState {
  version: 1;
  profile: ComplianceProfile;
  tasks: ComplianceTask[];
  books: BusinessBooks;
  updatedAt: string | null;
}

export interface BusinessPhone {
  id: string;
  sku: string;
  model: string;
  color: string;
  grade: string;
  supplier: string;
  buyCost: number;
  buyCharges: number;
  customer: string;
  sellPrice: number | null;
  sellCharges: number | null;
  status: "In Stock" | "Reserved" | "Sold" | "Returned" | "Unassigned";
  marketplace: string;
  paymentStatus: "" | "Pending" | "Paid" | "Refunded";
  purchaseDate: string;
  soldDate: string;
}

export interface BusinessExpense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

export interface BusinessSpendEntry {
  id: string;
  description: string;
  amount: number;
}

export interface BusinessSupplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface BusinessCustomer {
  id: string;
  name: string;
  phone: string;
  city: string;
  pendingAmount: number;
  notes: string;
}

export interface BusinessBooks {
  sourceName: string;
  importedAt: string;
  phones: BusinessPhone[];
  expenses: BusinessExpense[];
  businessSpend: BusinessSpendEntry[];
  suppliers: BusinessSupplier[];
  customers: BusinessCustomer[];
}

export interface WorkbookPhone {
  sku: string;
  model: string;
  color: string;
  supplier: string;
  buyCost: number;
  buyCharges: number;
  totalBuyCost: number;
  sellPrice: number | null;
  sellCharges: number | null;
  netSale: number | null;
  profit: number | null;
  status: string;
}

export interface WorkbookExpense {
  date: string;
  category: string;
  description: string;
  amount: number;
}

export interface WorkbookSpend {
  description: string;
  amount: number;
}

export interface WorkbookSnapshot {
  sourceName: string;
  importedAt: string;
  warning: string;
  dashboard: {
    totalInvestment: number;
    cogs: number;
    revenue: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
    inventoryValue: number;
    inStock: number;
    sold: number;
    returns: number;
    returnCost: number;
    pendingPayments: number;
    businessSpend: number;
  };
  phones: WorkbookPhone[];
  expenses: WorkbookExpense[];
  businessSpend: WorkbookSpend[];
}

export const STATUS_LABELS: Record<ComplianceStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  ready_to_file: "Ready to file",
  filed: "Filed / complete",
  not_applicable: "Not applicable",
};

export const DEFAULT_COMPLIANCE_TASKS: ComplianceTask[] = [
  {
    id: "incorporation-records",
    title: "Incorporation certificate, LLPIN and partner records",
    category: "Formation",
    applicability: "core",
    cadence: "One-time; update when partners or registered office change",
    dueDate: "",
    status: "not_started",
    details:
      "Keep the certificate, LLPIN, registered-office proof, designated-partner details and DSC access together.",
    notes: "",
    sourceLabel: "MCA LLP forms",
    sourceUrl: "https://www.mca.gov.in/content/mca/global/en/mca/e-filing/llp-forms.html",
  },
  {
    id: "llp-form-3",
    title: "LLP Agreement and Form 3",
    category: "Formation",
    applicability: "core",
    cadence: "Initial filing; re-file for agreement changes within the applicable window",
    dueDate: "",
    status: "not_started",
    details:
      "Track the signed LLP Agreement, contribution and profit-sharing terms. MCA's Form 3 kit requires separate handling for changes outside 30 days.",
    notes: "",
    sourceLabel: "MCA Form 3 instruction kit",
    sourceUrl:
      "https://www.mca.gov.in/content/dam/mca-aem-forms/instructionkits/Instruction%20Kit_LLP_Form_No_3.pdf",
  },
  {
    id: "pan-bank",
    title: "PAN and LLP bank account",
    category: "Formation",
    applicability: "core",
    cadence: "One-time; keep KYC current",
    dueDate: "",
    status: "not_started",
    details:
      "Mark these as obtained here; do not type the full PAN, bank number, passwords or OTPs into tracker notes.",
    notes: "",
    sourceLabel: "Income Tax e-Filing",
    sourceUrl: "https://www.incometax.gov.in/iec/foportal/",
  },
  {
    id: "mca-form-11",
    title: "LLP Form 11 — Annual Return",
    category: "MCA",
    applicability: "core",
    cadence: "Annual — within 60 days of financial-year end (commonly 30 May)",
    dueDate: "",
    status: "not_started",
    details:
      "Set the actual due date for the LLP's applicable financial year and retain the filed form, challan and SRN.",
    notes: "",
    sourceLabel: "MCA Form 11 instruction kit",
    sourceUrl:
      "https://www.mca.gov.in/content/dam/mca-aem-forms/instructionkits/Instruction_Kit_LLP_Form_No_11.pdf",
  },
  {
    id: "mca-form-8",
    title: "LLP Form 8 — Statement of Account & Solvency",
    category: "MCA",
    applicability: "core",
    cadence: "Annual — within 30 days after the first six months of FY (commonly 30 October)",
    dueDate: "",
    status: "not_started",
    details:
      "Prepare accounts and solvency information, then retain the filed form, challan and SRN.",
    notes: "",
    sourceLabel: "MCA Form 8 instruction kit",
    sourceUrl:
      "https://www.mca.gov.in/content/dam/mca-aem-forms/instructionkits/Instruction%20Kit_LLP%20Form%20No.%208.pdf",
  },
  {
    id: "dir-3-kyc",
    title: "Designated-partner DIN / DIR-3 KYC review",
    category: "MCA",
    applicability: "conditional",
    cadence: "Annual if applicable to a designated partner holding DIN",
    dueDate: "",
    status: "not_started",
    details:
      "Confirm each designated partner's DIN status and the current KYC requirement on MCA before filing.",
    notes: "",
    sourceLabel: "MCA DIN-related forms",
    sourceUrl:
      "https://mca.gov.in/content/mca/global/en/mca/e-filing/din-related-forms/form-dir3.html",
  },
  {
    id: "itr-5",
    title: "LLP income-tax return — ITR-5",
    category: "Income tax",
    applicability: "core",
    cadence: "Annual — notified deadline depends on audit and transfer-pricing status",
    dueDate: "",
    status: "not_started",
    details:
      "Reconcile books, AIS/26AS, tax payments and prior-year balances. Confirm the notified due date for the relevant assessment year.",
    notes: "",
    sourceLabel: "Income Tax — Partnership Firm / LLP",
    sourceUrl: "https://www.incometax.gov.in/iec/foportal/help/partnership-firm-llp",
  },
  {
    id: "tax-audit",
    title: "Income-tax audit applicability review",
    category: "Income tax",
    applicability: "conditional",
    cadence: "Review each financial year before ITR filing",
    dueDate: "",
    status: "not_started",
    details:
      "Have a CA confirm section 44AB applicability, thresholds and the correct audit form for the relevant year.",
    notes: "",
    sourceLabel: "Income Tax forms guidance",
    sourceUrl:
      "https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/income-tax-forms",
  },
  {
    id: "advance-tax",
    title: "Advance tax and self-assessment tax review",
    category: "Income tax",
    applicability: "conditional",
    cadence: "Quarterly / before return filing when tax is payable",
    dueDate: "",
    status: "not_started",
    details:
      "Estimate taxable profit with a CA and track challans. Applicability depends on the LLP's tax position.",
    notes: "",
    sourceLabel: "Income Tax e-Pay Tax",
    sourceUrl: "https://www.incometax.gov.in/iec/foportal/help/e-pay-tax-faqs",
  },
  {
    id: "gst-returns",
    title: "GST registration and GSTR-1 / GSTR-3B",
    category: "GST & TDS",
    applicability: "conditional",
    cadence: "Monthly or QRMP only if GST-registered; annual return if applicable",
    dueDate: "",
    status: "not_started",
    details:
      "If registered, track the portal-assigned filing frequency, sales invoices, input credit and payment. Mark not applicable if registration is not required.",
    notes: "",
    sourceLabel: "GST Portal returns guidance",
    sourceUrl: "https://tutorial.gst.gov.in/userguide/returns/index.htm",
  },
  {
    id: "tds-tan",
    title: "TAN, TDS deposits, returns and certificates",
    category: "GST & TDS",
    applicability: "conditional",
    cadence: "Periodic only when the LLP must deduct TDS",
    dueDate: "",
    status: "not_started",
    details:
      "Confirm deduction sections, deposit dates, quarterly statements and certificates with your CA. PAN and TAN are different identifiers.",
    notes: "",
    sourceLabel: "Income Tax TDS guidance",
    sourceUrl: "https://www.incometax.gov.in/iec/foportal/help/tds-on-salaries",
  },
  {
    id: "state-registrations",
    title: "Maharashtra Shops Act / Professional Tax review",
    category: "State & workforce",
    applicability: "conditional",
    cadence: "Review at setup and when premises, workforce or payroll changes",
    dueDate: "",
    status: "not_started",
    details:
      "State and local registrations depend on premises, activity and employees. Confirm applicability before entering any registration details.",
    notes: "",
    sourceLabel: "Maharashtra Labour Department",
    sourceUrl: "https://mahakamgar.maharashtra.gov.in/",
  },
  {
    id: "pf-esi",
    title: "EPF / ESIC and payroll compliance review",
    category: "State & workforce",
    applicability: "conditional",
    cadence: "Review when hiring; recurring if registered",
    dueDate: "",
    status: "not_started",
    details:
      "Applicability depends on workforce and other facts. Track offer letters, payroll, deductions and registrations outside the public storefront CMS.",
    notes: "",
    sourceLabel: "EPFO",
    sourceUrl: "https://www.epfindia.gov.in/",
  },
  {
    id: "monthly-books",
    title: "Books, inventory and bank reconciliation",
    category: "Books",
    applicability: "operational",
    cadence: "Monthly",
    dueDate: "",
    status: "not_started",
    details:
      "Reconcile purchases, sales, returns, expenses, inventory, Shiprocket COD remittances, bank entries and payment-gateway settlements.",
    notes: "",
    sourceLabel: "Internal operating control",
    sourceUrl: "",
  },
  {
    id: "document-vault",
    title: "Evidence vault and filing acknowledgements",
    category: "Books",
    applicability: "operational",
    cadence: "After every filing or payment",
    dueDate: "",
    status: "not_started",
    details:
      "Keep returns, challans, SRNs, invoices and reconciliations in private storage. This tracker records status only; it is not a document vault.",
    notes: "",
    sourceLabel: "Internal operating control",
    sourceUrl: "",
  },
];

export const DEFAULT_BUSINESS_TRACKER_STATE: BusinessTrackerState = {
  version: 1,
  profile: {
    fiscalYear: "2026-27",
    llpIncorporated: false,
    llpAgreementFiled: false,
    panObtained: false,
    tanObtained: false,
    gstRegistered: false,
    bankAccountOpened: false,
    professionalTaxReviewed: false,
    shopsActReviewed: false,
  },
  tasks: DEFAULT_COMPLIANCE_TASKS,
  books: {
    sourceName: "",
    importedAt: "",
    phones: [],
    expenses: [],
    businessSpend: [],
    suppliers: [],
    customers: [],
  },
  updatedAt: null,
};
