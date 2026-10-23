// Makes an access code and saves its hash in Supabase. The code is printed once
// and is never stored in plain text, so copy it straight away.
//
// Usage (from the project folder):
//   node --env-file=.env.local scripts/make-access-code.mjs "Mum and Dad" 2027-01-31
//
// The date is optional (no date means the code never expires on its own).

import { adminClient, generateCode, hashCode } from '../lib/accessCore.mjs'

const [label, expires] = process.argv.slice(2)

if (!label) {
  console.error('usage: node --env-file=.env.local scripts/make-access-code.mjs "Label" [YYYY-MM-DD]')
  process.exit(1)
}

let expiresAt = null
if (expires) {
  const end = new Date(`${expires}T23:59:59`)
  if (Number.isNaN(end.getTime())) {
    console.error(`"${expires}" is not a date. Use YYYY-MM-DD, e.g. 2027-01-31`)
    process.exit(1)
  }
  expiresAt = end.toISOString()
}

const admin = adminClient()
const code = generateCode()

const { error } = await admin
  .from('access_codes')
  .insert({ label, code_hash: hashCode(code), scopes: ['travel'], expires_at: expiresAt })

if (error) {
  console.error('could not save the code:', error.message)
  process.exit(1)
}

console.log(`\ncode for "${label}":  ${code}`)
console.log(expiresAt ? `expires:  ${expires}\n` : 'expires:  never\n')
console.log('shown once. Only a hash is stored.')
