import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useSignUp } from 'src/lib/better-auth';
import { Label } from 'src/components/ui/label';
import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';

const AuthRegister = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const beginSignUp = async (): Promise<void> => {
    const signUpAttempt = await signUp.create({
      emailAddress,
      password,
      unsafeMetadata: {
        firstName,
      }
    });

    if (signUpAttempt.status === "complete") {
      await setActive({ session: signUpAttempt.createdSessionId });
      navigate("/");
      return;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      await beginSignUp();
    } catch (err: any) {
      console.error(err);
      setError(err?.errors?.[0]?.longMessage || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            <Label htmlFor="name" className="font-semibold text-bodytext">
              Name
            </Label>
          </div>
          <Input
            id="name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="emadd" className="font-semibold text-bodytext">
              Email Address
            </Label>
          </div>
          <Input
            id="emadd"
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="mb-6">
          <div className="mb-2 block">
            <Label htmlFor="userpwd" className="font-semibold text-bodytext">
              Password
            </Label>
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
        <Button className="w-full bg-primary hover:bg-primary/90 text-white" disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </Button>
      </form>
    </>
  );
};

export default AuthRegister;
