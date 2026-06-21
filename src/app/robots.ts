import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/checkout', '/carro', '/pedido'],
    },
    sitemap: 'https://www.tenute.cl/sitemap.xml',
  };
}
