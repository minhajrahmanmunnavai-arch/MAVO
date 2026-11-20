import Footer from "../components/Main/Footer/Footer.jsx";

const sections = [
  {
    title: "Using the site",
    paragraphs: [
      "You may use this site only in accordance with applicable laws and these terms. You are responsible for activity carried out through your account and for keeping your sign-in details secure.",
      "Do not misuse the site, interfere with its operation, attempt unauthorized access, or use it to submit unlawful, misleading, or harmful material."
    ]
  },
  {
    title: "Accounts",
    paragraphs: [
      "Some features require an account. Provide accurate information when registering and keep it up to date. You may stop using your account at any time; contact customer care if you need help with an account-related request.",
      "We may restrict or suspend access when reasonably necessary to protect the site, users, or our legal rights, or when these terms have been violated."
    ]
  },
  {
    title: "Products and availability",
    paragraphs: [
      "We aim to display product descriptions, images, prices, and availability accurately. Product details and availability may change without notice, and we cannot guarantee that every item shown will remain available.",
      "If a product listing contains an error, we reserve the right to correct it and will take reasonable steps to address affected orders."
    ]
  },
  {
    title: "Orders and payment",
    paragraphs: [
      "Submitting an order is a request to purchase the listed items. An order is not accepted until we confirm it. We may decline or cancel an order when necessary, including when an item is unavailable or listing information is materially incorrect.",
      "Any applicable taxes, delivery charges, payment methods, and order-specific terms will be shown during checkout or communicated with the order. Do not treat a displayed price as a confirmed charge until your order is accepted."
    ]
  },
  {
    title: "Shipping, returns, and refunds",
    paragraphs: [
      "Delivery estimates are provided as guidance and may be affected by circumstances outside our control. Any return, exchange, or refund will be handled under the policy presented for the relevant purchase and applicable law."
    ]
  },
  {
    title: "Site content and availability",
    paragraphs: [
      "The site's text, design, branding, and other materials are protected by applicable intellectual-property laws. You may use the site for personal, lawful shopping purposes, but may not copy, distribute, or commercially exploit site materials without permission.",
      "We may change, suspend, or discontinue parts of the site. We do not guarantee uninterrupted or error-free access."
    ]
  },
  {
    title: "Disclaimers and liability",
    paragraphs: [
      "To the extent permitted by law, the site is provided on an as-available basis. Nothing in these terms excludes rights or remedies that cannot legally be excluded, or limits liability where such limitation is not permitted."
    ]
  },
  {
    title: "Changes and contact",
    paragraphs: [
      "We may update these terms as the site or applicable requirements change. The latest version will be posted here with its update date. Continued use of the site after an update means the revised terms apply to your future use, subject to applicable law.",
      "For questions about these terms, contact us using the customer care channels on our website."
    ]
  }
];

const TermsOfService = () => (
  <>
    <main className="bg-[#f8f7f4] px-5 py-14 text-gray-900 sm:px-8 sm:py-20">
      <article className="mx-auto max-w-4xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
          The essentials
        </p>
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-gray-500">Last updated: November 7, 2026</p>
        <p className="mt-8 max-w-3xl text-base leading-7 text-gray-600">
          These terms apply when you visit or use the Lumina website. By using
          the site, you agree to follow these terms and applicable laws.
        </p>

        <div className="mt-10 divide-y divide-gray-200 border-y border-gray-200">
          {sections.map(({ title, paragraphs }, index) => (
            <section key={title} className="py-7 sm:py-8">
              <h2 className="text-xl font-semibold">
                <span className="mr-3 font-serif text-amber-700">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {title}
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-gray-600 sm:text-base">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
    <Footer />
  </>
);

export default TermsOfService;
