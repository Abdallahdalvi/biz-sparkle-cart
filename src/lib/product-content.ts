type Faq = { question: string; answer: string };

type FaqProduct = {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  formFactor?: string;
  specs: { label: string; value: string }[];
  faqs?: Faq[];
  stock: number;
};

const networkQuestion =
  /\b(?:jio|vo[l ]?te|carrier|4g|5g)\b|\b(?:sim|network)\b.*\b(?:work|support|use|compatib|operator)\w*|\b(?:work|support|use|compatib)\w*.*\b(?:sim|network)\b/i;
const dualSimQuestion = /\bdual[ -]sim\b/i;
const explicitNoJio =
  /\bjio\s+(?:(?:sim|network)\s+)?(?:(?:is|will)\s+)?(?:not|won['’]t|doesn['’]t)\b|\b(?:no|except|without)\s+jio\b/i;
const legacyOperators =
  "Airtel, Vi (Vodafone Idea), or BSNL can work for calls and texts where your operator still offers compatible 2G coverage. Check your PIN code and the phone’s SIM lock before ordering.";
const checkLte =
  "For Jio calls, the exact variant needs compatible 4G bands and VoLTE. For Jio, Airtel, Vi, or BSNL, check the handset variant and coverage at your PIN code before ordering.";

function networkAnswer(product: FaqProduct) {
  const identity = `${product.slug} ${product.name} ${product.formFactor || ""}`;
  if (/\blandline\b/i.test(identity)) {
    return {
      question: "Does this landline phone take a mobile SIM?",
      answer:
        "This listing is for a landline phone. Confirm the line type and connector with support before ordering if you plan to use it with a fibre router or a telephone adapter.",
    };
  }
  if (product.slug.toLowerCase() === "jio-phone-2-qwerty") {
    return {
      question: "Which SIMs work in the JioPhone 2?",
      answer: `Slot 1 requires an active Jio SIM. Slot 2 accepts another operator’s SIM for 2G service. ${legacyOperators}`,
    };
  }

  const specs = product.specs.filter(({ label }) =>
    /^(?:cellular(?: network)?|network(?: technology| type| bands)?|sim compatibility|connectivity)$/i.test(
      label.trim(),
    ),
  );
  const specText = specs.map(({ value }) => value).join(" ");
  const faqText = (product.faqs || [])
    .filter(({ question }) => networkQuestion.test(question))
    .map(({ answer }) => answer)
    .join(" ");
  const text = `${specText} ${product.description} ${product.tagline} ${faqText}`;
  const question = `Does ${product.name} work with Jio, Airtel, Vi, or BSNL?`;

  if (/^(?:apple-iphone-5[cs]?-|vintage-(?:apple-iphone-5|iphone-4s)-)/i.test(product.slug)) {
    return {
      question,
      answer: `Jio voice calling is unsupported. Apple lists VoLTE on iPhone 6 and later. ${legacyOperators}`,
    };
  }
  if (explicitNoJio.test(text)) {
    const lte = /\b(?:4g|lte|volte)\b/i.test(specText + " " + identity);
    return {
      question,
      answer: lte
        ? "This listing indicates Jio is unsupported for this variant. Check the exact bands and voice support for Airtel, Vi, or BSNL with our team before ordering."
        : `Jio is unsupported on this model. ${legacyOperators}`,
    };
  }
  if (/\b(?:4g|5g|lte|volte)\b/i.test(`${specText} ${identity}`)) {
    return { question, answer: `The listing indicates 4G or 5G capability. ${checkLte}` };
  }
  const networkSpecs = specs.filter(({ label }) => !/^connectivity$/i.test(label));
  const network = networkSpecs.map(({ value }) => value).join(" ");
  if (/\b(?:gsm|gprs|edge|2g)\b/i.test(network)) {
    const generation = /\b(?:3g|umts|hspa|wcdma)\b/i.test(network) ? "2G/3G" : "2G";
    return {
      question,
      answer: `This phone uses ${generation} service. Jio does not work on it. ${legacyOperators}`,
    };
  }
  return {
    question,
    answer:
      "SIM calling compatibility needs confirmation for this listing. If it is a 2G-only variant, Jio will not work. Airtel, Vi, or BSNL may work where the correct network is available. Share your operator, PIN code, and whether you need calls or data before ordering.",
  };
}

export function getProductFaqs(
  product: FaqProduct,
  storeFaqs: Faq[],
  excludedQuestions: Set<string>,
) {
  const storeQuestions = new Set(
    [...excludedQuestions, ...storeFaqs.map(({ question }) => question)].map((q) =>
      q.trim().toLowerCase(),
    ),
  );
  const seen = new Set<string>();
  const authored = (product.faqs || []).filter(({ question, answer }) => {
    const key = question.trim().toLowerCase();
    if (!key || !answer.trim() || seen.has(key) || storeQuestions.has(key)) return false;
    if (
      product.category === "phones" &&
      networkQuestion.test(question) &&
      !dualSimQuestion.test(question)
    )
      return false;
    seen.add(key);
    return true;
  });
  const productFaqs =
    product.category === "phones" ? [networkAnswer(product), ...authored] : authored;
  if (!authored.some(({ question }) => /included|box contents|comes with/i.test(question))) {
    const included = product.specs
      .find(({ label }) => /^(?:in the box|box contents|included accessories)$/i.test(label.trim()))
      ?.value.trim();
    productFaqs.push({
      question: `What is included with ${product.name}?`,
      answer:
        included ||
        (product.category === "phones"
          ? "Check the specifications and ask support to confirm which battery, charger, accessories, and packaging are included with the available unit. You can request photos of the actual unit before you order."
          : "Check the product description and gallery for the item and any included pieces. Ask support to confirm model compatibility and box contents before ordering."),
    });
  }
  if (product.stock <= 0) {
    productFaqs.push({
      question: `Can I order ${product.name} when it is out of stock?`,
      answer:
        "Use the restock form on this page or contact support to register your interest. Support can check availability and suggest alternatives.",
    });
  }
  return [
    ...productFaqs,
    ...storeFaqs.filter(
      (faq) =>
        product.category === "phones" || !/warranty on the battery and charger/i.test(faq.question),
    ),
  ];
}

export function productSummary(product: FaqProduct) {
  if (product.description.trim()) return product.description.trim().replace(/\s+/g, " ");
  const facts = product.specs
    .filter(
      ({ label, value }) =>
        /^(?:display|form factor|cellular network|network|capacity|connector|compatibility|battery|operating system)$/i.test(
          label.trim(),
        ) &&
        value?.trim().length > 0 &&
        value.length <= 60,
    )
    .slice(0, 3)
    .map(({ label, value }) => `${label.trim()} – ${value.trim().replace(/[.]+$/, "")}`);
  const tagline = product.tagline.trim().replace(/[.]+$/, "");
  if (facts.length) return `${product.name}. ${facts.join(". ")}.`;
  if (tagline && !/^(?:phones|audio|accessories|wearables|gaming)$/i.test(tagline))
    return `${product.name}. ${tagline}.`;
  const type = product.formFactor?.trim();
  if (type && product.category === "phones")
    return `${product.name} is listed as a ${type.toLowerCase()} model. Check the compatibility FAQs for SIM and coverage guidance before ordering.`;
  return `${product.name}. Contact Aghanims Phones and Gadgets to confirm compatibility and what comes with this listing.`;
}

export function shortenSnippet(text: string, max = 155) {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(" ", max - 1);
  return `${text.slice(0, cut > max * 0.6 ? cut : max - 1).trimEnd()}…`;
}
