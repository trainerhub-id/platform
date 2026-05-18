import { Link } from 'react-router'
import { Button } from 'src/components/ui/button'
import { Checkbox } from 'src/components/ui/checkbox'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'

const BoxedAuthRegister = () => {
  return (
    <form className="mt-6 space-y-5">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" type="text" placeholder="Enter your name" className="form-control" />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="text" placeholder="Enter your email" className="form-control" />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link className="text-xs text-primary" to="/auth/auth2/forgot-password">
            Forgot Password?
          </Link>
        </div>

        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          className="form-control"
        />
      </div>

      {/* Keep me logged in */}
      <div className="flex items-center gap-2">
        <Checkbox id="stayLoggedIn" defaultChecked />
        <Label htmlFor="stayLoggedIn" className="cursor-pointer mb-0">
          Keep me logged in
        </Label>
      </div>

      {/* Submit Button */}
      <Button
        asChild
        className="rounded-md w-full bg-dark dark:bg-primary hover:bg-dark/90 dark:hover:bg-primary/90"
      >
        <Link to="/">Sign Up</Link>
      </Button>
    </form>
  )
}

export default BoxedAuthRegister
