import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a consistent color for avatar based on name or email
 * Returns a Tailwind color class for background
 */
export function getAvatarColor(nameOrEmail: string): string {
  if (!nameOrEmail) return 'bg-gray-500';
  
  // Use the string to generate a consistent hash
  let hash = 0;
  const str = nameOrEmail.toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Map hash to one of 8 distinct colors
  const colors = [
    'bg-green-500',   // Green
    'bg-blue-500',    // Blue
    'bg-purple-500',  // Purple
    'bg-pink-500',    // Pink
    'bg-orange-500',  // Orange
    'bg-teal-500',    // Teal
    'bg-indigo-500',  // Indigo
    'bg-red-500',     // Red
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Add cache-busting query parameter to image URLs to ensure fresh images are loaded
 * This prevents browser caching issues when profile pictures are updated
 * The cache buster is based on the URL filename, so it only changes when the URL changes
 */
export function getImageUrlWithCacheBust(url?: string | null): string | undefined {
  if (!url) return undefined;
  // Extract filename from URL to create a stable but unique cache buster
  const filename = url.split('/').pop()?.split('?')[0] || '';
  // Create a simple hash from filename (last 8 chars of filename + length)
  const urlHash = filename.length > 0 ? `${filename.slice(-8)}_${filename.length}` : Date.now().toString();
  
  // Remove existing cache-busting parameter if present
  const baseUrl = url.split('?')[0];
  const existingParams = url.includes('?') ? url.split('?')[1].split('&').filter(p => !p.startsWith('_t=')) : [];
  
  // Add cache buster based on URL
  const cacheBuster = `_t=${urlHash}`;
  const allParams = existingParams.length > 0 ? [...existingParams, cacheBuster].join('&') : cacheBuster;
  return `${baseUrl}?${allParams}`;
}
