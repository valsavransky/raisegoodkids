// Public Privacy Policy and Terms of Service pages, linked from the app, the
// App Store / TestFlight listing and the Google consent screen. The text is
// finalized after legal review: until then each page says so. To publish,
// replace the body strings below with the approved HTML.
import { Router } from 'express';

const PRIVACY_BODY = `<p>This page is being finalized. If you have a question about your information, or want it deleted, email the address in the app's Settings.</p>`;
const TERMS_BODY = `<p>This page is being finalized. Questions? Email the address in the app's Settings.</p>`;

function page(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} — Trekker</title><style>body{font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:720px;margin:0 auto;padding:32px 20px;color:#1c1e21}h1{font-size:26px}</style></head><body><h1>Trekker ${title}</h1>${body}</body></html>`;
}

export const legalRouter = Router();
legalRouter.get('/privacy', (_req, res) => {
  res.type('html').send(page('Privacy Policy', PRIVACY_BODY));
});
legalRouter.get('/terms', (_req, res) => {
  res.type('html').send(page('Terms of Service', TERMS_BODY));
});
