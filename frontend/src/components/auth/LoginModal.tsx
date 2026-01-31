import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation('auth');

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
          <DialogTitle className="text-2xl font-semibold">{t('modal.title')}</DialogTitle>
          <DialogDescription className="text-base">
            {t('modal.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            onClick={handleLogin}
            className="w-full gap-2 h-12 text-base"
            size="lg"
          >
            <LogIn className="h-5 w-5" />
            {t('modal.signIn')}
          </Button>
          <Button
            onClick={handleRegister}
            variant="outline"
            className="w-full gap-2 h-12 text-base"
            size="lg"
          >
            <UserPlus className="h-5 w-5" />
            {t('modal.createAccount')}
          </Button>
        </div>
        <DialogFooter className="text-sm text-muted-foreground">
          {t('login.termsAgreement')}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
