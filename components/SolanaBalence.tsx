import { solanaBalenceStore } from "@/store/balencesstore";

export function SolanaBalence({ pubKey }: { pubKey: string }) {
  const {balences} = solanaBalenceStore();
  return (
    <span className="inline-block mb-2 bg-primary text-primary-foreground rounded px-2 text-sm ml-2 font-medium">
      {balences[pubKey]} SOL
    </span>
  );
}
