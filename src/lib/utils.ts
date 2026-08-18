import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function slugifyOrganization(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9가-힣-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
