import { useEffect, useState } from 'react';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<'eca-light' | 'eca-dark'>('eca-light');

  useEffect(() => {
    // Check if user has a theme preference in localStorage
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'eca-dark') {
      setTheme('eca-dark');
      document.documentElement.classList.add('eca-dark');
      document.documentElement.classList.remove('eca-light');
    } else {
      setTheme('eca-light');
      document.documentElement.classList.add('eca-light');
      document.documentElement.classList.remove('eca-dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'eca-light' ? 'eca-dark' : 'eca-light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);
  };

  return (
    <div className="hidden sm:block" data-testid="theme-switcher">
      <button
        className="justify-center whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 space-x-2 hover:border-1 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground focus:ring-ring border-default-transparent relative inline-flex w-auto items-center rounded-full border p-2 font-medium focus:z-10 focus:outline-none focus:ring-offset-2"
        type="button"
        onClick={toggleTheme}
      >
        <div>
          {theme === 'eca-light' ? (
            <svg
              className="text-muted-foreground size-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
              />
            </svg>
          ) : (
            <svg
              className="text-muted-foreground size-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              />
            </svg>
          )}
        </div>
      </button>
    </div>
  );
}
