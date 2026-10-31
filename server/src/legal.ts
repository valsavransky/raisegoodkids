// Public Privacy Policy and Terms of Service pages, linked from the app, the
// App Store / TestFlight listing and the Google consent screen. The text comes
// from the reviewed draft ("Trekker Privacy Policy and Terms"); to change it,
// edit the body strings below.
import { Router } from 'express';

const PRIVACY_BODY = String.raw`
<p class="meta">Effective October 31, 2026</p>
<p><strong>Trekker</strong> is operated by Valerie Savransky (&ldquo;we&rdquo;, &ldquo;us&rdquo;), a sole proprietor. Contact: <a href="mailto:valsavransky@gmail.com">valsavransky@gmail.com</a>.</p>
<p>Trekker helps parents track their children&rsquo;s household responsibilities and savings goals. This policy explains what we collect, why, who we share it with, and the choices you have. Trekker is for parents and guardians. A child uses it on a parent&rsquo;s device, with the parent. We do not knowingly collect information directly from children.</p>

<h2>1. What we collect</h2>
<h3>Information you give us</h3>
<ul>
<li><strong>Account:</strong> your email address and password. If you sign in with Google, we receive your Google email address, verified by Google. Before you sign up, the app creates an account for you with randomly generated credentials so your data can back up.</li>
<li><strong>Your child&rsquo;s profile:</strong> the name, avatar, birthday, grade and optional household details (such as whether you have a yard, a car or a pet, and a pet&rsquo;s type and name) that you enter. We use the birthday for a birthday celebration in the app and to keep suggestions fitting as your child grows.</li>
<li><strong>Family information:</strong> schedule events, Expected activities, gigs, goals, Future Fund settings and balances, check-offs, badges and excused days that you or your child enter in the app.</li>
<li><strong>Feedback:</strong> anything you choose to send through Send feedback, with an optional contact line.</li>
</ul>
<h3>Information from Google Calendar (only if you connect it)</h3>
<p>With your permission, Trekker reads event titles and times from the calendar you choose, so it can suggest activities. It has read-only access. It does not change, add or delete calendar events. Your Google sign-in token is stored on your phone and is not sent to our servers. You can remove Trekker&rsquo;s access at any time at <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.</p>
<h3>Information collected automatically</h3>
<ul>
<li><strong>Anonymous usage counts:</strong> a random install ID that is not linked to your name or email, the names of actions taken in the app (for example, &ldquo;activity checked off&rdquo;), a few coarse details (a screen name, a grade, a count, a percentage), the app version and your phone&rsquo;s platform. We never record names, emails, birthdays or anything you type in these counts. You can turn this off in Settings, under &ldquo;Share anonymous usage&rdquo;.</li>
<li><strong>App delivery:</strong> our update provider (Expo) receives standard technical details, such as app version and device type, when your app checks for updates.</li>
</ul>
<h3>What stays on your phone</h3>
<ul>
<li>Photos you attach to a goal are stored on your phone only and are never uploaded.</li>
<li>Reminder notifications are scheduled on your phone. We do not collect notification tokens.</li>
</ul>

<h2>2. How we use it</h2>
<ul>
<li>To run the app: show your family&rsquo;s activities, goals and progress, and back them up so you can restore them on a new phone.</li>
<li>To suggest age-appropriate activities and goals, based on the grade and household details you enter.</li>
<li>To keep the app working and improve it, using the anonymous counts and the feedback you send.</li>
<li>To respond to you when you contact us.</li>
</ul>
<p>We do not sell your information. We do not show advertising. We do not use your child&rsquo;s information to build advertising profiles.</p>

<h2>3. Who we share it with</h2>
<p>We share information only with service providers that help us run Trekker, under their own terms:</p>
<table>
<tr><th>Provider</th><th>What it does</th><th>What it may receive</th></tr>
<tr><td>Railway</td><td>Hosts our server and database</td><td>Your account and family data</td></tr>
<tr><td>Expo</td><td>Builds the app and delivers updates</td><td>App version and device details</td></tr>
<tr><td>Google</td><td>Sign-in and, if you connect it, Calendar</td><td>Your Google account information, as you authorize</td></tr>
<tr><td>Apple and Google Play</td><td>App distribution and testing</td><td>Information they collect under their own policies</td></tr>
</table>
<p>We may also disclose information if required by law, or to protect the rights, safety or property of our users or others. If Trekker is ever sold or merged, your information may transfer to the new owner, who must honor this policy.</p>

<h2>4. Children</h2>
<p>Trekker is intended for use by parents and guardians. A parent creates the account and provides any information about their child. We do not knowingly collect personal information directly from a child under 13. If you believe a child has given us information without a parent&rsquo;s involvement, contact us at <a href="mailto:valsavransky@gmail.com">valsavransky@gmail.com</a> and we will delete it.</p>

<h2>5. How long we keep it</h2>
<p>We keep your information while your account exists. You can delete your account and all of its data at any time (see section 6). Deleting from inside the app removes your data from our database right away. If you ask us by email, we delete it from our database within 30 days of your request. We do not keep separate backup copies of the database at this time, so deleted data is not retained in backups.</p>

<h2>6. Your choices and rights</h2>
<ul>
<li><strong>Access and correction:</strong> you can view and edit your child&rsquo;s profile and family information in the app.</li>
<li><strong>Deletion:</strong> in the app, go to Settings &rarr; Account &rarr; Delete my account and data. You can also email <a href="mailto:valsavransky@gmail.com">valsavransky@gmail.com</a> and we will delete your account and all of its data.</li>
<li><strong>Usage counts:</strong> turn off &ldquo;Share anonymous usage&rdquo; in Settings.</li>
<li><strong>Google Calendar:</strong> disconnect at <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.</li>
<li><strong>Rights requests:</strong> you may ask what personal information we hold about you, to receive a copy, to correct it, or to delete it. We do not sell personal information or share it for advertising, and we will not treat you differently for making a request. California residents have these rights. To make a request, contact us at <a href="mailto:valsavransky@gmail.com">valsavransky@gmail.com</a>.</li>
</ul>
<p><strong>Do Not Track.</strong> Trekker does not track you across other companies&rsquo; apps or websites, so it does not respond to &ldquo;Do Not Track&rdquo; signals.</p>

<h2>7. Security</h2>
<p>Data is sent over encrypted connections. Passwords are stored in hashed form, not in plain text. No system is perfectly secure, so we cannot guarantee absolute security. If a breach affects your information, we will notify you as the law requires.</p>

<h2>8. Where data is processed</h2>
<p>Trekker is offered to users in the United States. Our providers may process data in the United States and other countries.</p>

<h2>9. Changes</h2>
<p>We may update this policy. If we make a material change, we will tell you in the app or by email before it takes effect. The effective date at the top shows the latest version.</p>

<h2>10. Contact</h2>
<p>Valerie Savransky, <a href="mailto:valsavransky@gmail.com">valsavransky@gmail.com</a>.</p>
`;

const TERMS_BODY = String.raw`
<p class="meta">Effective October 31, 2026</p>
<p>These terms are an agreement between you and Valerie Savransky (&ldquo;we&rdquo;, &ldquo;us&rdquo;) about your use of the Trekker app and related services (the &ldquo;Service&rdquo;). By creating an account or using the Service, you agree to them and to our <a href="/privacy">Privacy Policy</a>. You accept them by tapping to continue on the sign-up screen, where you also confirm that you are the child&rsquo;s parent or guardian. If you do not agree, do not use Trekker.</p>

<h2>1. Who may use Trekker</h2>
<p>You must be at least 18 (or the age of majority where you live) and a parent or legal guardian of the child whose profile you create. Trekker is for parents. A child may use the app only on your device and under your supervision. You are responsible for everything that happens under your account.</p>

<h2>2. What Trekker is, and is not</h2>
<p>Trekker is a household tool for tracking a child&rsquo;s everyday responsibilities (&ldquo;Expected&rdquo; activities), optional jobs (&ldquo;Gigs&rdquo;) and savings goals. It is not a bank, payment service or financial product.</p>
<ul>
<li><strong>No real money moves through Trekker.</strong> Dollar amounts, goal progress and the &ldquo;Future Fund&rdquo; are records you keep. Paying a child, buying a goal, or investing money is done by you, outside the app.</li>
<li><strong>Not financial, legal, tax or investment advice.</strong> Any educational content about saving or investing is general information only.</li>
<li><strong>Suggestions are starting points.</strong> Suggested activities, gigs and goals are based on a grade level and what you enter. You decide what is right and safe for your child.</li>
</ul>

<h2>3. Safety and supervision</h2>
<p>Chores and jobs can involve risk, such as using appliances, tools, ladders, the kitchen, or the outdoors. You are responsible for deciding which activities are suitable for your child&rsquo;s age and ability, for supervising them, and for the safety of the household. We are not responsible for any injury, damage or loss that happens while a child does an activity listed in or suggested by Trekker.</p>

<h2>4. Your account</h2>
<p>Give accurate information and keep your password and device secure. Tell us promptly at <a href="mailto:valsavransky@gmail.com">valsavransky@gmail.com</a> if you think someone else has used your account. You may delete your account at any time in the app (Settings &rarr; Account &rarr; Delete my account and data) or by contacting us.</p>

<h2>5. Your content</h2>
<p>You keep ownership of the information you enter (your family&rsquo;s activities, goals and feedback). You give us a limited, non-exclusive license to store, process and display it as needed to run and improve the Service. We do not sell it, and we handle it as described in the Privacy Policy. If you send us feedback or suggestions, we may use them without obligation to you.</p>

<h2>6. Acceptable use</h2>
<p>Do not misuse the Service. For example, do not break the law with it, interfere with or attempt to gain unauthorized access to our systems, copy or reverse engineer the app except where the law allows, or use it to harass anyone or to collect information about people other than your own family.</p>

<h2>7. Third-party services</h2>
<p>Trekker works with services we do not control, including Google (sign-in and Calendar), Apple, Google Play and our hosting providers. Their own terms and privacy policies apply to your use of them. If you install Trekker on an iPhone, Apple&rsquo;s standard license agreement for apps also applies. If you connect Google Calendar, you can remove access at any time in your Google account.</p>

<h2>8. Beta and changes to the Service</h2>
<p>Trekker is in testing. Features may change, break or be removed, and data may occasionally be lost. Keep your own copy of anything important. We may update, suspend or discontinue any part of the Service, and will try to give notice of major changes. We may release app updates that install automatically.</p>

<h2>9. Ending your use</h2>
<p>You can stop using Trekker at any time. We may suspend or end your access if you break these terms or use the Service in a way that could harm others or us. Sections that by their nature should continue (such as ownership, disclaimers, and limits of liability) will continue after your access ends.</p>

<h2>10. Disclaimers</h2>
<p>The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose and non-infringement, to the fullest extent the law allows. We do not promise the Service will be uninterrupted, error-free or secure, or that it will produce any particular result for your child&rsquo;s behavior or finances.</p>

<h2>11. Limit of liability</h2>
<p>To the fullest extent the law allows, we are not liable for indirect, incidental, special, consequential or punitive damages, or for lost data, profits or goodwill. Our total liability for any claim relating to the Service is limited to the greater of the amount you paid us in the last 12 months or $100. Some places do not allow these limits, so they may not apply to you.</p>

<h2>12. Indemnity</h2>
<p>You agree to cover our reasonable costs if a third party brings a claim against us because you broke these terms or misused the Service.</p>

<h2>13. Governing law and disputes</h2>
<p>These terms are governed by the laws of California, without regard to conflict-of-law rules. Disputes will be handled in the state or federal courts located in California, unless the law requires otherwise. These terms contain no arbitration clause or class-action waiver.</p>

<h2>14. Changes to these terms</h2>
<p>We may update these terms. If we make a material change, we will tell you in the app or by email before it takes effect. If you keep using the Service after the change, you accept the new terms.</p>

<h2>15. Contact</h2>
<p>Valerie Savransky, <a href="mailto:valsavransky@gmail.com">valsavransky@gmail.com</a>.</p>
`;

function page(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} — Trekker</title><style>body{font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:720px;margin:0 auto;padding:32px 20px;color:#1c1e21}h1{font-size:26px}h2{font-size:19px;margin-top:28px}h3{font-size:16px;margin-top:20px}.meta{color:#6b7280}table{border-collapse:collapse;width:100%;margin:12px 0}th,td{border:1px solid #e1e4e8;padding:8px 10px;text-align:left;vertical-align:top;font-size:15px}th{background:#f5f6f8}a{color:#0f9b8e}</style></head><body><h1>Trekker ${title}</h1>${body}</body></html>`;
}

export const legalRouter = Router();
legalRouter.get('/privacy', (_req, res) => {
  res.type('html').send(page('Privacy Policy', PRIVACY_BODY));
});
legalRouter.get('/terms', (_req, res) => {
  res.type('html').send(page('Terms of Service', TERMS_BODY));
});
