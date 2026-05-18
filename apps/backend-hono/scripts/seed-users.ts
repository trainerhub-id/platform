/**
 * Seed dummy user & admin via Better Auth sign-up endpoint.
 * Usage: bun scripts/seed-users.ts
 *
 * Requires the backend to be running (bun run dev).
 */

const BASE = process.env.BETTER_AUTH_URL ?? 'http://localhost:3739/api/auth'

const dummyUsers = [
  { name: 'User Dummy', email: 'user@example.com', password: 'password123', role: 'user' },
  { name: 'Admin Dummy', email: 'admin@example.com', password: 'password123', role: 'admin' },
]

async function signUp(user: (typeof dummyUsers)[number]) {
  const res = await fetch(`${BASE}/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: user.name, email: user.email, password: user.password }),
  })
  if (!res.ok) {
    const body = await res.text()
    if (body.includes('already exists') || body.includes('UNIQUE') || body.includes('duplicate')) {
      console.log(`⏭️  ${user.email} already exists, skipping`)
      return
    }
    throw new Error(`Sign-up failed for ${user.email}: ${res.status} ${body}`)
  }
  console.log(`✅ Created ${user.email}`)
}

async function setRole(email: string, role: string) {
  // Direct DB update for role since Better Auth doesn't expose role on sign-up
  const { sql } = await import('../src/db/client')
  await sql`UPDATE "user" SET role = ${role} WHERE email = ${email}`
  console.log(`✅ Set role '${role}' for ${email}`)
}

async function main() {
  for (const user of dummyUsers) {
    await signUp(user)
    if (user.role !== 'user') {
      await setRole(user.email, user.role)
    }
  }
  // Close DB connection
  const { sql } = await import('../src/db/client')
  await sql.end()
  console.log('\n🎉 Seeding complete!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
