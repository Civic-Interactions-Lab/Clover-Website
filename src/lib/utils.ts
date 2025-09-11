import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * This function combines the clsx and tailwind-merge libraries to create a utility function for conditional class names.
 * It allows you to conditionally apply classes based on if the input is true or not.
 * The twMerge function is used to merge Tailwind CSS classes, resolving any conflicts between them.
 *
 * @param inputs - An array of class names or conditional class names.
 * @returns A string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    result[camelKey] = toCamelCase(value);
  }
  return result;
}

/**
 * Transforms all keys in an object from camelCase to snake_case
 */
export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(
      /[A-Z]/g,
      (letter) => `_${letter.toLowerCase()}`
    );
    result[snakeKey] = toSnakeCase(value);
  }
  return result;
}
