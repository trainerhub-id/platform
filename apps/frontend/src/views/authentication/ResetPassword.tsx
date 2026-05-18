import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import LeftSidebarPart from './LeftSidebarPart'
import LogoIcon from '/src/assets/images/logos/logo.svg'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setError('Password tidak cocok')
    if (password.length < 8) return setError('Password minimal 8 karakter')

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password, token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal reset password')
      navigate('/auth/login?reset=success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden h-screen">
      <div className="grid grid-cols-12 gap-3 h-screen bg-white dark:bg-darkgray">
        <div className="xl:col-span-4 lg:col-span-6 col-span-12 sm:px-12 px-4">
          <div className="flex h-screen items-center px-3 max-w-md mx-auto">
            <div className="w-full">
              <img src={LogoIcon} alt="Logo" className="h-12 mb-4" />
              <h3 className="text-2xl font-bold my-3 mt-5">Reset Password</h3>
              <p className="text-ld opacity-80 dark:text-white/60 text-sm font-medium">
                Masukkan password baru untuk akun Anda.
              </p>

              {!token ? (
                <div className="mt-6 text-red-600 text-sm">
                  Link reset password tidak valid atau sudah kadaluarsa.
                </div>
              ) : (
                <form className="mt-6" onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="mb-2 block">
                      <Label htmlFor="password">Password Baru</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Minimal 8 karakter"
                    />
                  </div>
                  <div className="mb-4">
                    <div className="mb-2 block">
                      <Label htmlFor="confirm">Konfirmasi Password</Label>
                    </div>
                    <Input
                      id="confirm"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      placeholder="Ulangi password baru"
                    />
                  </div>
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Reset Password'}
                  </Button>
                </form>
              )}

              <Button variant="outline" asChild className="w-full mt-4">
                <Link to="/auth/login">Back to Login</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="xl:col-span-8 lg:col-span-6 col-span-12 bg-[#0A2540] dark:bg-dark lg:block hidden relative overflow-hidden">
          <LeftSidebarPart />
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
