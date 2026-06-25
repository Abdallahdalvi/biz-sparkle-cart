export const formatINR = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);

export const rupees = (rupees: number) => rupees * 100; // helper for seed data
