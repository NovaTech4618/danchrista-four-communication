# Amezing Limited — Mobile App Store Readiness

## Product decision

**Public app name:** Amezing Limited

**Targets:** Android (Google Play) and iOS (Apple App Store).

**Existing application:** Next.js App Router, React, TypeScript and Supabase. The application already has a web/PWA foundation: a generated web manifest, service-worker registration, an offline fallback page, app icons, responsive layouts and Supabase-backed business workflows.

## Important architecture finding

The current product is a server-backed Next.js application, not a standalone static web bundle. It uses server-side routes/authentication and live Supabase data. Capacitor's standard local-bundle setup expects a built web-assets directory with an index.html entry point. Do not assume that the current Next.js application can be packaged unchanged as a local Capacitor bundle.

A remote-only WebView wrapper is not the release plan. Google Play disallows certain apps whose primary purpose is an unauthorised website WebView, and Apple's minimum-functionality guideline expects an app experience that goes beyond a repackaged website.

## Recommended release approach

1. Stabilise the existing web product and complete the pending mobile UX/security work.
2. Run real-device acceptance tests with the shop team using the PWA.
3. Build a mobile client with genuine mobile workflows and native capabilities, reusing the existing Supabase backend, database RPCs, permission model and validated business rules. Evaluate Ionic React + Capacitor against React Native/Expo before committing to the implementation.
4. Keep the web app as the admin/desktop experience and shared operational source of truth.
5. Add native capabilities only where they solve real shop needs: camera/photo capture for repair intake, push/local notifications for repair status, share/export, secure session handling, and resilient connectivity. Do not cache financial or stock records in an unsafe way.
6. Release Android internal testing first, then iOS TestFlight, then submit both stores after acceptance tests and policy checks pass.

## Existing work to review

- PR #65 — mobile navigation/PWA improvements, offline shell, permission-aware navigation and a proposed Supabase security migration. It is still a draft and the migration has not been applied to production.
- PR #66 — mobile-first workspace redesign and checkout change calculation. Its latest recorded GitHub Actions run passed; the latest Vercel preview must still be verified against the key workflows.
- Do not merge either PR or apply database migrations solely because a build passes. Review financial semantics, RLS/RPC permissions, and the real shop workflows first.

## Release gates

### Gate 1 — Product and data safety
- [ ] Verify role permissions for owner/manager/technician/staff.
- [ ] Verify repair intake, diagnosis, ready/collected status, payments and customer history.
- [ ] Verify separate phone-parts and accessories stock/cash flows.
- [ ] Verify stock movements, engineer parts, supplier balances and returns.
- [ ] Verify expenses, debts, daily closing and reports against real transactions.
- [ ] Verify no demo data or fabricated totals appear in production.
- [ ] Review Supabase RLS, grants, SECURITY DEFINER functions and migrations.

### Gate 2 — Mobile usability
- [ ] Test on small Android screens and tablets.
- [ ] Test sign-in, sign-out, token refresh and role-based navigation.
- [ ] Test keyboard, safe areas, back navigation, dialogs, forms and tables.
- [ ] Test poor connectivity and recovery without serving stale financial data.
- [ ] Test camera/photo upload and file sharing where implemented.
- [ ] Confirm accessibility, readable text and touch-target sizes.

### Gate 3 — Store readiness
- [ ] Confirm legal app owner and publisher account ownership.
- [ ] Confirm app privacy policy and support website/contact details.
- [ ] Complete data-safety/privacy declarations and account deletion requirements where applicable.
- [ ] Prepare app icon, screenshots, store description, category and review notes.
- [ ] Provide a review account or safe demo mode without exposing real customer/business records.
- [ ] Complete Android internal testing and iOS TestFlight testing.
- [ ] Confirm store policy compliance before submission.

## Developer account notes

- Google Play offers Personal and Organization developer accounts. An Organization account requires a D-U-N-S number; select the account type that truthfully represents the publisher.
- Apple Developer Program membership is USD 99 per year (or local-currency pricing where available). An organization enrollment requires a legal entity, D-U-N-S number, work email, public website and authority to bind the organization. An individual enrollment lists the individual's legal name as the App Store seller.
- Do not pay for either program or create an account until the intended legal publisher (the business owner/company or an individual) has been agreed.

## Immediate next actions

1. Review PR #65 and PR #66 together and resolve conflicts safely.
2. Verify the preview deployment and run a shop-team acceptance checklist.
3. Confirm whether Amezing Limited is a registered legal entity and who will own the developer accounts.
4. Choose the mobile client architecture based on the current Next.js server dependencies and the native workflows required.
