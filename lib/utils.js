import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function calculateFee(memberCount) {
  if (process.env.NEXT_PUBLIC_PAYMENT_TEST_AMOUNT) {
    return parseInt(process.env.NEXT_PUBLIC_PAYMENT_TEST_AMOUNT, 10)
  }
  const perPerson = parseInt(process.env.NEXT_PUBLIC_REGISTRATION_FEE_PER_PERSON || '299', 10)
  const fiveMembers = parseInt(process.env.NEXT_PUBLIC_REGISTRATION_FEE_5_MEMBERS || '1299', 10)
  return memberCount === 5 ? fiveMembers : memberCount * perPerson
}

export function generateTeamCode() {
  const chars = 'ACDEFGHJKMNPQRTUVWXY3469'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date) {
  const now = new Date()
  const d = new Date(date)
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}

export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function validateGitHub(url) {
  const regex = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/
  return regex.test(url)
}

export function validateLinkedIn(url) {
  const regex = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/
  return regex.test(url)
}

export function validatePhone(phone) {
  return /^\d{10}$/.test(phone.replace(/\s/g, ''))
}
