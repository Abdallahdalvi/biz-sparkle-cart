export const GOOGLE_PLACE_ID = "ChIJ3S8t3HK35zsR_8lCOgQrMqo";

const GOOGLE_BUSINESS_NAME = "Aghanims Phones and Gadgets";

export const GOOGLE_MAPS_PLACE_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  GOOGLE_BUSINESS_NAME,
)}&query_place_id=${encodeURIComponent(GOOGLE_PLACE_ID)}`;

export const GOOGLE_WRITE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(
  GOOGLE_PLACE_ID,
)}`;

export const GOOGLE_ALL_REVIEWS_URL = `https://search.google.com/local/reviews?placeid=${encodeURIComponent(
  GOOGLE_PLACE_ID,
)}`;
