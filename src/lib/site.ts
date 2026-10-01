export const SITE_URL = "https://aghanimsphones.in";
export const SITE_NAME = "Aghanims Phones and Gadgets";
export const SITE_DESCRIPTION =
  "Shop QWERTY, keypad and flip phones online in India. Explore Qin Android phones, Nokia flips, BlackBerry keyboards and rugged CAT devices with secure checkout and tracked delivery.";
export const SITE_LOGO_URL = `${SITE_URL}/logo.png`;
export const SITE_SOCIAL_IMAGE_URL = `${SITE_URL}/og.png`;
export const META_CATALOG_URL = `${SITE_URL}/meta-catalog.xml`;

export function absoluteSiteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}
