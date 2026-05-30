interface Props {
  label: string;
  value: number;
}

export function StatCard({ label, value }: Props) {
  return (
    <div className="rounded-3xl border border-[#CAC4D0]/40 bg-[#F4EFF4] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[#49454F]">{label}</p>
      <p className="text-2xl font-semibold text-[#1D1B20] mt-1">{value}</p>
    </div>
  );
}
