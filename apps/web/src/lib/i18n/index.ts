export { default as thMessages } from './th.json'
export { default as enMessages } from './en.json'

export type Locale = 'th' | 'en'
export const defaultLocale: Locale = 'th'
export const locales: Locale[] = ['th', 'en']
