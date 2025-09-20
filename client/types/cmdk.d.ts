declare module "cmdk" {
  import * as React from "react";

  export interface CommandProps extends React.ComponentPropsWithoutRef<"div"> {}
  export const Command: React.FC<CommandProps> & {
    Input: React.FC<React.ComponentPropsWithoutRef<"input">>;
    List: React.FC<React.ComponentPropsWithoutRef<"div">>;
    Empty: React.FC<React.ComponentPropsWithoutRef<"div">>;
    Group: React.FC<React.ComponentPropsWithoutRef<"div">>;
    Item: React.FC<React.ComponentPropsWithoutRef<"div">>;
    Separator: React.FC<React.ComponentPropsWithoutRef<"div">>;
  };
}
