export const OFFICIAL_SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/aghanims.phones.gadgets/",
  facebook: "https://www.facebook.com/aghanims.phones.gadgets/",
  youtube: "https://www.youtube.com/channel/UCNINDMegHpb0oB8rlzU8yhQ",
  whatsappChannel: "https://whatsapp.com/channel/0029VbEHWIj6rsQlM3U2mc2U",
} as const;

export const OFFICIAL_WHATSAPP_PHONE = "919372168726";

export function whatsappChatUrl(message = "Hi Aghanims Support, I have a product inquiry.") {
  return `https://wa.me/${OFFICIAL_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
