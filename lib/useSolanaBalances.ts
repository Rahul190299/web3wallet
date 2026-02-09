import { useEffect, useState, useCallback } from "react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useSolanaConnection } from "./SolanaConnectionContext";

type BalanceMap = Record<string, number>;

export function useSolanaBalances(accounts: PublicKey[]) {
  const connection = useSolanaConnection();

  const [balances, setBalances] = useState<BalanceMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalances = useCallback(async () => {
    if (accounts.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const infos = await connection.getMultipleAccountsInfo(accounts);
      console.log("infos " + infos);
      const map: BalanceMap = {};
      infos.forEach((info, i) => {
        map[accounts[i].toBase58()] = info
          ? info.lamports / LAMPORTS_PER_SOL
          : 0;
      });

      setBalances(map);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [accounts, connection]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balances,
    loading,
    error,
    refreshBalances: fetchBalances,
  };
}
