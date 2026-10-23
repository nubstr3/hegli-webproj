// The shape of an access code, shared by the browser (homepage terminal) and the server.
// Example: tide-lantern-4821
//
// The terminal only sends input to the server when it looks like this, so
// ordinary typos and random commands never touch the code check.

export const CODE_PATTERN = /^[a-z]+-[a-z]+-\d{4}$/

export function normalizeCode(raw) {
  return String(raw ?? '').trim().toLowerCase()
}

export function looksLikeCode(raw) {
  return CODE_PATTERN.test(normalizeCode(raw))
}
