type ModuleCardProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function ModuleCard({ title, description, children }: ModuleCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
