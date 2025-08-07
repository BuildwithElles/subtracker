# Page snapshot

```yaml
- heading "SubTracker" [level=1]
- paragraph: Track your subscriptions and manage your budget
- heading "Sign in to your account" [level=2]
- text: Email Address
- textbox "Email Address": nonexistent@example.com
- text: Password
- textbox "Password": wrongpassword
- alert:
  - img
  - text: Password must contain one uppercase letter, one number
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