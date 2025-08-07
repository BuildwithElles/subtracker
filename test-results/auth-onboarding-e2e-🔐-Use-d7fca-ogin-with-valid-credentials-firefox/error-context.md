# Page snapshot

```yaml
- heading "SubTracker" [level=1]
- paragraph: Track your subscriptions and manage your budget
- heading "Sign in to your account" [level=2]
- alert:
  - img
  - text: Invalid login credentials
- text: Email Address
- textbox "Email Address": ezequiel31@hotmail.com
- text: Password
- textbox "Password": TestPassword123!
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