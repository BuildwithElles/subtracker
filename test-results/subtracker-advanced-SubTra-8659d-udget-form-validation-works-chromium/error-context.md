# Page snapshot

```yaml
- heading "SubTracker" [level=1]
- paragraph: Track your subscriptions and manage your budget
- heading "Sign in to your account" [level=2]
- text: Email Address
- textbox "Email Address"
- alert:
  - img
  - text: Email is required
- text: Password
- textbox "Password"
- alert:
  - img
  - text: Password is required
- button "Sign In"
- link "Forgot your password?":
  - /url: /password-reset
- text: Don't have an account?
- link "Sign up":
  - /url: /signup
- text: Or continue with
- button "Sign in with Google":
  - img
  - text: Sign in with Google
```