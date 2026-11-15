// Settings for this deployment. None of these are secrets.

// Cloudflare Access (sign-in). Found in Cloudflare Zero Trust:
//   teamDomain: Settings → Custom pages → Team domain
//   aud:        Access → Applications → the application that covers board-direction.triodian.com → "Application Audience (AUD) Tag"
// The Worker variables ACCESS_TEAM_DOMAIN and ACCESS_AUD override these values.
export const ACCESS = {
  teamDomain: 'damian-hickey-30c.cloudflareaccess.com',
  aud: '58e70c6f269ea07102821763e23bc6c3e6ccc2e65bca75dad204fc407172a38a',
};

// First administrator(s): the Worker variable FIRST_ADMINS (comma-separated), set for each deployment by the installer or
// the provisioning script. Nothing is compiled in (security review 15 Nov 2026, S.4). While the deployment has never had an
// administrator, a listed person becomes one on first sign-in; after that the path is closed and admins are managed in /admin.
