import Link from "next/link";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footerHref: string;
  footerLabel: string;
  footerText: string;
};

export function AuthShell({
  title,
  description,
  children,
  footerHref,
  footerLabel,
  footerText
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Kho Phòng Realtime
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        {children}

        <p className="mt-6 text-center text-sm text-slate-600">
          {footerText}{" "}
          <Link className="font-semibold text-teal-700 hover:text-teal-900" href={footerHref}>
            {footerLabel}
          </Link>
        </p>
      </section>
    </main>
  );
}
