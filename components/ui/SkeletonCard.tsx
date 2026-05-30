export function SkeletonCard() {
  return (
    <div className="flex flex-col justify-between p-5 rounded-3xl border border-[#CAC4D0]/30 bg-[#fefefe]/50 animate-pulse h-[140px]">
      <div>
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="h-5 bg-[#E6E0E9] rounded-md w-1/2"></div>
          <div className="h-5 bg-[#E6E0E9] rounded-full w-20 shrink-0"></div>
        </div>
        <div className="h-4 bg-[#E6E0E9] rounded-md w-3/4 mb-3"></div>
        <div className="h-4 bg-[#E6E0E9] rounded-md w-1/4"></div>
      </div>
    </div>
  );
}
