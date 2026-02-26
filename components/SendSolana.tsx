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

export function SendSolana() {
  return (
    <Dialog>
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
              Enter the recipient’s wallet address and the amount of SOL you want to send.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-1">
            <div className="flex flex-col gap-2">
              <Input id="name-1" name="name" placeholder="Enter address" />
              <Input id="name-1" name="name" placeholder="Enter amount" />
            </div>
            
          </div>
          <DialogFooter className="mt-1">
            <DialogClose asChild>
              <Button variant="outline" size={"sm"}>Cancel</Button>
            </DialogClose>
            <Button type="submit" size={"sm"}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
