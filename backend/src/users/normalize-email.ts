// The schema also trims and lowercases email on writes and query filters;
// this is a second layer.
// TODO: normalise email once at the input boundary (pipe or DTO transform)
// when the routes that receive an email exist, then revisit the calls in
// UsersService.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
