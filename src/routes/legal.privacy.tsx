import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, BIZ } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Aghanims Phones and Gadgets" },
      {
        name: "description",
        content: "How Aghanims Phones and Gadgets collects, uses, and protects your personal data.",
      },
    ],
  }),
  component: () => (
    <LegalPage title="Privacy Policy" updated="August 2026">
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
          <strong>Payment:</strong> when online payment is enabled, we receive transaction status
          and a provider reference — never card details.
        </li>
        <li>
          <strong>Usage:</strong> with your optional-cookie choices, pages and products viewed, cart
          and checkout actions, purchases, approximate device/browser details, IP-derived region,
          cookies, and similar identifiers.
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
      <h2>3. Analytics and advertising partners</h2>
      <p>
        When enabled by us and permitted by your choices, we use Microsoft Clarity for session
        analytics and heatmaps, Google Analytics for traffic and ecommerce measurement, Google Ads
        for conversion measurement, and Meta Pixel plus the Meta Conversions API for Facebook and
        Instagram advertising measurement. These providers may process online identifiers,
        device/browser data, pages and products viewed, cart or checkout actions, and purchase
        value/order reference. When you allow advertising measurement, email, phone, and an internal
        identifier are normalized and one-way hashed before server-side purchase transmission. We do
        not send card details or your shipping address through these trackers.
      </p>
      <h2>4. Sharing</h2>
      <p>
        We share data only with processors needed to operate the store and deliver your order,
        including the selected payment provider (when used), Shiprocket and the assigned courier,
        communications and infrastructure providers, and lawful authorities when required. We do not
        sell your data.
      </p>
      <h2>5. Cookies and consent choices</h2>
      <p>
        Essential browser storage keeps your cart isolated to the current account or guest,
        maintains sign-in, remembers security state, and stores your privacy choice. Optional
        analytics and advertising tools are controlled through our consent banner. Google Consent
        Mode defaults analytics and advertising storage to denied; when Google tracking is enabled,
        Google may receive limited consent-state or cookieless measurement signals before consent.
        Microsoft Clarity and Meta Pixel load only after you allow the relevant category. You can
        reject optional tracking or change your choice at any time using “Cookie Settings” in the
        footer.
      </p>
      <h2>6. Retention</h2>
      <p>
        We retain order data for the period required under Indian tax and consumer-protection law
        (currently 8 years for invoices). Account data is retained until you request deletion.
      </p>
      <h2>7. Your rights</h2>
      <p>
        You may request access, correction, or deletion of personal data through our{" "}
        <a href="/legal/contact">contact page</a>. Some order data may need to be retained where
        required by law.
      </p>
      <h2>8. Security</h2>
      <p>
        Data is encrypted in transit (TLS) and at rest. We follow reasonable security practices
        required under the IT Rules, 2011.
      </p>
      <h2>9. Grievance Officer</h2>
      <p>
        Verified grievance contact details will be published after the business profile is
        completed. Until then, submit a request through the{" "}
        <a href="/legal/contact">contact page</a>.
      </p>
    </LegalPage>
  ),
});
