const conditionCopy =
  /\b(?:open[ -]?box|like[ -]?new|new[ -]?condition|cosmetic condition|condition confirmed|condition will|qc tested|quality[ -]?checked condition)\b/i;

function cleanText(value) {
  if (typeof value !== "string") return value;
  return (value.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
    .filter((sentence) => !conditionCopy.test(sentence))
    .join(" ")
    .replace(/\s*•\s*(?:open[ -]?box|like[ -]?new|qc tested)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizeProductRow(product) {
  const metadata = { ...(product.metadata || {}) };
  delete metadata.badge;

  if (Array.isArray(metadata.specs)) {
    metadata.specs = metadata.specs
      .filter((spec) => !/^condition$/i.test(String(spec?.label || "").trim()))
      .map((spec) => ({ ...spec, value: cleanText(spec?.value) }))
      .filter((spec) => String(spec.value || "").trim());
  }
  if (Array.isArray(metadata.faqs)) {
    metadata.faqs = metadata.faqs
      .filter((faq) => !conditionCopy.test(String(faq?.question || "")))
      .map((faq) => ({
        ...faq,
        question: cleanText(faq?.question),
        answer: cleanText(faq?.answer),
      }))
      .filter((faq) => faq.question && faq.answer);
  }

  return {
    ...product,
    tagline: cleanText(product.tagline),
    description: cleanText(product.description),
    metadata,
  };
}
