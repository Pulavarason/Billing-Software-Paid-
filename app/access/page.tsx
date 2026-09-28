import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, MessageCircle, Phone, Mail, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

const CONTACT = {
  name: process.env.NEXT_PUBLIC_ACCESS_CONTACT ?? "Pulavarason",
  role: "Software Administrator",
  phoneDisplay: "+91 94487 00508",
  phoneDigits: "919448700508", // country code + number, no "+" or spaces
  email: "pulavarsonk@gmail.com"
};

export default async function AccessPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const message =
    `Hello ${CONTACT.name},\n\n` +
    `I like to use this software and I would like to know more details about it ` +
    `(features, pricing and the one-time payment process) so I can get full access.\n\n` +
    `My registered email: ${user.email}\n\n` +
    `Please guide me on the next steps. Thank you!`;

  const whatsappUrl = `https://wa.me/${CONTACT.phoneDigits}?text=${encodeURIComponent(message)}`;
  const mailUrl = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
    "Request for full software access"
  )}&body=${encodeURIComponent(message)}`;
  const telUrl = `tel:+${CONTACT.phoneDigits}`;

  const steps = [
    { label: "Account created", done: true },
    { label: "Contact the administrator", done: false, active: true },
    { label: "One-time payment confirmed", done: false },
    { label: "Full access enabled", done: false }
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg))] p-5 animate-fade-in">
      <section className="w-full max-w-lg rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 shadow-card animate-scale-in sm:p-8">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-spice-600/10 px-3 py-1 text-xs font-semibold text-spice-600">
            Access pending
          </span>
          <SignOutButton />
        </div>

        {/* Heading */}
        <div className="mt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-spice-600/10 text-spice-600">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[rgb(var(--text))]">Unlock full access</h1>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-muted))]">
            Your account is ready. To use all software features, contact the administrator. Access is enabled after
            your <strong className="text-[rgb(var(--text))]">one-time payment</strong> is confirmed.
          </p>
        </div>

        {/* Steps */}
        <ol className="mt-6 space-y-3">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  s.done
                    ? "border-spice-600 bg-spice-600 text-white"
                    : s.active
                    ? "border-spice-600 text-spice-600"
                    : "border-[rgb(var(--border))] text-[rgb(var(--text-muted))]"
                }`}
              >
                {s.done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={`text-sm ${
                  s.done || s.active
                    ? "font-medium text-[rgb(var(--text))]"
                    : "text-[rgb(var(--text-muted))]"
                }`}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>

        {/* Contact */}
        <div className="mt-6 rounded-xl border border-[rgb(var(--border))] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))]">
            Contact person
          </p>
          <p className="mt-1 text-base font-semibold text-[rgb(var(--text))]">
            {CONTACT.name}{" "}
            <span className="text-sm font-normal text-[rgb(var(--text-muted))]">· {CONTACT.role}</span>
          </p>

          <div className="mt-3 space-y-1 text-sm">
            <Link
              href={telUrl}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[rgb(var(--text))] hover:bg-[rgb(var(--border))]/60"
            >
              <Phone className="h-4 w-4 text-spice-600" />
              {CONTACT.phoneDisplay}
            </Link>
            <Link
              href={mailUrl}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[rgb(var(--text))] hover:bg-[rgb(var(--border))]/60"
            >
              <Mail className="h-4 w-4 text-spice-600" />
              <span className="break-all">{CONTACT.email}</span>
            </Link>
          </div>

          <Link
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-spice-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-spice-700"
          >
            <MessageCircle className="h-4 w-4" />
            Send message on WhatsApp
          </Link>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              href={telUrl}
              className="flex items-center justify-center gap-2 rounded-lg border border-[rgb(var(--border))] px-4 py-2.5 text-sm font-medium text-[rgb(var(--text))] hover:bg-[rgb(var(--border))]/60"
            >
              <Phone className="h-4 w-4" />
              Call
            </Link>
            <Link
              href={mailUrl}
              className="flex items-center justify-center gap-2 rounded-lg border border-[rgb(var(--border))] px-4 py-2.5 text-sm font-medium text-[rgb(var(--text))] hover:bg-[rgb(var(--border))]/60"
            >
              <Mail className="h-4 w-4" />
              Email
            </Link>
          </div>

          <p className="mt-3 text-xs text-[rgb(var(--text-muted))]">
            The message is pre-filled with your interest and registered email. You can edit it before sending.
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-[rgb(var(--text-muted))]">
          Signed in as <span className="font-medium text-[rgb(var(--text))]">{user.email}</span>
        </p>
      </section>
    </main>
  );
}