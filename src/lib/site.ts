export const SITE_URL = "https://aghanimsphones.in";
export const SITE_NAME = "Aghanims Phones and Gadgets";
export const SITE_DESCRIPTION =
  "Discover hard-to-find phones and gadgets with secure checkout and tracked delivery across India.";
export const SITE_LOGO_URL = `${SITE_URL}/logo.png`;
export const SITE_SOCIAL_IMAGE_URL = `${SITE_URL}/og.png`;
export const META_CATALOG_URL = `${SITE_URL}/meta-catalog.xml`;

export function absoluteSiteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}
