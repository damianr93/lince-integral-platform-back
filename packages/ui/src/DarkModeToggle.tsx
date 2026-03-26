import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export const THEME_STORAGE_KEY = 'lince-theme';

export function DarkModeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const legacy = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (legacy && !localStorage.getItem(THEME_STORAGE_KEY)) {
      localStorage.setItem(THEME_STORAGE_KEY, legacy);
    }
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved ?? (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
      className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
