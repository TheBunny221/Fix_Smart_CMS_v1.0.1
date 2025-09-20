declare module "next-themes" {
  export interface UseThemeResult {
    theme?: string;
    resolvedTheme?: string;
    setTheme(theme: string): void;
    systemTheme?: string;
  }

  export function useTheme(): UseThemeResult;
}
