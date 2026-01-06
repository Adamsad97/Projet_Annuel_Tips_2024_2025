export default defineEventHandler((event) => {
  const isProduction = process.env.NUXT_PUBLIC_SITE_ENV === 'production';
  const rules = [];

  if (isProduction) {
    rules.push('User-agent: *');
    rules.push('Allow: /');
    rules.push('Disallow: /admin');
    rules.push('Disallow: /profile');
    rules.push('Disallow: /api');
    rules.push('');
    rules.push('Sitemap: https://aideflash.fr/sitemap.xml');
  } else {
    rules.push('User-agent: *');
    rules.push('Disallow: /');
  }

  setResponseHeader(event, 'Content-Type', 'text/plain');
  return rules.join('\n');
});
