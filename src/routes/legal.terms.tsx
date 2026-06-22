import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, BIZ } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — TECHLAB" },
      { name: "description", content: "Terms & Conditions governing the use of TECHLAB and purchases made on our store." },
    ],
  }),
  component: () => (
    <LegalPage title="Terms & Conditions" updated="June 2026">
      <p>These Terms & Conditions ("Terms") govern your access to and use of the TECHLAB website (the "Site") operated by {BIZ.legalName} ("we", "us", "our"), and any purchase of products listed on the Site. By using the Site you agree to these Terms.</p>
      <h2>1. Eligibility</h2>
      <p>You must be at least 18 years old and capable of forming a binding contract under the Indian Contract Act, 1872 to place an order.</p>
      <h2>2. Products & Pricing</h2>
      <p>All prices are in Indian Rupees (INR) and are inclusive of applicable GST unless stated otherwise. We reserve the right to revise prices, withdraw or modify product listings at any time without prior notice. Products may occasionally be mispriced; in such cases we may cancel the order and issue a full refund.</p>
      <h2>3. Orders & Acceptance</h2>
      <p>Your order is an offer to purchase. We accept the offer when we dispatch the product and email an order confirmation with tracking. We reserve the right to refuse any order at our discretion.</p>
      <h2>4. Payments</h2>
      <p>Payments are processed through Razorpay. We do not store your card or banking credentials. By placing an order you also agree to Razorpay's terms.</p>
      <h2>5. Shipping, Returns, Refunds, Cancellation</h2>
      <p>Please refer to our separate <a href="/legal/shipping">Shipping Policy</a>, <a href="/legal/returns">Return & Refund Policy</a>, and <a href="/legal/cancellation">Cancellation Policy</a>, each of which forms part of these Terms.</p>
      <h2>6. Intellectual Property</h2>
      <p>All content on the Site — TECHLAB name, logos, product images, copy, code, and trade dress — is owned by {BIZ.legalName} or its licensors and is protected under Indian and international IP law.</p>
      <h2>7. User Conduct</h2>
      <p>You agree not to use the Site for any unlawful purpose, attempt unauthorised access, scrape data, or interfere with the Site's operation.</p>
      <h2>8. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, our aggregate liability for any claim shall not exceed the amount you paid for the specific order giving rise to the claim. We are not liable for indirect, incidental, or consequential damages.</p>
      <h2>9. Governing Law & Jurisdiction</h2>
      <p>These Terms are governed by the laws of India. Any dispute shall be subject to the exclusive jurisdiction of the competent courts of {BIZ.state}.</p>
      <h2>10. Changes</h2>
      <p>We may update these Terms from time to time. Continued use of the Site after changes constitutes acceptance.</p>
      <h2>11. Contact</h2>
      <p>Questions? Reach us at <a href={`mailto:${BIZ.email}`}>{BIZ.email}</a> or {BIZ.phone}.</p>
    </LegalPage>
  ),
});