import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, BIZ } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TECHLAB" },
      {
        name: "description",
        content: "How TECHLAB collects, uses, and protects your personal data.",
      },
    ],
  }),
  component: () => (
    <LegalPage title="Privacy Policy" updated="June 2026">
      <p className="text-lg font-medium text-on-surface leading-relaxed border-b border-outline-variant/30 pb-6 mb-8">
        {BIZ.legalPrivacyText}
      </p>
      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account:</strong> name, email, phone, hashed password.
        </li>
        <li>
          <strong>Order:</strong> shipping address, items, order history.
        </li>
        <li>
          <strong>Payment:</strong> processed by Razorpay; we receive only transaction status and
          reference — never card details.
        </li>
        <li>
          <strong>Usage:</strong> pages visited, device, IP, cookies.
        </li>
      </ul>
      <h2>2. How we use it</h2>
      <ul>
        <li>Process and ship orders (Shiprocket couriers).</li>
        <li>Customer support.</li>
        <li>Transactional emails about your orders.</li>
        <li>With consent, marketing about new drops.</li>
        <li>Fraud detection and Site security.</li>
      </ul>
      <h2>3. Sharing</h2>
      <p>
        We share data only with processors needed to deliver your order: Razorpay (payments),
        Shiprocket and the assigned courier (delivery), our email provider, our cloud infrastructure
        provider, and lawful authorities when required. We do not sell your data.
      </p>
      <h2>4. Cookies</h2>
      <p>
        We use first-party cookies and localStorage to keep your cart, remember sign-in, and measure
        aggregate usage. You can clear them via your browser at any time.
      </p>
      <h2>5. Retention</h2>
      <p>
        We retain order data for the period required under Indian tax and consumer-protection law
        (currently 8 years for invoices). Account data is retained until you request deletion.
      </p>
      <h2>6. Your rights</h2>
      <p>
        Under the DPDP Act you have the right to access, correct, and erase your personal data,
        withdraw consent, and nominate. Email <a href={`mailto:${BIZ.email}`}>{BIZ.email}</a> with
        the subject "DPDP Request".
      </p>
      <h2>7. Security</h2>
      <p>
        Data is encrypted in transit (TLS) and at rest. We follow reasonable security practices
        required under the IT Rules, 2011.
      </p>
      <h2>8. Grievance Officer</h2>
      <p>
        Name: {BIZ.grievanceOfficer}
        <br />
        Email: <a href={`mailto:${BIZ.email}`}>{BIZ.email}</a>
        <br />
        Phone: {BIZ.phone}
        <br />
        Address: {BIZ.address}
      </p>
    </LegalPage>
  ),
});
