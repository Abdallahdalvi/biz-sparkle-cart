import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { absoluteSiteUrl, SITE_NAME } from "@/lib/site";

const title = "SIM Compatibility for Keypad and Vintage Phones in India";
const description =
  "Check whether your keypad or vintage phone works with Jio, Airtel, Vi, or BSNL. Learn how to verify 2G coverage, 4G VoLTE, bands, and SIM locks.";

export const Route = createFileRoute("/sim-compatibility")({
  head: () => ({
    meta: [
      { title: `${title} | ${SITE_NAME}` },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: absoluteSiteUrl("/sim-compatibility") },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: absoluteSiteUrl("/sim-compatibility") }],
  }),
  component: SimCompatibility,
});

function SimCompatibility() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl space-y-8 px-margin-mobile py-12 leading-relaxed md:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-5xl">{title}</h1>
        <p className="text-on-surface-variant">
          A 2G-only keypad phone cannot make calls on Jio. An unlocked 2G GSM handset may work for
          calls and texts with Airtel, Vi (Vodafone Idea), or BSNL where that operator provides
          compatible 2G coverage. Check coverage at the address where you plan to use the phone.
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary">What to check before buying</h2>
          <ol className="list-decimal space-y-2 pl-6">
            <li>
              Find the full model number and regional variant. Phones with the same name can have
              separate 2G and 4G editions.
            </li>
            <li>
              Ask your operator which voice networks and bands are available at your PIN code. For
              Airtel, choose 2G in its coverage map when checking a legacy phone.
            </li>
            <li>
              Check whether the handset is carrier-locked and which SIM size it takes. For Jio voice
              calls, confirm that the exact variant supports compatible LTE bands and VoLTE.
            </li>
            <li>
              Tell our support team your operator, PIN code, and whether you need calls, texts, or
              mobile data. Ask for the exact handset variant before ordering.
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary">
            Does a 4G label mean Jio calls will work?
          </h2>
          <p>
            A 4G label identifies mobile data capability. Voice calling on Jio also depends on VoLTE
            support for the exact handset and carrier. For example, Apple lists VoLTE from iPhone 6
            onward, while some earlier iPhones support LTE data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary">Which SIMs work in the JioPhone 2?</h2>
          <p>
            JioPhone 2 requires an active Jio SIM in slot 1. Slot 2 supports another operator’s SIM
            for 2G service where the operator has coverage.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary">Carrier and manufacturer references</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <a className="underline" href="https://www.airtel.in/wirelesscoverage/">
                Airtel wireless coverage map
              </a>
            </li>
            <li>
              <a
                className="underline"
                href="https://www.jio.com/help/faq/mobile/services/hd-voice/what-is-the-indication-for-jio-hd-voice-or-volte-on-smartphones-/"
              >
                Jio guidance on VoLTE and HD voice
              </a>
            </li>
            <li>
              <a
                className="underline"
                href="https://www.jio.com/help/faq/devices/jiophone/jiophone2/will-the-jiophone2-work-with-a-non-jio-sim/"
              >
                JioPhone 2 SIM-slot guidance
              </a>
            </li>
            <li>
              <a className="underline" href="https://support.apple.com/en-in/118609">
                Apple carrier support for India
              </a>
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-5 border-t border-outline-variant/40 pt-5 font-bold">
          <Link className="text-primary underline" to="/products" search={{ type: "t9" }}>
            Browse keypad phones
          </Link>
          <Link className="text-primary underline" to="/legal/contact">
            Ask about SIM compatibility
          </Link>
        </div>
      </article>
    </SiteShell>
  );
}
