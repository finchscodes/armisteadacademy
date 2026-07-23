-- Run this in Supabase's SQL Editor after 82-lesson-years-and-enrollment-requirements.sql.
--
-- Makes the Privacy Policy admin-editable (singleton row, same pattern as
-- home_announcement) — edit at /admin/privacy, public page at /privacy.
-- Seeded with the current policy text so the page isn't empty on first
-- deploy; admins can edit it from there going forward.

CREATE TABLE "privacy_policy" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

INSERT INTO "privacy_policy" ("id", "content") VALUES (1, '<p>This Privacy Policy explains what personal information Armistead Academy (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects when you use this website, why we collect it, and what rights you have over it. Armistead Academy is a free, non-commercial roleplay community &mdash; we don&apos;t sell anything, run ads, or make money from this site. If you have questions, email us at finchscodes@gmail.com.</p>

<h2>1. What information we collect</h2>
<p>When you register an account, we collect:</p>
<ul>
<li>Your email address</li>
<li>Your password (stored encrypted &mdash; we never see or store it in plain text)</li>
</ul>
<p>When you use the site, our servers automatically log your IP address. This is used only for security purposes &mdash; specifically, to enforce bans and prevent abuse. We do not use it for tracking, analytics, advertising, or location profiling.</p>
<p>Everything else on the site &mdash; character profiles, forum posts, wall posts, messages, and so on &mdash; is content you choose to write and post yourself. That content isn&apos;t &quot;personal information&quot; we collect about you; it&apos;s content you create, and it&apos;s visible to other users as part of how the site works.</p>

<h2>2. How we use your information</h2>
<ul>
<li>Your email and password are used to create and log you into your account.</li>
<li>Your IP address is used to enforce bans and prevent abuse of the site.</li>
<li>We do not use your information for marketing, advertising, or profiling.</li>
<li>We do not analyze your usage patterns or behavior for any commercial purpose.</li>
</ul>

<h2>3. Cookies</h2>
<p>We use a single session cookie to keep you logged in. It&apos;s required for the site to function &mdash; there&apos;s no way to use an account without it. We don&apos;t use cookies for advertising, tracking across other websites, or analytics.</p>

<h2>4. Sharing your information</h2>
<p>We do not sell, rent, or share your personal information with any third party for marketing or commercial purposes &mdash; ever. The only parties with any access to the underlying data are the infrastructure providers that host the site (currently Vercel for hosting and Supabase for the database), who process it solely to keep the site running, under their own standard data-processing agreements. We do not otherwise disclose your information except where required by law.</p>

<h2>5. How long we keep your information</h2>
<p>We keep your account information for as long as your account exists. If you request account deletion, we delete your email and password from our active database. Some minimal information may be retained longer if necessary to prevent abuse (for example, to enforce a ban), or where required by law.</p>

<h2>6. How we keep your information safe</h2>
<p>Passwords are encrypted before storage &mdash; we cannot read them, and no one with database access can either. Reasonable technical safeguards are in place to protect your information. That said, no method of storing or transmitting data over the internet is 100% secure, and we can&apos;t guarantee absolute security.</p>

<h2>7. Age requirement</h2>
<p>Armistead Academy may contain mature themes and is intended for adults only. You must be 18 years of age or older to register an account. We do not knowingly collect information from anyone under 18. If we become aware that an account belongs to someone under 18, we will deactivate it and delete the associated data. If you believe a minor has an account on this site, please contact us at finchscodes@gmail.com.</p>

<h2>8. Your rights</h2>
<p>Depending on where you live, you may have rights to access, correct, or delete your personal information, and to withdraw any consent you&apos;ve given us. You can exercise any of these rights at any time by:</p>
<ul>
<li>Messaging the Spymaster or Secretary in-site with your registered email, or</li>
<li>Emailing us at finchscodes@gmail.com</li>
</ul>
<p>If you request account deletion, we will deactivate and delete your account and information from our active database, aside from the limited retention described in Section 5. We&apos;ll acknowledge any request within a reasonable time and let you know once it&apos;s been handled.</p>

<h2>9. Changes to this policy</h2>
<p>If we make material changes to this policy, we&apos;ll update the &quot;Last updated&quot; date at the top of this page. We encourage you to check back periodically.</p>

<h2>10. Contact us</h2>
<p>Questions about this policy or your data can be sent to finchscodes@gmail.com.</p>');
