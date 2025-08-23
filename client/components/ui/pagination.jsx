import * from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { ButtonProps, buttonVariants } from "@/components/ui/button";

const Pagination = ({ className, ...props }) => (
  
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef
>(({ className, ...props }, ref) => (
  
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef
>(({ className, ...props }, ref) => (
  
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?;
} & Pick &
  React.ComponentProps;

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}) => (
  
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
  className,
  ...props
}) => (
  
    
    Previous
  
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  ...props
}) => (
  
    Next
    
  
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
  className,
  ...props
}) => (
  
    
    More pages
  
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
