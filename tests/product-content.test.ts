import assert from "node:assert/strict";
import test from "node:test";
import { getProductFaqs, productSummary, shortenSnippet } from "../src/lib/product-content.ts";
import { productImageUrls } from "../src/lib/site.ts";

const phone = {
  slug: "legacy-phone",
  name: "Legacy phone",
  category: "phones",
  tagline: "",
  description: "",
  specs: [{ label: "Network", value: "GSM / UMTS" }],
  stock: 1,
};
const faqsFor = (p: Parameters<typeof getProductFaqs>[0]) => getProductFaqs(p, [], new Set());

test("legacy phone FAQs give a direct Jio answer and condition other carriers on coverage", () => {
  const [faq] = faqsFor(phone);
  assert.match(faq.answer, /2G\/3G.*Jio does not work/);
  assert.match(faq.answer, /Airtel, Vi .* or BSNL.*where.*2G coverage/);
});

test("4G models and JioPhone 2 use separate voice and SIM-slot guidance", () => {
  assert.match(
    faqsFor({ ...phone, specs: [{ label: "Network", value: "GSM / LTE" }] })[0].answer,
    /VoLTE/,
  );
  assert.match(
    faqsFor({ ...phone, slug: "Jio-Phone-2-Qwerty" })[0].answer,
    /Slot 1 requires an active Jio SIM/,
  );
  assert.match(
    faqsFor({ ...phone, slug: "apple-iphone-5s-16gb" })[0].answer,
    /Jio voice calling is unsupported/,
  );
  assert.match(
    faqsFor({
      ...phone,
      slug: "nokia-8110-4g",
      specs: [{ label: "Cellular network", value: "Jio not supported" }],
    })[0].answer,
    /exact bands/,
  );
});

test("unverified, landline and sold-out listings get appropriate FAQs", () => {
  const draft = { ...phone, specs: [], stock: 0 };
  assert.match(faqsFor(draft)[0].answer, /needs confirmation/);
  assert.match(faqsFor({ ...draft, formFactor: "Landline" })[0].answer, /line type and connector/);
  assert.match(faqsFor(draft).at(-1)!.answer, /restock form/);
});

test("specific questions and package specifications survive the FAQ merge", () => {
  const faqs = faqsFor({
    ...phone,
    specs: [...phone.specs, { label: "In the box", value: "Phone and battery" }],
    faqs: [
      { question: "Will it work with Jio?", answer: "Yes, all Indian networks work." },
      { question: "Does it support dual SIM?", answer: "Two SIM slots are listed." },
    ],
  });
  assert.equal(faqs.length, 3);
  assert.equal(faqs[1].answer, "Two SIM slots are listed.");
  assert.equal(faqs[2].answer, "Phone and battery");
});

test("search descriptions use recorded facts and search images exclude placeholders", () => {
  assert.equal(productSummary(phone), "Legacy phone. Network – GSM / UMTS.");
  assert.equal(
    shortenSnippet("A complete sentence with another phrase.", 25),
    "A complete sentence with…",
  );
  assert.deepEqual(
    productImageUrls([
      "/logo.png",
      "data:image/png;base64,AAAA",
      "/photos/model.jpg",
      "/photos/model.jpg",
    ]),
    ["https://aghanimsphones.in/photos/model.jpg"],
  );
});
