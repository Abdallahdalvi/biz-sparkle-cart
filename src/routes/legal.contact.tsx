import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, BIZ } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/legal/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — TECHLAB" },
      { name: "description", content: "Get in touch with TECHLAB support, grievance officer, and registered address." },
    ],
  }),
  component: () => (
    <LegalPage title="Contact Us">
      <p>We're a small team and we read every message. Reach us through any channel below.</p>
      <h2>Customer Support</h2>
      <p>
        Email: <a href={`mailto:${BIZ.email}`}>{BIZ.email}</a><br/>
        Phone: {BIZ.phone}<br/>
        Hours: {BIZ.hours}
      </p>
      <h2>Registered Office</h2>
      <p>{BIZ.legalName}<br/>{BIZ.address}<br/>GSTIN: {BIZ.gstin}</p>
      <h2>Grievance Officer</h2>
      <p>As required under Rule 5(9) of the IT Rules, 2011 and the Consumer Protection (E-Commerce) Rules, 2020:</p>
      <p>Name: [Grievance Officer Name]<br/>Email: <a href={`mailto:${BIZ.email}`}>{BIZ.email}</a><br/>Phone: {BIZ.phone}</p>
      <p>We acknowledge complaints within 48 hours and resolve them within 30 days.</p>
    </LegalPage>
  ),
});