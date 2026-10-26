import { Link } from "@tanstack/react-router";
import type { StorefrontCms } from "@/lib/products";

type ContactSettings = Pick<
  StorefrontCms,
  "business_profile_verified" | "biz_email" | "biz_phone" | "biz_hours"
>;

export function PolicySupportEmail({ cms }: { cms: ContactSettings }) {
  const email = cms.business_profile_verified ? cms.biz_email.trim() : "";
  return email ? (
    <a href={`mailto:${email}`}>{email}</a>
  ) : (
    <Link to="/legal/contact">our support team</Link>
  );
}

export function PolicySupport({ cms }: { cms: ContactSettings }) {
  const phone = cms.business_profile_verified ? cms.biz_phone.trim() : "";
  const hours = cms.business_profile_verified ? cms.biz_hours.trim() : "";
  return (
    <>
      <PolicySupportEmail cms={cms} />
      {phone && (
        <>
          {" "}
          · <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a>
        </>
      )}
      {hours && <> ({hours})</>}
    </>
  );
}
