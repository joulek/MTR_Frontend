// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
  // Chemin vers ton fichier de routing
  routing: './next-intl.config.ts',

  // Chemin vers ton fichier de config i18n request
  i18n: './i18n/request.ts'
});

export default withNextIntl({
  // Autre config Next.js si besoin
});
