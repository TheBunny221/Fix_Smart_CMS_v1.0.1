declare module "input-otp" {
  import * as React from "react";

  export interface OTPInputProps
    extends React.ComponentPropsWithoutRef<"div"> {
    maxLength?: number;
    onChange?(value: string): void;
    value?: string;
  }

  export interface OTPInputElementContextValue {
    otp: string;
    setOtp: (value: string) => void;
  }

  export const OTPInput: React.FC<OTPInputProps> & {
    Group: React.FC<React.ComponentPropsWithoutRef<"div">>;
    Slot: React.FC<React.ComponentPropsWithoutRef<"input">>;
  };

  export const OTPInputContext: React.Context<OTPInputElementContextValue | undefined>;
}
