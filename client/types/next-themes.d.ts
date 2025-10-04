declare module "next-themes" {
  interface UseThemeResult {
    theme?: string;
    setTheme: (theme: string) => void;
    resolvedTheme?: string;
    systemTheme?: string;
  }

  export function useTheme(): UseThemeResult;
}
