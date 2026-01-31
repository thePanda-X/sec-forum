import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { translateApiKey } from "@/i18n";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation(['auth', 'errors']);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success(t('auth:toast.loginSuccess'), {
        description: t('auth:toast.loginSuccessDesc'),
      });
      navigate("/");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "error.invalidCredentials";
      toast.error(t('auth:toast.loginFailed'), {
        description: translateApiKey(errorMessage),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 mb-3 md:mb-4">
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{t('auth:login.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1 md:mt-2">
            {t('auth:login.subtitle')}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                {t('auth:login.email')}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth:login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                {t('auth:login.password')}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth:login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm flex-wrap gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border bg-background"
                />
                <span className="text-muted-foreground">{t('auth:login.rememberMe')}</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-primary hover:underline"
              >
                {t('auth:login.forgotPassword')}
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('auth:login.signingIn')}
                </>
              ) : (
                t('auth:login.signIn')
              )}
            </Button>
          </form>

          <div className="mt-4 md:mt-6 text-center text-sm text-muted-foreground">
            {t('auth:login.noAccount')}{" "}
            <Link to="/register" className="text-primary hover:underline">
              {t('auth:login.createOne')}
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4 md:mt-6 px-2">
          {t('auth:login.termsAgreement')}
        </p>
      </div>
    </div>
  );
}
