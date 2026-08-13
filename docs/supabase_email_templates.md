# Aniraku Supabase Email Templates

These templates use only Supabase-supported Go-template variables and are designed for a dark, restrained Aniraku identity with short security-focused copy. They intentionally avoid remote images, marketing copy, tracking pixels, and unnecessary links to improve deliverability.

## Shared design

Use the following HTML structure for the templates below. Keep the `<a>` link target exactly as supplied by the template variable. Do not enable email-link tracking in the SMTP provider because rewritten Supabase links can stop working.

```html
<div style="margin:0;padding:0;background:#09090b;color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
  <div style="max-width:560px;margin:0 auto;padding:32px 18px">
    <div style="border:1px solid #27272a;border-radius:18px;background:#111113;padding:28px">
      <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a78bfa;font-weight:700">ANIRAKU</div>
      <!-- message content -->
      <div style="margin-top:24px;font-size:14px;color:#d4d4d8">
        <p style="margin:24px 0 0;color:#71717a;font-size:12px">If you did not request this message, you can safely ignore it.</p>
      </div>
    </div>
    <p style="margin:16px 0 0;text-align:center;color:#71717a;font-size:12px">Secure account email from Aniraku</p>
  </div>
</div>
```

## Confirm signup

**Subject:** Confirm your Aniraku email address

```html
<div style="margin:0;padding:0;background:#09090b;color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;line-height:1.6"><div style="max-width:560px;margin:0 auto;padding:32px 18px"><div style="border:1px solid #27272a;border-radius:18px;background:#111113;padding:28px"><div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a78bfa;font-weight:700">ANIRAKU</div><h1 style="margin:22px 0 8px;font-size:25px;line-height:1.2;color:#fafafa">Confirm your email</h1><p style="margin:0;color:#a1a1aa">One quick step and your Aniraku account is ready.</p><p style="margin:24px 0"><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#a78bfa;color:#09090b;text-decoration:none;font-weight:700">Confirm email address</a></p><p style="margin:0;color:#71717a;font-size:12px">If you did not create an Aniraku account, you can safely ignore this email.</p></div><p style="margin:16px 0 0;text-align:center;color:#71717a;font-size:12px">Secure account email from Aniraku</p></div></div>
```

## Magic link / OTP

**Subject:** Your Aniraku sign-in link

```html
<div style="margin:0;padding:0;background:#09090b;color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;line-height:1.6"><div style="max-width:560px;margin:0 auto;padding:32px 18px"><div style="border:1px solid #27272a;border-radius:18px;background:#111113;padding:28px"><div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a78bfa;font-weight:700">ANIRAKU</div><h1 style="margin:22px 0 8px;font-size:25px;line-height:1.2;color:#fafafa">Sign in securely</h1><p style="margin:0;color:#a1a1aa">Use the button below to continue to Aniraku. This link is short-lived and can be used once.</p><p style="margin:24px 0"><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#a78bfa;color:#09090b;text-decoration:none;font-weight:700">Continue to Aniraku</a></p><p style="margin:0;color:#71717a;font-size:12px">If you did not request a sign-in link, you can safely ignore this email.</p></div><p style="margin:16px 0 0;text-align:center;color:#71717a;font-size:12px">Secure account email from Aniraku</p></div></div>
```

## Reset password

**Subject:** Reset your Aniraku password

```html
<div style="margin:0;padding:0;background:#09090b;color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;line-height:1.6"><div style="max-width:560px;margin:0 auto;padding:32px 18px"><div style="border:1px solid #27272a;border-radius:18px;background:#111113;padding:28px"><div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a78bfa;font-weight:700">ANIRAKU</div><h1 style="margin:22px 0 8px;font-size:25px;line-height:1.2;color:#fafafa">Reset your password</h1><p style="margin:0;color:#a1a1aa">We received a request to choose a new password for your Aniraku account.</p><p style="margin:24px 0"><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#a78bfa;color:#09090b;text-decoration:none;font-weight:700">Choose a new password</a></p><p style="margin:0;color:#71717a;font-size:12px">If you did not request this, you can safely ignore this email. Your password will not change unless the link is used.</p></div><p style="margin:16px 0 0;text-align:center;color:#71717a;font-size:12px">Secure account email from Aniraku</p></div></div>
```

## Invite user

**Subject:** You’ve been invited to Aniraku

```html
<div style="margin:0;padding:0;background:#09090b;color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;line-height:1.6"><div style="max-width:560px;margin:0 auto;padding:32px 18px"><div style="border:1px solid #27272a;border-radius:18px;background:#111113;padding:28px"><div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a78bfa;font-weight:700">ANIRAKU</div><h1 style="margin:22px 0 8px;font-size:25px;line-height:1.2;color:#fafafa">You’re invited</h1><p style="margin:0;color:#a1a1aa">You have been invited to join Aniraku. Follow the button below to accept the invitation.</p><p style="margin:24px 0"><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#a78bfa;color:#09090b;text-decoration:none;font-weight:700">Accept invitation</a></p><p style="margin:0;color:#71717a;font-size:12px">If you were not expecting this invitation, you can safely ignore this email.</p></div><p style="margin:16px 0 0;text-align:center;color:#71717a;font-size:12px">Secure account email from Aniraku</p></div></div>
```

## Change email address

**Subject:** Confirm your new Aniraku email address

```html
<div style="margin:0;padding:0;background:#09090b;color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;line-height:1.6"><div style="max-width:560px;margin:0 auto;padding:32px 18px"><div style="border:1px solid #27272a;border-radius:18px;background:#111113;padding:28px"><div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a78bfa;font-weight:700">ANIRAKU</div><h1 style="margin:22px 0 8px;font-size:25px;line-height:1.2;color:#fafafa">Confirm your new email</h1><p style="margin:0;color:#a1a1aa">Confirm this address to finish updating your Aniraku account.</p><p style="margin:24px 0"><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#a78bfa;color:#09090b;text-decoration:none;font-weight:700">Confirm new email address</a></p><p style="margin:0;color:#71717a;font-size:12px">If you did not request this change, contact Aniraku support immediately.</p></div><p style="margin:16px 0 0;text-align:center;color:#71717a;font-size:12px">Secure account email from Aniraku</p></div></div>
```

## Reauthentication

**Subject:** Your Aniraku verification code is {{ .Token }}

```html
<div style="margin:0;padding:0;background:#09090b;color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;line-height:1.6"><div style="max-width:560px;margin:0 auto;padding:32px 18px"><div style="border:1px solid #27272a;border-radius:18px;background:#111113;padding:28px"><div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a78bfa;font-weight:700">ANIRAKU</div><h1 style="margin:22px 0 8px;font-size:25px;line-height:1.2;color:#fafafa">Verify your identity</h1><p style="margin:0;color:#a1a1aa">Use this code to continue:</p><div style="margin:24px 0;padding:16px;border-radius:12px;background:#09090b;color:#fafafa;text-align:center;font-size:28px;letter-spacing:.18em;font-weight:700">{{ .Token }}</div><p style="margin:0;color:#71717a;font-size:12px">If you did not request this code, you can safely ignore this email.</p></div><p style="margin:16px 0 0;text-align:center;color:#71717a;font-size:12px">Secure account email from Aniraku</p></div></div>
```

## Security notifications

Enable the corresponding notifications in Supabase Auth if desired. Recommended subjects and concise content are:

| Notification | Subject | Core message |
|---|---|---|
| Password changed | Your Aniraku password was changed | The password for your account was recently changed. If you did not make this change, reset your password and contact support. |
| Email changed | Your Aniraku email address was changed | Your account email changed from `{{ .OldEmail }}` to `{{ .Email }}`. If you did not make this change, contact support immediately. |
| Phone changed | Your Aniraku phone number was changed | Your phone number changed from `{{ .OldPhone }}` to `{{ .Phone }}`. If you did not make this change, contact support immediately. |
| MFA factor enrolled | A new Aniraku verification method was added | Verification method `{{ .FactorType }}` was added. If you did not make this change, contact support immediately. |
| MFA factor removed | An Aniraku verification method was removed | Verification method `{{ .FactorType }}` was removed. If you did not make this change, contact support immediately. |
| Sign-in method linked | A sign-in method was linked to Aniraku | Your `{{ .Provider }}` account was linked as a sign-in method for `{{ .Email }}`. |
| Sign-in method removed | A sign-in method was removed from Aniraku | Your `{{ .Provider }}` sign-in method was removed from `{{ .Email }}`. |

## Applying these to the hosted project

For the hosted Aniraku project, paste the subjects and HTML into **Supabase Dashboard → Authentication → Email Templates**. The available Supabase MCP connection can inspect and modify database schema, tables, migrations, and advisors, but it does not expose the hosted Auth email-template configuration endpoint. Therefore these templates are prepared and validated for manual application, but the actual Auth template settings have not been changed by the database migration.

Before sending production emails, set the Supabase Site URL and redirect allow-list to the real Aniraku URLs, configure custom SMTP, authenticate the sending domain with SPF/DKIM/DMARC, disable provider link tracking, and send test messages to Gmail, Outlook, and a mobile mailbox.
