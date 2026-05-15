import { useState } from 'react';
import { useSignIn } from 'src/lib/better-auth';
import { Label } from 'src/components/ui/label';
import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';

const AuthForgotPassword = () => {
  const { isLoaded, signIn } = useSignIn();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'reset'>('email');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      setSuccess('Password reset code sent to your email!');
      setStep('reset');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.errors?.[0]?.longMessage || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'complete') {
        setSuccess('Password reset successfully! You can now login with your new password.');
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.errors?.[0]?.longMessage || 'Failed to reset password. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <>
        <form className="mt-6" onSubmit={handleEmailSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4 text-sm">
              {success}
            </div>
          )}
          <div className="mb-4">
            <div className="mb-2 block">
              <Label htmlFor="email">Email Address</Label>
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Code'}
          </Button>
        </form>
      </>
    );
  }

  return (
    <>
      <form className="mt-6" onSubmit={handlePasswordReset}>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4 text-sm">
            {success}
          </div>
        )}
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="code">Reset Code</Label>
          </div>
          <Input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="Enter code from email"
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="password">New Password</Label>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter new password"
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
          </div>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm new password"
          />
        </div>
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full mt-3"
          onClick={() => setStep('email')}
        >
          Back
        </Button>
      </form>
    </>
  );
};

export default AuthForgotPassword;
