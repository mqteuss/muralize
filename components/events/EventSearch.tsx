import { Search } from 'lucide-react';

interface Props {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export function EventSearch({ searchQuery, setSearchQuery }: Props) {
  return (
    <div className="relative flex-1 max-w-sm sm:ml-auto">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#49454F]" />
      <input
        type="text"
        placeholder="Buscar eventos..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-9 pr-4 py-2 bg-[#F4EFF4] rounded-full text-sm outline-none focus:ring-2 focus:ring-[#1D1B20]/20 transition-all text-[#1D1B20] placeholder-[#49454F]"
      />
    </div>
  );
}
