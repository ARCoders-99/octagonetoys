"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import { formatPrice } from "@/lib/format";

const PAYMENT_OPTIONS = [
  { value: "cod", label: "Cash on delivery", hint: "Pay when your toys arrive" },
  { value: "bank_transfer", label: "Bank transfer", hint: "We will share account details" },
  { value: "jazzcash", label: "JazzCash", hint: "We will send a payment request" },
  { value: "easypaisa", label: "Easypaisa", hint: "We will send a payment request" },
];

const EMPTY_ADDRESS = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Pakistan",
};

export default function CheckoutForm({ defaultName = "", defaultEmail = "", defaultAddress = null }) {
  const { items, ready, subtotal, clearCart } = useCart();
  const settings = useSettings();
  const router = useRouter();

  const [address, setAddress] = useState({
    ...EMPTY_ADDRESS,
    fullName: defaultAddress?.fullName || defaultName || "",
    email: defaultEmail || "",
    phone: defaultAddress?.phone || "",
    addressLine1: defaultAddress?.line1 || "",
    addressLine2: defaultAddress?.line2 || "",
    city: defaultAddress?.city || "",
    state: defaultAddress?.state || "",
    postalCode: defaultAddress?.zip || "",
    country: defaultAddress?.country || "Pakistan",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [customerNotes, setCustomerNotes] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(null);
  const [discountMessage, setDiscountMessage] = useState({ type: "", text: "" });
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
  const discountAmount = discount?.discountAmount || 0;
  const total = Math.max(0, subtotal + shipping - discountAmount);

  const missingForFreeShipping = useMemo(
    () => Math.max(0, settings.freeShippingThreshold - subtotal),
    [settings.freeShippingThreshold, subtotal]
  );

  const updateAddress = (event) => {
    const { name, value } = event.target;
    setAddress((current) => ({ ...current, [name]: value }));
  };

  const applyDiscount = async (event) => {
    event.preventDefault();
    if (!discountCode.trim()) return;

    setCheckingDiscount(true);
    setDiscountMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode, subtotal }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Invalid discount code");

      setDiscount(data);
      setDiscountMessage({
        type: "success",
        text: `${data.code} applied — you saved ${formatPrice(data.discountAmount)}.`,
      });
    } catch (requestError) {
      setDiscount(null);
      setDiscountMessage({ type: "error", text: requestError.message });
    } finally {
      setCheckingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setDiscount(null);
    setDiscountCode("");
    setDiscountMessage({ type: "", text: "" });
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setError("");

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          shippingAddress: address,
          paymentMethod,
          customerNotes,
          discountCode: discount?.code || "",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not place your order");

      clearCart();
      router.push(`/order/${data.orderNumber}?token=${data.accessToken}`);
    } catch (requestError) {
      setError(requestError.message);
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-sm text-slate-500">
        Preparing checkout…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-4xl">🛒</div>
        <h1 className="mt-5 text-3xl font-black text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">Add a toy before heading to checkout.</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex rounded-full bg-toy-orange px-6 py-3 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600"
        >
          Browse toys
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Secure checkout</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Complete your order
          </h1>
        </div>
        <Link href="/cart" className="text-sm font-semibold text-slate-500 transition hover:text-slate-900">
          ← Back to cart
        </Link>
      </div>

      <form onSubmit={submitOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-toy-purple text-sm font-black text-white">1</span>
              <h2 className="text-lg font-black text-slate-900">Contact details</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Full name *</span>
                <input
                  name="fullName"
                  value={address.fullName}
                  onChange={updateAddress}
                  required
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
                  placeholder="Ayesha Khan"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Phone *</span>
                <input
                  name="phone"
                  value={address.phone}
                  onChange={updateAddress}
                  required
                  autoComplete="tel"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
                  placeholder="03xx xxxxxxx"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-semibold text-slate-700">Email *</span>
                <input
                  name="email"
                  type="email"
                  value={address.email}
                  onChange={updateAddress}
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
                  placeholder="you@example.com"
                />
                <span className="mt-1 block text-xs text-slate-400">
                  Your receipt and delivery updates go to this address.
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-toy-purple text-sm font-black text-white">2</span>
              <h2 className="text-lg font-black text-slate-900">Shipping address</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-semibold text-slate-700">Street address *</span>
                <input
                  name="addressLine1"
                  value={address.addressLine1}
                  onChange={updateAddress}
                  required
                  autoComplete="address-line1"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
                  placeholder="House / flat, street"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-semibold text-slate-700">Area / landmark</span>
                <input
                  name="addressLine2"
                  value={address.addressLine2}
                  onChange={updateAddress}
                  autoComplete="address-line2"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
                  placeholder="Optional"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">City *</span>
                <input
                  name="city"
                  value={address.city}
                  onChange={updateAddress}
                  required
                  autoComplete="address-level2"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
                  placeholder="Lahore"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Province / state</span>
                <input
                  name="state"
                  value={address.state}
                  onChange={updateAddress}
                  autoComplete="address-level1"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
                  placeholder="Punjab"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Postal code</span>
                <input
                  name="postalCode"
                  value={address.postalCode}
                  onChange={updateAddress}
                  autoComplete="postal-code"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
                  placeholder="54000"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Country</span>
                <input
                  name="country"
                  value={address.country}
                  onChange={updateAddress}
                  autoComplete="country-name"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-toy-purple text-sm font-black text-white">3</span>
              <h2 className="text-lg font-black text-slate-900">Payment method</h2>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PAYMENT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    paymentMethod === option.value
                      ? "border-toy-orange bg-amber-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={() => setPaymentMethod(option.value)}
                    className="mt-0.5 h-4 w-4 text-toy-orange focus:ring-toy-orange"
                  />
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{option.label}</span>
                    <span className="block text-xs text-slate-500">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>

            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Order notes (optional)</span>
              <textarea
                value={customerNotes}
                onChange={(event) => setCustomerNotes(event.target.value)}
                rows={3}
                maxLength={500}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-toy-orange"
                placeholder="Delivery instructions, gift note, preferred time…"
              />
            </label>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-black text-slate-900">Your order</h2>

          <ul className="mt-4 max-h-72 space-y-3 overflow-auto pr-1">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xl">🧸</div>
                  )}
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-toy-purple px-1 text-[10px] font-bold text-white">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-400">{formatPrice(item.price)} each</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-amber-200/70 pt-4">
            {discount ? (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm">
                <span className="font-bold text-emerald-700">
                  {discount.code} applied
                </span>
                <button
                  type="button"
                  onClick={removeDiscount}
                  className="text-xs font-semibold text-emerald-700 underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={discountCode}
                  onChange={(event) => setDiscountCode(event.target.value.toUpperCase())}
                  placeholder="Discount code"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-toy-orange"
                />
                <button
                  type="button"
                  onClick={applyDiscount}
                  disabled={checkingDiscount}
                  className="rounded-full bg-toy-purple px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-violet-700 disabled:opacity-60"
                >
                  {checkingDiscount ? "…" : "Apply"}
                </button>
              </div>
            )}

            {discountMessage.text && (
              <p
                className={`mt-2 text-xs font-medium ${
                  discountMessage.type === "success" ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {discountMessage.text}
              </p>
            )}
          </div>

          <dl className="mt-4 space-y-2.5 border-t border-amber-200/70 pt-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd className="font-semibold text-slate-900">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Shipping</dt>
              <dd className="font-semibold text-slate-900">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </dd>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Discount</dt>
                <dd className="font-semibold">−{formatPrice(discountAmount)}</dd>
              </div>
            )}
            {shipping > 0 && (
              <p className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                Add {formatPrice(missingForFreeShipping)} more for free delivery.
              </p>
            )}
            <div className="flex justify-between border-t border-amber-200/70 pt-3 text-base font-black text-slate-900">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>

          {error && (
            <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-full bg-toy-orange px-5 py-3.5 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Placing order…" : `Place order · ${formatPrice(total)}`}
          </button>

          <p className="mt-3 text-center text-xs leading-5 text-slate-400">
            By placing this order you agree to our delivery and returns policy. Prices include all
            applicable taxes.
          </p>
        </aside>
      </form>
    </div>
  );
}
