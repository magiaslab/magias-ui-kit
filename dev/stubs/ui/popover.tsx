// Solo per il controllo dei tipi del kit: nel progetto si usano i componenti shadcn veri.
import type { ComponentProps, ReactNode } from "react";

type Padding = number | Partial<Record<"top" | "right" | "bottom" | "left", number>>;

export declare function Popover(props: { open?: boolean; onOpenChange?: (open: boolean) => void; children?: ReactNode }): ReactNode;
export declare function PopoverTrigger(props: { asChild?: boolean; children?: ReactNode }): ReactNode;
export declare function PopoverContent(
  props: ComponentProps<"div"> & { align?: "start" | "center" | "end"; collisionPadding?: Padding; "data-lenis-prevent"?: boolean },
): ReactNode;
