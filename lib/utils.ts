import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatResponseTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}

export function getResponseTimeColor(seconds: number): string {
  if (seconds <= 30) return "text-green-600"
  if (seconds <= 120) return "text-blue-600"
  if (seconds <= 300) return "text-yellow-600"
  return "text-red-600"
}

export function getResponseTimeBadgeColor(seconds: number): string {
  if (seconds <= 30) return "bg-green-100 text-green-800"
  if (seconds <= 120) return "bg-blue-100 text-blue-800"
  if (seconds <= 300) return "bg-yellow-100 text-yellow-800"
  return "bg-red-100 text-red-800"
}
