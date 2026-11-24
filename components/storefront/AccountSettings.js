"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none transition focus:border-toy-orange focus:bg-white focus:ring-4 focus:ring-amber-100";

const EMPTY_ADDRESS = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  country: "Pakistan",
};

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function Notice({ type, text }) {
  if (!text) return null;
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ${
        type === "error"
          ? "bg-rose-50 text-rose-700 ring-rose-100"
          : "bg-emerald-50 text-emerald-700 ring-emerald-100"
      }`}
    >
      {text}
    </div>
  );
}

function addressLine(address) {
  return [address.line1, address.line2, address.city, address.state, address.zip, address.country]
    .filter(Boolean)
    .join(", ");
}

export default function AccountSettings({ user, initialAddresses = [] }) {
  const router = useRouter();

  const [profile, setProfile] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
  });
  const [profileState, setProfileState] = useState({ error: "", success: "", saving: false });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordState, setPasswordState] = useState({ error: "", success: "", saving: false });

  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressState, setAddressState] = useState({ error: "", success: "", saving: false });
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(EMPTY_ADDRESS);

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileState({ error: "", success: "", saving: true });
    try {
      const data = await request("/api/account/profile", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
      setProfile((current) => ({
        ...current,
        firstName: data.user?.firstName ?? current.firstName,
        lastName: data.user?.lastName ?? current.lastName,
        phone: data.user?.phone ?? current.phone,
      }));
      setProfileState({ error: "", success: data.message || "Profile updated.", saving: false });
      router.refresh();
    } catch (error) {
      setProfileState({ error: error.message, success: "", saving: false });
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setPasswordState({ error: "", success: "", saving: true });
    try {
      const data = await request("/api/account/password", {
        method: "POST",
        body: JSON.stringify(passwords),
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordState({ error: "", success: data.message || "Password changed.", saving: false });
    } catch (error) {
      setPasswordState({ error: error.message, success: "", saving: false });
    }
  };

  const startNew = () => {
    setEditing("new");
    setDraft({
      ...EMPTY_ADDRESS,
      fullName:
        `${profile.firstName} ${profile.lastName}`.trim() || user.name || "",
      phone: profile.phone || "",
    });
    setAddressState({ error: "", success: "", saving: false });
  };

  const startEdit = (index) => {
    setEditing(index);
    setDraft({ ...EMPTY_ADDRESS, ...addresses[index] });
    setAddressState({ error: "", success: "", saving: false });
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    setAddressState({ error: "", success: "", saving: true });
    try {
      const isNew = editing === "new";
      const data = await request(
        isNew ? "/api/account/addresses" : `/api/account/addresses/${editing}`,
        {
          method: isNew ? "POST" : "PATCH",
          body: JSON.stringify({ ...draft, makeDefault: isNew && addresses.length === 0 }),
        }
      );
      setAddresses(data.addresses || []);
      setEditing(null);
      setAddressState({ error: "", success: data.message || "Address saved.", saving: false });
      router.refresh();
    } catch (error) {
      setAddressState({ error: error.message, success: "", saving: false });
    }
  };

  const makeDefault = async (index) => {
    setAddressState({ error: "", success: "", saving: true });
    try {
      const data = await request(`/api/account/addresses/${index}`, {
        method: "PATCH",
        body: JSON.stringify({ makeDefault: true }),
      });
      setAddresses(data.addresses || []);
      setAddressState({ error: "", success: data.message || "Default address updated.", saving: false });
      router.refresh();
    } catch (error) {
      setAddressState({ error: error.message, success: "", saving: false });
    }
  };

  const removeAddress = async (index) => {
    if (!window.confirm("Remove this address?")) return;
    setAddressState({ error: "", success: "", saving: true });
    try {
      const data = await request(`/api/account/addresses/${index}`, { method: "DELETE" });
      setAddresses(data.addresses || []);
      if (editing === index) setEditing(null);
      setAddressState({ error: "", success: data.message || "Address removed.", saving: false });
      router.refresh();
    } catch (error) {
      setAddressState({ error: error.message, success: "", saving: false });
    }
  };

  const updateDraft = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  return (
    <section id="settings" className="mt-10 scroll-mt-24">
      <h2 className="text-xl font-black text-ink-900">Profile &amp; addresses</h2>
      <p className="mt-1 text-sm text-slate-500">
        Keep your details up to date for faster checkout and reliable delivery.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <form
          onSubmit={saveProfile}
          className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-sm font-black uppercase tracking-wide text-ink-900">Your details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <input
                name="firstName"
                value={profile.firstName}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, firstName: event.target.value }))
                }
                autoComplete="given-name"
                className={inputClass}
              />
            </Field>
            <Field label="Last name">
              <input
                name="lastName"
                value={profile.lastName}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, lastName: event.target.value }))
                }
                autoComplete="family-name"
                className={inputClass}
              />
            </Field>
            <Field label="Phone">
              <input
                name="phone"
                value={profile.phone}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, phone: event.target.value }))
                }
                autoComplete="tel"
                className={inputClass}
                placeholder="03xx xxxxxxx"
              />
            </Field>
            <Field label="Email">
              <input
                value={user.email}
                readOnly
                disabled
                className={`${inputClass} cursor-not-allowed text-slate-400`}
              />
            </Field>
          </div>
          <Notice type="error" text={profileState.error} />
          <Notice type="success" text={profileState.success} />
          <p className="mt-3 text-xs text-slate-400">
            Need to change your email? Contact support and we will verify it for you.
          </p>
          <button
            type="submit"
            disabled={profileState.saving}
            className="mt-4 rounded-full bg-toy-orange px-5 py-2.5 text-[11px] font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {profileState.saving ? "Saving…" : "Save details"}
          </button>
        </form>

        <form
          onSubmit={savePassword}
          className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-sm font-black uppercase tracking-wide text-ink-900">Change password</h3>
          <div className="mt-4 space-y-4">
            <Field label="Current password">
              <input
                name="currentPassword"
                type="password"
                value={passwords.currentPassword}
                onChange={(event) =>
                  setPasswords((current) => ({ ...current, currentPassword: event.target.value }))
                }
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </Field>
            <Field label="New password">
              <input
                name="newPassword"
                type="password"
                value={passwords.newPassword}
                onChange={(event) =>
                  setPasswords((current) => ({ ...current, newPassword: event.target.value }))
                }
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </Field>
            <Field label="Confirm new password">
              <input
                name="confirmPassword"
                type="password"
                value={passwords.confirmPassword}
                onChange={(event) =>
                  setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </Field>
          </div>
          <Notice type="error" text={passwordState.error} />
          <Notice type="success" text={passwordState.success} />
          <button
            type="submit"
            disabled={passwordState.saving}
            className="mt-4 rounded-full border border-slate-300 px-5 py-2.5 text-[11px] font-black uppercase tracking-wide text-ink-700 transition hover:border-toy-purple hover:text-toy-purple disabled:cursor-not-allowed disabled:opacity-60"
          >
            {passwordState.saving ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>

      <div className="mt-5 rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-ink-900">Address book</h3>
            <p className="mt-1 text-xs text-slate-500">
              The first address is used to prefill checkout.
            </p>
          </div>
          {editing === null && (
            <button
              type="button"
              onClick={startNew}
              className="rounded-full bg-toy-purple px-5 py-2.5 text-[11px] font-black uppercase tracking-wide text-white shadow-md shadow-violet-200 transition hover:bg-violet-700"
            >
              Add address
            </button>
          )}
        </div>

        <Notice type="error" text={addressState.error} />
        <Notice type="success" text={addressState.success} />

        {addresses.length === 0 && editing === null ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="text-sm font-bold text-slate-600">No saved addresses yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Save one now and your next checkout will be quicker.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {addresses.map((address, index) => (
              <div
                key={`${address.line1}-${index}`}
                className={`rounded-2xl border p-4 ${
                  index === 0 ? "border-violet-300 bg-violet-50/40" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black text-ink-900">
                    {address.label || "Address"}
                    {address.fullName ? ` · ${address.fullName}` : ""}
                  </p>
                  {index === 0 && (
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-toy-purple">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{addressLine(address)}</p>
                {address.phone && <p className="mt-1 text-xs text-slate-500">{address.phone}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(index)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-600 transition hover:border-toy-purple hover:text-toy-purple"
                  >
                    Edit
                  </button>
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => makeDefault(index)}
                      disabled={addressState.saving}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-50"
                    >
                      Make default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAddress(index)}
                    disabled={addressState.saving}
                    className="rounded-full border border-rose-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing !== null && (
          <form
            onSubmit={saveAddress}
            className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/40 p-5"
          >
            <h4 className="text-sm font-black text-ink-900">
              {editing === "new" ? "New address" : "Edit address"}
            </h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Label">
                <input
                  name="label"
                  value={draft.label}
                  onChange={updateDraft}
                  className={inputClass}
                  placeholder="Home, Office, Gift"
                />
              </Field>
              <Field label="Recipient name">
                <input
                  name="fullName"
                  value={draft.fullName}
                  onChange={updateDraft}
                  required
                  autoComplete="name"
                  className={inputClass}
                />
              </Field>
              <Field label="Phone">
                <input
                  name="phone"
                  value={draft.phone}
                  onChange={updateDraft}
                  autoComplete="tel"
                  className={inputClass}
                />
              </Field>
              <Field label="Country">
                <input
                  name="country"
                  value={draft.country}
                  onChange={updateDraft}
                  autoComplete="country-name"
                  className={inputClass}
                />
              </Field>
              <Field label="Street address" className="sm:col-span-2">
                <input
                  name="line1"
                  value={draft.line1}
                  onChange={updateDraft}
                  required
                  autoComplete="address-line1"
                  className={inputClass}
                  placeholder="House / flat, street"
                />
              </Field>
              <Field label="Apartment, landmark (optional)" className="sm:col-span-2">
                <input
                  name="line2"
                  value={draft.line2}
                  onChange={updateDraft}
                  autoComplete="address-line2"
                  className={inputClass}
                />
              </Field>
              <Field label="City">
                <input
                  name="city"
                  value={draft.city}
                  onChange={updateDraft}
                  required
                  autoComplete="address-level2"
                  className={inputClass}
                />
              </Field>
              <Field label="Province / state">
                <input
                  name="state"
                  value={draft.state}
                  onChange={updateDraft}
                  autoComplete="address-level1"
                  className={inputClass}
                />
              </Field>
              <Field label="Postal code">
                <input
                  name="zip"
                  value={draft.zip}
                  onChange={updateDraft}
                  autoComplete="postal-code"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={addressState.saving}
                className="rounded-full bg-toy-orange px-5 py-2.5 text-[11px] font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addressState.saving ? "Saving…" : "Save address"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-[11px] font-black uppercase tracking-wide text-slate-600 transition hover:bg-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
