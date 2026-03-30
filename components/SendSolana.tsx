import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowUpIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  PublicKey,
  LAMPORTS_PER_SOL,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { useSolanaConnection } from "../lib/SolanaConnectionContext";
import { useState } from "react";
import bs58 from "bs58";
import { toast } from "sonner";
import { number } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";

function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch (err) {
    return false;
  }
}
export function SendSolana({ senderPrivateKey }: { senderPrivateKey: string }) {
  const [receiverPubKey, setReceiverPubKey] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [sendingSol, setSendingSol] = useState(false);
  const connection = useSolanaConnection();
  async function sendSol() {
    setSendingSol(true);
    let transferAmount = number.parse(amount);
    let bIsValidPubKey = isValidSolanaAddress(receiverPubKey);
    if (bIsValidPubKey == true) {
      const senderKeyPair = Keypair.fromSecretKey(
        bs58.decode(senderPrivateKey),
      );
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderKeyPair.publicKey,
          toPubkey: new PublicKey(receiverPubKey),
          lamports: transferAmount * LAMPORTS_PER_SOL, // sending 0.1 SOL
        }),
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [senderKeyPair],
      );
      toast.success(`Transaction successful : ${signature}`);
      setOpen(false);
      console.log("Transaction successful:", signature);
    } else {
      toast.error("Invalid wallet address");
    }
    setSendingSol(false);
  }
  function fnHandleSendClick() {
    sendSol();
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form className="">
        <DialogTrigger asChild>
          <Button size={"sm"}>
            Send <ArrowUpIcon />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send SOL</DialogTitle>
            <DialogDescription>
              Enter the recipient’s wallet address and the amount of SOL you
              want to send.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-1">
            <div className="flex flex-col gap-2">
              <Input
                id="name-1"
                name="name"
                onChange={(e) => setReceiverPubKey(e.target.value)}
                placeholder="Enter address"
              />
              <Input
                id="name-1"
                name="name"
                placeholder="Enter amount"
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-1">
            <DialogClose asChild>
              <Button variant="outline" size={"sm"}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size={"sm"} onClick={fnHandleSendClick}>
              {sendingSol ? (
                <>
                  <Spinner data-icon="inline-start" />
                  <span>Sending solana...</span>
                </>
              ) : (
                <>Send</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
