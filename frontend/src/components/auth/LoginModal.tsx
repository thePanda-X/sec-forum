import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onOpenChange(false);
    navigate("/login");
  };

  const handleRegister = () => {
    onOpenChange(false);
    navigate("/register");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <DialogHeader className="pt-8">
          <DialogTitle className="text-2xl font-semibold">Sign In Required</DialogTitle>
          <DialogDescription className="text-base">
            You need to be signed in to interact with posts. Join our community to start participating.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            onClick={handleLogin}
            className="w-full gap-2 h-12 text-base"
            size="lg"
          >
            <LogIn className="h-5 w-5" />
            Sign In
          </Button>
          <Button
            onClick={handleRegister}
            variant="outline"
            className="w-full gap-2 h-12 text-base"
            size="lg"
          >
            <UserPlus className="h-5 w-5" />
            Create Account
          </Button>
        </div>
        <DialogFooter className="text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
