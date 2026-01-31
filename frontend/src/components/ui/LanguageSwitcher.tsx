import React from 'react';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Button } from './button';
import { useLanguage } from '../../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, LANGUAGE_FLAGS, type SupportedLanguage } from '../../i18n';
import { cn } from '../../lib/utils';

interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export function LanguageSwitcher({ 
  variant = 'ghost', 
  size = 'sm',
  showLabel = false,
  className 
}: LanguageSwitcherProps) {
  const { language, setLanguage, isLoading } = useLanguage();

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    if (lang !== language) {
      await setLanguage(lang);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={cn('gap-2', className)}
          disabled={isLoading}
        >
          <Globe className="h-4 w-4" />
          {showLabel && (
            <span className="hidden sm:inline">
              {LANGUAGE_FLAGS[language]} {LANGUAGE_NAMES[language]}
            </span>
          )}
          {!showLabel && (
            <span className="text-xs font-medium uppercase">
              {language}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={cn(
              'cursor-pointer gap-2',
              language === lang && 'bg-accent'
            )}
          >
            <span>{LANGUAGE_FLAGS[lang]}</span>
            <span>{LANGUAGE_NAMES[lang]}</span>
            {language === lang && (
              <span className="ml-auto text-xs text-muted-foreground">
                ✓
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
