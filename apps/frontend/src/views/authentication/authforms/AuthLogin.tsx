import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from 'src/components/ui/button'
import { Checkbox } from 'src/components/ui/checkbox'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { useSignIn } from 'src/lib/better-auth'

const AuthLogin = () => {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    setError('')

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate('/')
      } else {
        setError('Login incomplete. Please try again.')
      }
    } catch (err: any) {
      console.error('error', err)
      setError(err.errors?.[0]?.longMessage || 'An error occurred during sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form className="mt-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm font-medium">
            {error}
          </div>
        )}
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="Username">Email Address</Label>
          </div>
          <Input
            id="username"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="userpwd">Password</Label>
          </div>
          <Input
            id="userpwd"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="flex justify-between my-5">
          <div className="flex items-center gap-2">
            <Checkbox id="accept" />
            <Label htmlFor="accept" className="opacity-90 font-normal cursor-pointer">
              Remember this Device
            </Label>
          </div>
          <Link
            to={'/auth/forgot-password'}
            className="text-[#CFA15A] text-sm font-medium hover:underline"
          >
            Forgot Password ?
          </Link>
        </div>
        <Button
          type="submit"
          className="w-full bg-[#CFA15A] hover:bg-[#b0884b] text-white border-none"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </>
  )
}

export default AuthLogin
