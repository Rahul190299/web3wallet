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
  const connection = useSolanaConnection();
  async function sendSol() {
    let bIsValidPubKey = isValidSolanaAddress(receiverPubKey);
    if (bIsValidPubKey == true) {
      const senderKeyPair = Keypair.fromSecretKey(
        bs58.decode(senderPrivateKey),
      );
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderKeyPair.publicKey,
          toPubkey: new PublicKey(receiverPubKey),
          lamports: 0.1 * LAMPORTS_PER_SOL, // sending 0.1 SOL
        }),
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [senderKeyPair],
      );
      console.log("Transaction successful:", signature);
    } else {
      toast.error("Invalid wallet address");
    }

    
  }
  function fnHandleSendClick() {
    sendSol();
  }
  return (
    <Dialog>
      <form className="">
        <DialogTrigger asChild>
          <Button size={"sm"} >
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
              <Input id="name-1" name="name" placeholder="Enter amount" />
            </div>
          </div>
          <DialogFooter className="mt-1">
            <DialogClose asChild>
              <Button variant="outline" size={"sm"}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size={"sm"} onClick={fnHandleSendClick}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
