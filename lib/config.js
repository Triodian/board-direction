// Settings for this deployment. None of these are secrets.

// Cloudflare Access (sign-in). Found in Cloudflare Zero Trust:
//   teamDomain: Settings → Custom pages → Team domain
//   aud:        Access → Applications → the application that covers board-direction.triodian.com → "Application Audience (AUD) Tag"
// The Worker variables ACCESS_TEAM_DOMAIN and ACCESS_AUD override these values.
export const ACCESS = {
  teamDomain: 'damian-hickey-30c.cloudflareaccess.com',
  aud: '58e70c6f269ea07102821763e23bc6c3e6ccc2e65bca75dad204fc407172a38a',
};

// First administrator(s). While the user list has no active administrator, these people are
// added as administrators the first time they sign in. After that, admins are managed in /admin.
export const BOOTSTRAP_ADMINS = ['damian.hickey@triodian.com'];
