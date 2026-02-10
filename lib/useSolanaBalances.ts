import { useEffect, useState, useCallback } from "react";
import { PublicKey, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import { useSolanaConnection } from "./SolanaConnectionContext";
import bs58 from "bs58";
type BalanceMap = Record<string, number>;
interface Wallet {
  publicKey: string;
  privateKey: string;
  mnemonic: string;
  path: string;
}

export function useSolanaBalances(wallets: Wallet[], pathTypes: string[]) {
  const connection = useSolanaConnection();

  const [balances, setBalances] = useState<BalanceMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalances = useCallback(async () => {
    if (wallets.length === 0) return;
    let accounts: PublicKey[] = [];
    if (pathTypes[0] === "501") {
      accounts = wallets.map((w) => {
        const strSecretKey = bs58.decode(w.privateKey);
        const strSolanaPubKey = Keypair.fromSecretKey(strSecretKey).publicKey;
        return strSolanaPubKey;
      });
    } else {
    }
    setLoading(true);
    setError(null);

    try {
      const infos = await connection.getMultipleAccountsInfo(accounts);
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
  }, [wallets, connection]);

  useEffect(() => {
    fetchBalances();
    console.log("in useeffect");
  }, [fetchBalances]);

  return {
    balances,
    loading,
    error,
    refreshBalances: fetchBalances,
  };
}
