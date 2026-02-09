"use client"
import { createContext, useContext, useMemo,ReactNode } from "react";
import { Connection } from "@solana/web3.js";

const SolanaContext = createContext<Connection | null>(null);

type Props = {
  rpcUrl: string;
  children: ReactNode;
};
export function SolanaProvider({ rpcUrl, children } :Props) {
  const connection = useMemo(
    () => new Connection(rpcUrl, "confirmed"),
    [rpcUrl]
  );

  return (
    <SolanaContext.Provider value={connection}>
      {children}
    </SolanaContext.Provider>
  );
}

export function useSolanaConnection() {
  const ctx = useContext(SolanaContext);
  if (!ctx) throw new Error("No Solana connection");
  return ctx;
}
