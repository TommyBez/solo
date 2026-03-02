import type { MetadataRoute } from 'next'

const siteUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

const routes = [
  '',
  '/sign-in',
  '/sign-up',
  '/areas',
  '/projects',
  '/time',
  '/clients',
  '/invoices',
  '/settings',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.7,
  }))
}
