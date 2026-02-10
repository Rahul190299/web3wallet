import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { derivePath } from "ed25519-hd-key";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import { ethers } from "ethers";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { Keypair, PublicKey } from "@solana/web3.js";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { useSolanaConnection } from "@/lib/SolanaConnectionContext";
import { useSolanaBalances } from "@/lib/useSolanaBalances";

interface Wallet {
  publicKey: string;
  privateKey: string;
  mnemonic: string;
  path: string;
}
const GAP_LIMIT = 10; // Phantom-like
const MAX_SCAN = 20; // safety cap (important)

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
  

  const { balances, loading, error, refreshBalances } =
    useSolanaBalances(wallets,pathTypes);
    console.log(balances);
  // useEffect(()=> {
  //   refreshBalances();
  // },[refreshBalances])
  const connection = useSolanaConnection();
  const copyToClipboard = (mnemonic: string) => {};
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
  const handleAddWallet = () => {
    if (!mnemonicWords) {
      toast.error("No mnemonic found. Please generate a wallet first.");
      return;
    }
    const wallet = generateWalletFromMnemonic(
      pathTypes[0],
      mnemonicWords.join(" "),
      wallets.length,
    );
    if (wallet) {
      const updatedWallets = [...wallets, wallet];
      const updatedPathType = [pathTypes, pathTypes];
      setWallets(updatedWallets);
      localStorage.setItem("wallets", JSON.stringify(updatedWallets));
      localStorage.setItem("pathTypes", JSON.stringify(updatedPathType));
      setVisiblePrivateKeys([...visiblePrivateKeys, false]);
      setVisiblePhrases([...visiblePhrases, false]);
      toast.success("Wallet generated successfully!");
    }
  };
  const handleClearWallets = () => {};
  const handleDeleteWallet = (index: number) => {};
  const togglePrivateKeyVisibility = (index: number) => {};
  function handleGenerateWallet() {
    let bUserEnteredMnemonic = false;
    let mnemonic = mnemonicInput.trim();
    if (mnemonic) {
      if (!validateMnemonic(mnemonic)) {
        toast.error("Invalid recovery phrase. Please try again.");
        return;
      } else {
        bUserEnteredMnemonic = true;
      }
    } else {
      mnemonic = generateMnemonic();
    }
    const words = mnemonic.split(" ");
    setMnemonicWords(words);
    if (bUserEnteredMnemonic == true) {
      generateWalletsOnBasisOfFunds(mnemonic);
    } else {
      const wallet = generateWalletFromMnemonic(
        pathTypes[0],
        mnemonic,
        wallets.length,
      );
      if (wallet) {
        const updatedWallets = [...wallets, wallet];
        setWallets(updatedWallets);
        localStorage.setItem("wallets", JSON.stringify(updatedWallets));
      }
    }
    localStorage.setItem("mnemonics", JSON.stringify(words));
    localStorage.setItem("paths", JSON.stringify(pathTypes));
    setVisiblePrivateKeys([...visiblePrivateKeys, false]);
    setVisiblePhrases([...visiblePhrases, false]);
    toast.success("Wallet generated successfully!");
  }
  const generateWalletsOnBasisOfFunds = async (mnemonic: string) => {
    let emptyCount = 0;
    let index = 0;
    let walletsWithBalance : Wallet[] = [];
    while (emptyCount < GAP_LIMIT && index < MAX_SCAN) {
      const wallet = generateWalletFromMnemonic(pathTypes[0], mnemonic, index);

      // const balance = await connection.getBalance(keypair.publicKey);
      // const txs = await connection.getSignaturesForAddress(keypair.publicKey, {
      //   limit: 1,
      // });
      if (wallet) {
        const keypair = Keypair.fromSecretKey(bs58.decode(wallet.privateKey));
        const accInfo = await connection.getAccountInfo(keypair.publicKey);
        if (accInfo) {
          emptyCount = 0;
          walletsWithBalance.push(wallet);
          
          //console.log(`Account ${index} USED`);
        } else {
          emptyCount++;
          //console.log(`Account ${index} empty (${emptyCount})`);
        }
        setWallets(prev => [...prev, wallet]);
      }

      index++;
    }
    //setWallets(prev => [...prev,...walletsWithBalance]);
  };
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
      {/* Display wallet pairs */}
      {wallets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="flex flex-col gap-8 mt-6"
        >
          <div className="flex md:flex-row flex-col justify-between w-full gap-4 md:items-center">
            <h2 className="tracking-tighter text-3xl md:text-4xl font-extrabold">
              {pathTypes[0] === "60" ? "Ethereum" : "Solana"} Wallet
            </h2>
            <div className="flex gap-2">
              {wallets.length > 1 && (
                <Button
                  variant={"ghost"}
                  onClick={() => setGridView(!gridView)}
                  className="hidden md:block"
                >
                  {gridView ? <Grid2X2 /> : <List />}
                </Button>
              )}
              <Button onClick={() => handleAddWallet()}>Add Wallet</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="self-end">
                    Clear Wallets
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to delete all wallets?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your wallets and keys from local storage.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleClearWallets()}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div
            className={`grid gap-6 grid-cols-1 col-span-1  ${
              gridView ? "md:grid-cols-2 lg:grid-cols-3" : ""
            }`}
          >
            {wallets.map((wallet: Wallet, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.3 + index * 0.1,
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                className="flex flex-col rounded-2xl border border-primary/10"
              >
                <div className="flex justify-between px-8 py-6">
                  <h3 className="font-bold text-2xl md:text-3xl tracking-tighter ">
                    Wallet {index + 1}
                  </h3>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex gap-2 items-center"
                      >
                        <Trash className="size-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you sure you want to delete all wallets?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete your wallets and keys from local storage.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteWallet(index)}
                          className="text-destructive"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="flex flex-col gap-8 px-8 py-4 rounded-2xl bg-secondary/50">
                  <div
                    className="flex flex-col w-full gap-2"
                    onClick={() => copyToClipboard(wallet.publicKey)}
                  >
                    <span className="text-lg md:text-xl font-bold tracking-tighter">
                      Public Key {loading ? "Loading solana balence" : balances[wallet.publicKey] }
                    </span>
                    <p className="text-primary/80 font-medium cursor-pointer hover:text-primary transition-all duration-300 truncate">
                      {wallet.publicKey}
                    </p>
                    
                  </div>
                  <div>
                    <span className="text-lg md:text-xl font-bold tracking-tighter">
                      Private Key
                    </span>
                    <div className="flex justify-between">
                      <p
                        onClick={() => copyToClipboard(wallet.privateKey)}
                        className="text-primary/80 font-medium 
                    cursor-pointer hover:text-primary 
                    transition-all duration-300 truncate"
                      >
                        {visiblePrivateKeys[index]
                          ? wallet.privateKey
                          : "•".repeat(wallet.mnemonic.length)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => togglePrivateKeyVisibility(index)}
                    >
                      {visiblePrivateKeys[index] ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
