import Footer from "../components/Main/Footer/Footer.jsx";

const sections = [
  {
    title: "Information we collect",
    paragraphs: [
      "When you create an account, we collect the information you provide, such as your name and email address, along with the password needed to authenticate your account.",
      "If you use features such as a saved-items list, that information may be stored in your browser. The site also uses authentication cookies to support account sign-in and session management."
    ]
  },
  {
    title: "How we use information",
    paragraphs: [
      "We use information to provide and maintain the site, create and secure accounts, respond to requests, and operate the features you choose to use.",
      "We do not use account passwords for marketing. Do not send sensitive personal or financial information through forms that are not intended to collect it."
    ]
  },
  {
    title: "Cookies and browser storage",
    paragraphs: [
      "Authentication cookies help the site recognize your session. Your browser may let you block or remove cookies, but some account features may not work correctly if you do.",
      "Saved items may be kept in your browser's local storage. Clearing your browser's site data can remove them."
    ]
  },
  {
    title: "Sharing and retention",
    paragraphs: [
      "We do not sell your personal information. Information may be processed by service providers that help operate the site, or disclosed when required by law. We keep information for as long as needed to provide the service, protect it, and meet applicable legal obligations."
    ]
  },
  {
    title: "Your choices and rights",
    paragraphs: [
      "You can update browser storage and cookie preferences through your browser settings. Depending on where you live, you may also have rights to access, correct, or request deletion of personal information. Contact us using the customer care channels on our website to make a privacy request."
    ]
  },
  {
    title: "Children's privacy",
    paragraphs: [
      "This site is not intended for children who are not permitted to use online shopping services under the laws that apply to them. We do not knowingly seek to collect their personal information."
    ]
  },
  {
    title: "Changes to this policy",
    paragraphs: [
      "We may update this policy as the site or applicable requirements change. The date below indicates when this version was last updated."
    ]
  }
];

const PrivacyPolicy = () => (
  <>
    <main className="bg-[#f8f7f4] px-5 py-14 text-gray-900 sm:px-8 sm:py-20">
      <article className="mx-auto max-w-4xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
          Your privacy
        </p>
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-gray-500">Last updated: November 7, 2026</p>
        <p className="mt-8 max-w-3xl text-base leading-7 text-gray-600">
          This policy explains how Lumina handles information when you visit
          our website and use its account and shopping features.
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

export default PrivacyPolicy;
