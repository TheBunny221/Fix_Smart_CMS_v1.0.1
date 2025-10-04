declare module "cmdk" {
  import * as React from "react";

  type DivProps = React.ComponentPropsWithoutRef<"div">;
  type InputProps = React.ComponentPropsWithoutRef<"input">;

  type CommandSubComponent = React.ForwardRefExoticComponent<
    DivProps & React.RefAttributes<HTMLDivElement>
  >;

  interface CommandComponent
    extends React.ForwardRefExoticComponent<
      DivProps & React.RefAttributes<HTMLDivElement>
    > {
    Input: React.ForwardRefExoticComponent<
      InputProps & React.RefAttributes<HTMLInputElement>
    >;
    List: CommandSubComponent;
    Empty: CommandSubComponent;
    Group: CommandSubComponent;
    Item: CommandSubComponent;
    Separator: CommandSubComponent;
  }

  export const Command: CommandComponent;
}
