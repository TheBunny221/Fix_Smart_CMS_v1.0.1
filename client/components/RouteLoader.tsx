import { Loader2 } from "lucide-react";
import React from "react";

export const RouteLoader: React.FC = () => (
  <div className="flex min-h-[200px] w-full items-center justify-center py-10">
    <div className="flex items-center space-x-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Loading...</span>
    </div>
  </div>
);

export default RouteLoader;
