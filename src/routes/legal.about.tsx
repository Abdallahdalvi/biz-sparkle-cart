import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/legal/about")({
  head: () => ({
    meta: [
      { title: "About TECHLAB" },
      { name: "description", content: "TECHLAB is a boutique technology store curating niche, tactile, minimalist hardware." },
      { property: "og:title", content: "About TECHLAB" },
      { property: "og:description", content: "A boutique technology store curating niche, tactile hardware." },
    ],
  }),
  component: () => (
    <LegalPage title="About TECHLAB">
      <p>TECHLAB is a boutique technology store, founded for people who refuse the glass-slab status quo. We curate keypad Androids, transparent audio gear, e-ink phones, repairable hardware, and minimalist daily drivers — all tested in-house for tactile precision and long-term durability.</p>
      <h2>Our promise</h2>
      <ul>
        <li>Hand-picked, in-house tested hardware — no drop-ship junk.</li>
        <li>Fast, free shipping across India via Shiprocket couriers.</li>
        <li>Razorpay-secured payments, instant refunds where possible.</li>
        <li>Real humans on email and phone, 6 days a week.</li>
      </ul>
      <h2>Why we started</h2>
      <p>Mainstream phones got faster, bigger, and more boring. We wanted a place that takes the niche stuff seriously — BlackBerry-style keypads, e-ink readers, modular hardware, retro handhelds. That's TECHLAB.</p>
    </LegalPage>
  ),
});