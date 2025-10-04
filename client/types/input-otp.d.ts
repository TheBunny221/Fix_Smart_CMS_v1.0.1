declare module "input-otp" {
  import * as React from "react";

  export interface OTPInputProps
    extends React.HTMLAttributes<HTMLDivElement> {
    containerClassName?: string;
  }

  export interface OTPSlotState {
    char: string;
    hasFakeCaret: boolean;
    isActive: boolean;
  }

  export interface OTPInputContextValue {
    slots: OTPSlotState[];
  }

  export const OTPInput: React.ForwardRefExoticComponent<
    OTPInputProps & React.RefAttributes<HTMLDivElement>
  >;

  export const OTPInputContext: React.Context<OTPInputContextValue>;
}
