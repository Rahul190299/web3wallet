import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { derivePath } from "ed25519-hd-key";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import { ethers } from "ethers";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Grid2X2,
  List,
  Trash,
} from "lucide-react";
interface Wallet {
  publicKey: string;
  privateKey: string;
  mnemonic: string;
  path: string;
}

export function WalletGenerator() {
  const [mnemonicWords, setMnemonicWords] = useState<string[]>(
    Array(12).fill(" "),
  );
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [pathTypes, setPathTypes] = useState<string[]>([]);
  const [mnemonicInput, setMnemonicInput] = useState<string>("");

  const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<boolean[]>([]);
  const [visiblePhrases, setVisiblePhrases] = useState<boolean[]>([]);
  const [gridView, setGridView] = useState<boolean>(false);
  const [showMnemonic, setShowMnemonic] = useState<boolean>(false);
  const generateWalletFromMnemonic = (
    pathType: string,
    mnemonic: string,
    accountIndex: number,
  ) => {
    try {
      const seedBuffer = mnemonicToSeedSync(mnemonic);
      const path = `m/44'/${pathType}'/0'/${accountIndex}'`;
      const { key: derivedSeed } = derivePath(path, seedBuffer.toString("hex"));
      let publicKeyEncoded: string;
      let privateKeyEncoded: string;
      if (pathType === "60") {
        //generate keys for ethereum
        const privateKey = Buffer.from(derivedSeed).toString("hex");
        privateKeyEncoded = privateKey;
        const wallet = new ethers.Wallet(privateKeyEncoded);
        publicKeyEncoded = wallet.address;
      } else if (pathType === "501") {
        //generate keys for solana
        const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
        const keypair = Keypair.fromSecretKey(secretKey);
        privateKeyEncoded = bs58.encode(keypair.secretKey);
        publicKeyEncoded = keypair.publicKey.toBase58();
      } else {
        toast.error("Unsupported path type.");
        return null;
      }
      return {
        publicKey: publicKeyEncoded,
        privateKey: privateKeyEncoded,
        mnemonic: mnemonic,
        path: path,
      };
    } catch (err) {
      toast.error("Failed to generate wallet. Please try again.");
      return null;
    }
  };
  function handleGenerateWallet() {
    let mnemonic = mnemonicInput.trim();
    if (mnemonic) {
      if (!validateMnemonic(mnemonic)) {
        toast.error("Invalid recovery phrase. Please try again.");
        return;
      }
    } else {
      mnemonic = generateMnemonic();
    }
    const words = mnemonic.split(" ");
    setMnemonicWords(words);
    const wallet = generateWalletFromMnemonic(
      pathTypes[0],
      mnemonic,
      wallets.length,
    );
    if (wallet) {
      const updatedWallets = [...wallets, wallet];
      setWallets(updatedWallets);
      localStorage.setItem("wallets", JSON.stringify(updatedWallets));
      localStorage.setItem("mnemonics", JSON.stringify(words));
      localStorage.setItem("paths", JSON.stringify(pathTypes));
      setVisiblePrivateKeys([...visiblePrivateKeys, false]);
      setVisiblePhrases([...visiblePhrases, false]);
      toast.success("Wallet generated successfully!");
    }
  }
  return (
    <div className="flex flex-col gap-4">
      {wallets.length == 0 && (
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
        >
          <div>
            {pathTypes.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                className="flex gap-4 flex-col my-12"
              >
                <div className="flex flex-col gap-2">
                  <h1 className="tracking-tighter text-4xl md:text-5xl font-black">
                    Kosh supports multiple blockchains
                  </h1>
                  <p className="text-primary/80 font-semibold text-lg md:text-xl">
                    Choose a blockchain to get started.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size={"lg"}
                    onClick={() => {
                      setPathTypes(["501"]);
                      toast.success(
                        "Wallet selected. Please generate a wallet to continue.",
                      );
                    }}
                  >
                    Solana
                  </Button>
                  <Button
                    size={"lg"}
                    onClick={() => {
                      setPathTypes(["60"]);
                      toast.success(
                        "Wallet selected. Please generate a wallet to continue.",
                      );
                    }}
                  >
                    Ethereum
                  </Button>
                </div>
              </motion.div>
            )}
            {pathTypes.length !== 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                className="flex gap-4 flex-col my-12"
              >
                <div className="flex flex-col gap-2">
                  <h1 className="tracking-tighter text-4xl md:text-5xl font-black">
                    Secret Recovery Phrase
                  </h1>
                  <p className="text-primary/80 font-semibold text-lg md:text-xl">
                    Save these words in a safe place.
                  </p>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <Input
                    type="password"
                    placeholder="Enter your secret phrase (or leave blank to generate)"
                    onChange={(e) => setMnemonicInput(e.target.value)}
                    value={mnemonicInput}
                  />
                  <Button size={"lg"} onClick={() => handleGenerateWallet()}>
                    {mnemonicInput ? "Add Wallet" : "Generate Wallet"}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
      {mnemonicWords && wallets.length > 0 && (
        <motion.div
          className="group flex flex-col gap-4 cursor-pointer rounded-lg border border-primary/10 p-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
        >
          <div
            className="flex w-full justify-between items-center"
            onClick={() => setShowMnemonic(!showMnemonic)}
          >
            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter">
              Your Secret Phrase
            </h2>
            <Button
              onClick={() => setShowMnemonic(!showMnemonic)}
              variant="ghost"
            >
              {showMnemonic ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
          </div>
          {showMnemonic && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className="flex flex-col w-full items-center justify-center"
              onClick={() => copyToClipboard(mnemonicWords.join(" "))}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 justify-center w-full items-center mx-auto my-8"
              >
                {mnemonicWords.map((word, index) => (
                  <p
                    key={index}
                    className="md:text-lg bg-foreground/5 hover:bg-foreground/10 transition-all duration-300 rounded-lg p-4"
                  >
                    {word}
                  </p>
                ))}
              </motion.div>
              <div className="text-sm md:text-base text-primary/50 flex w-full gap-2 items-center group-hover:text-primary/80 transition-all duration-300">
                <Copy className="size-4" /> Click Anywhere To Copy
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
