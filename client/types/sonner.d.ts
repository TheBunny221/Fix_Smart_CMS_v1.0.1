declare module "sonner" {
  import * as React from "react";

  export type SonnerTheme = "light" | "dark" | "system" | (string & {});

  export interface ToasterProps
    extends React.HTMLAttributes<HTMLDivElement> {
    theme?: SonnerTheme | undefined;
    toastOptions?: Record<string, unknown> | undefined;
  }

  export const Toaster: React.ForwardRefExoticComponent<
    ToasterProps & React.RefAttributes<HTMLDivElement>
  >;

  export { Toaster as Sonner };
}
