import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Ưu tiên biến môi trường, nếu không có thì dùng tên miền chính thức của website
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kdcl.nsgpc.edu.vn'

  const routes = [
    '', // Trang chủ
    '/login',
    '/admin',
    '/admin/statistics',
    '/admin/criteria',
    '/admin/users',
    '/admin/categories',
    '/admin/logs',
    '/admin/settings',
    '/supervisor',
    '/supervisor/statistics',
    '/supervisor/criteria',
    '/supervisor/categories',
    '/supervisor/evidence',
    '/supervisor/review',
    '/collaborator',
    '/collaborator/statistics',
    '/collaborator/evidence',
    '/investigator',
    '/investigator/evidence',
    '/investigator/evaluate',
    '/messages',
    '/profile'
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }))
}
