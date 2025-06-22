import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Also, maybe i can load the selector/models from another component / array so i can easily configure it and to so i can easily add models later. review and advise also
