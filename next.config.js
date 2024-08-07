const { THEME } = require('./blog.config')
const fs = require('fs')
const path = require('path')
const BLOG = require('./blog.config')
const { extractLangPrefix } = require('./lib/utils/pageId')

// 打包时是否分析代码
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: BLOG.BUNDLE_ANALYZER
})

// 扫描项目 /themes下的目录名
const themes = scanSubdirectories(path.resolve(__dirname, 'themes'))

// Remove or comment out the locales function
// const locales = (function () {
//   // 根据BLOG_NOTION_PAGE_ID 检查支持多少种语言数据.
//   // 支持如下格式配置多个语言的页面id xxx,zh:xxx,en:xxx
//   const langs = ['zh']
//   if (BLOG.NOTION_PAGE_ID.indexOf(',') > 0) {
//     const siteIds = BLOG.NOTION_PAGE_ID.split(',')
//     for (let index = 0; index < siteIds.length; index++) {
//       const siteId = siteIds[index]
//       const prefix = extractLangPrefix(siteId)
//       // 如果包含前缀 例如 zh , en 等
//       if (prefix) {
//         if (!langs.includes(prefix)) {
//           langs.push(prefix)
//         }
//       }
//     }
//   }
//   return langs
// })()

/**
 * 扫描指定目录下的文件夹名，用于获取所有主题
 * @param {*} directory
 * @returns
 */
function scanSubdirectories(directory) {
  const subdirectories = []

  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file)
    const stats = fs.statSync(fullPath)
    if (stats.isDirectory()) {
      subdirectories.push(file)
    }

    // subdirectories.push(file)
  })

  return subdirectories
}

const nextConfig = {
  images: {
    // 图片压缩
    formats: ['image/avif', 'image/webp'],
    // 允许next/image加载的图片 域名
    domains: [
      'gravatar.com',
      'www.notion.so',
      'avatars.githubusercontent.com',
      'images.unsplash.com',
      'source.unsplash.com',
      'p1.qhimg.com',
      'webmention.io',
      'ko-fi.com'
    ]
  },

  // 默认将feed重定向至 /public/rss/feed.xml
  async redirects() {
    return [
      {
        source: '/feed',
        destination: '/rss/feed.xml',
        permanent: true
      }
    ]
  },
  // Remove the i18n configuration
  // i18n: process.env.npm_lifecycle_event === 'export'
  //   ? undefined
  //   : {
  //       defaultLocale: BLOG.LANG.slice(0, 2),
  //       locales
  //     },
  // Modify the rewrites function to remove language-related rewrites
  async rewrites() {
    return [
      // Remove langsRewrites
      // ...langsRewrites,
      // Keep the HTML rewrite
      {
        source: '/:path*.html',
        destination: '/:path*'
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*{/}?',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          }
        ]
      }
    ]
  },
  webpack: (config, { dev, isServer }) => {
    // 动态主题：添加 resolve.alias 配置，将动态路径映射到实际路径
    if (!isServer) {
      console.log('[默认主题]', path.resolve(__dirname, 'themes', THEME))
    }
    config.resolve.alias['@theme-components'] = path.resolve(
      __dirname,
      'themes',
      THEME
    )
    return config
  },
  experimental: {
    scrollRestoration: true
  },
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    // export 静态导出时 忽略/pages/sitemap.xml.js ， 否则和getServerSideProps这个动态文件冲突
    const pages = { ...defaultPathMap }
    delete pages['/sitemap.xml']
    return pages
  },
  publicRuntimeConfig: {
    // 这里的配置既可以服务端获取到，也可以在浏览器端获取到
    NODE_ENV_API: process.env.NODE_ENV_API || 'prod',
    THEMES: themes
  }
}

module.exports = withBundleAnalyzer(nextConfig)