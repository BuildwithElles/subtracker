# Page snapshot

```yaml
- heading "SubTracker" [level=1]
- paragraph: Track your subscriptions and manage your budget
- heading "Sign in to your account" [level=2]
- text: Email Address
- textbox "Email Address": confirmed.user@subtracker-test.com
- text: Password
- textbox "Password": ConfirmedUserPass123!
- button "Signing in..." [disabled]:
  - img
  - text: Signing in...
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