import Link from "next/link";
import { notFound } from "next/navigation";
import { STORE_EMAIL, STORE_NAME, STORE_PHONE } from "@/lib/constants";

const POLICIES = {
  "privacy-policy": {
    title: "Privacy Policy",
    intro:
      "We only collect the information we need to process your order and improve your shopping experience.",
    sections: [
      {
        heading: "What we collect",
        body: "When you place an order we collect your name, email address, phone number and shipping address. If you create an account we also store a securely hashed password. We never store card numbers on our servers.",
      },
      {
        heading: "How we use your information",
        body: "Your details are used to fulfil orders, send delivery updates and answer support requests. With your consent we may send occasional offers; you can opt out at any time.",
      },
      {
        heading: "Sharing",
        body: "We share only what is necessary with delivery partners and payment providers. We never sell your personal data to third parties.",
      },
      {
        heading: "Your choices",
        body: `You can request a copy of your data or ask us to delete your account by emailing ${STORE_EMAIL}. Order records are retained where required for accounting and legal purposes.`,
      },
    ],
  },
  "returns-policy": {
    title: "Returns & Exchange Policy",
    intro:
      "If something is not right, tell us within 7 days of delivery and we will make it right.",
    sections: [
      {
        heading: "Eligibility",
        body: "Items must be unused, in their original packaging and accompanied by the order number. For hygiene reasons, opened plush items and consumable art supplies cannot be returned unless faulty.",
      },
      {
        heading: "Damaged or incorrect items",
        body: "Send us a photo of the item and the packaging within 48 hours of delivery. We will arrange a replacement or a full refund, including any delivery charges.",
      },
      {
        heading: "How to start a return",
        body: `Email ${STORE_EMAIL} or message us on WhatsApp with your order number and the reason for the return. Our team will confirm the next steps within one working day.`,
      },
      {
        heading: "Refunds",
        body: "Once the returned item is inspected, refunds are issued to the original payment method within 5 working days. Cash-on-delivery orders are refunded by bank transfer or store credit, whichever you prefer.",
      },
    ],
  },
  "shipping-policy": {
    title: "Shipping Policy",
    intro:
      "We dispatch quickly and keep you updated from the moment your parcel leaves our warehouse.",
    sections: [
      {
        heading: "Processing time",
        body: "Orders placed before 2pm on a working day are usually dispatched the same day. Orders placed later, or on Sundays and public holidays, are dispatched the next working day.",
      },
      {
        heading: "Delivery times",
        body: "Major cities: 2–4 working days. Other areas: 4–7 working days. Remote locations may take slightly longer. You will receive a tracking reference as soon as your order ships.",
      },
      {
        heading: "Charges",
        body: "Shipping is free on orders above Rs. 3,999. Below that, a flat fee of Rs. 250 applies. Any promotional free-shipping offer is applied automatically at checkout.",
      },
      {
        heading: "Cash on delivery",
        body: "Cash on delivery is available across Pakistan. Please keep the exact amount ready; our courier may not be able to provide change for large notes.",
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: `These terms govern your use of ${STORE_NAME} and the purchase of products from our store.`,
    sections: [
      {
        heading: "Orders",
        body: "All orders are subject to stock availability and confirmation of the delivery address. We may cancel an order if an item is unavailable or if we suspect fraudulent activity, and any payment taken will be refunded in full.",
      },
      {
        heading: "Pricing",
        body: "Prices are shown in Pakistani Rupees and include applicable taxes unless stated otherwise. We reserve the right to correct pricing errors before an order is dispatched.",
      },
      {
        heading: "Product information",
        body: "We work hard to show accurate colours and descriptions, but slight differences may occur between screens. Age recommendations are guidance only; adult supervision is recommended for all toys.",
      },
      {
        heading: "Contact",
        body: `Questions about these terms? Email ${STORE_EMAIL} or call ${STORE_PHONE}.`,
      },
    ],
  },
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) return { title: "Policy not found" };
  return { title: policy.title, description: policy.intro };
}

export default async function PolicyPage({ params }) {
  const { slug } = await params;
  const policy = POLICIES[slug];

  if (!policy) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">
        Customer care
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        {policy.title}
      </h1>
      <p className="mt-3 text-base leading-7 text-slate-600">{policy.intro}</p>

      <div className="mt-9 space-y-7">
        {policy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-black text-slate-900">{section.heading}</h2>
            <p className="mt-1.5 text-sm leading-7 text-slate-600">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-slate-200 pt-7">
        <Link
          href="/contact"
          className="inline-flex rounded-full bg-toy-orange px-6 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-amber-600"
        >
          Contact support
        </Link>
        <Link
          href="/shop"
          className="inline-flex rounded-full border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:border-slate-300"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
