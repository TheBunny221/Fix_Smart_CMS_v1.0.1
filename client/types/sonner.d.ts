declare module "sonner" {
  import * as React from "react";

  export interface ToasterProps extends React.ComponentPropsWithoutRef<"div"> {
    theme?: "light" | "dark" | "system" | string;
    toastOptions?: {
      classNames?: Record<string, string>;
    };
  }

  export const Toaster: React.FC<ToasterProps>;
  export { Toaster as Sonner };
}
