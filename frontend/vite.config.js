import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

function getProductionSiteOrigin(siteUrl) {
  let url
  try {
    url = new URL(siteUrl)
  } catch {
    throw new Error(
      'Production builds require VITE_SITE_URL or FRONTEND_URL to be a public HTTPS URL.',
    )
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  const isLocalhost =
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '::1' ||
    /^127(?:\.\d{1,3}){3}$/.test(hostname)

  if (url.protocol !== 'https:' || isLocalhost) {
    throw new Error(
      'Production robots.txt requires a public HTTPS VITE_SITE_URL or FRONTEND_URL.',
    )
  }

  return url.origin
}

function robotsTxtPlugin(mode, siteUrl) {
  let outputDir

  return {
    name: 'temox-robots-txt',
    apply: 'build',
    configResolved(config) {
      outputDir = path.resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      if (mode !== 'production') return

      const siteOrigin = getProductionSiteOrigin(siteUrl)
      const robotsTxt = [
        'User-agent: *',
        'Allow: /',
        'Allow: /product/',
        'Allow: /category',
        'Allow: /shop-catalog',
        'Disallow: /admin',
        'Disallow: /login',
        'Disallow: /register',
        'Disallow: /cart',
        'Disallow: /my-orders',
        'Disallow: /wishlist',
        `Sitemap: ${siteOrigin}/sitemap.xml`,
        '',
      ].join('\n')

      await writeFile(path.join(outputDir, 'robots.txt'), robotsTxt, 'utf8')
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'FRONTEND_'])
  const siteUrl =
    env.VITE_SITE_URL ||
    env.FRONTEND_URL ||
    process.env.VITE_SITE_URL ||
    process.env.FRONTEND_URL

  return {
    plugins: [react(), tailwindcss(), robotsTxtPlugin(mode, siteUrl)],
    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
