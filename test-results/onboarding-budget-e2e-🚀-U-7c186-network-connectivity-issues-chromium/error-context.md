# Page snapshot

```yaml
- banner:
  - text: S
  - heading "SubTracker" [level=1]
  - progressbar: 1 2 1 of 2
- main:
  - img
  - heading "Welcome to SubTracker, Test! 👋" [level=1]
  - paragraph: Let's get you set up in just a few quick steps - Connect your Gmail
  - heading "Connect Your Gmail" [level=2]
  - paragraph: We'll automatically scan your inbox to find existing subscriptions and trials. This saves you time and ensures you don't miss anything important.
  - heading "What we'll scan for:" [level=3]
  - list:
    - listitem:
      - img
      - text: Active subscriptions and recurring payments
    - listitem:
      - img
      - text: Free trials that are ending soon
    - listitem:
      - img
      - text: Billing receipts and invoices
  - button "Connect Gmail & Scan for Subscriptions":
    - img
    - text: Connect Gmail & Scan for Subscriptions
  - button "Skip for now (you can connect later)"
  - paragraph: 🔒 We only access your email to find subscription-related messages. Your privacy is protected and you can disconnect at any time.
  - button "Next":
    - text: Next
    - img
```