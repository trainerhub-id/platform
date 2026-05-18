import { expect, test } from '@playwright/test'

test('hono auth smoke', async ({ page, request }) => {
  const email = `smoke+hono-ui-${Date.now()}@trainerhub.local`
  const password = 'SmokePass12345!'

  const signUp = await request.post('https://hono.sertifikasitrainer.com/api/auth/sign-up/email', {
    headers: { Origin: 'https://hono.sertifikasitrainer.com' },
    data: { name: 'Smoke Hono UI', email, password },
  })
  expect(signUp.ok()).toBeTruthy()

  await page.goto(
    `https://hono.sertifikasitrainer.com/auth/login?email=${encodeURIComponent(email)}`,
  )
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()

  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15000 })

  const session = await page.evaluate(async () => {
    const response = await fetch('/api/auth/session', { credentials: 'include' })
    return { status: response.status, body: await response.json().catch(() => null) }
  })

  expect(session.status).toBe(200)
  expect(session.body?.user?.email).toBe(email)
})
