// middleware.ts / middleware.js
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './next-intl.config';

const handleI18n = createIntlMiddleware(routing);

export function middleware(req) {
  // 1) Normaliser l’URL avec la locale (ex: /login -> /fr/login)
  const i18nResponse = handleI18n(req);
  const url = i18nResponse?.nextUrl ?? req.nextUrl;

  const { pathname } = url;
  const locale = pathname.split('/')[1] || routing.defaultLocale; // fr | en | ar

  // 2) Auth
  const token = req.cookies.get('token')?.value;
  const role  = req.cookies.get('role')?.value;

  const isProtected =
    pathname.startsWith(`/${locale}/admin`) ||
    pathname.startsWith(`/${locale}/client`);

  if (isProtected && !token) {
    return NextResponse.redirect(new URL(`/${locale}/login`, url));
  }

  if (pathname.startsWith(`/${locale}/admin`) && role !== 'admin') {
    return NextResponse.redirect(new URL(`/${locale}/unauthorized`, url));
  }

  if (pathname.startsWith(`/${locale}/client`) && role !== 'client') {
    return NextResponse.redirect(new URL(`/${locale}/unauthorized`, url));
  }

  // 3) Continuer
  return i18nResponse;
}

export const config = {
  matcher: [
    '/',                      // racine
    '/(fr|en|ar)/:path*',     // avec locale
    '/((?!fr|en|ar|api|_next|.*\\..*).*)' // sans locale -> i18n la rajoute
  ]
};
