export const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

// Marşrutlarla toqquşmasın deyə tutulmuş adlar
export const RESERVED_USERNAMES = new Set([
  "api", "i", "login", "signup", "logout", "dashboard", "admin", "settings", "pricing", "help", "about", "static", "_next",
]);
