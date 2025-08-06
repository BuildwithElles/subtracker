# SubTracker Flow Diagrams

## 1. User Authentication & Onboarding Flow

```mermaid
flowchart TD
    A[Landing Page] --> B{User Authenticated?}
    B -->|No| C[Sign Up / Login Page]
    B -->|Yes| D{Onboarding Complete?}

    C --> E[Email/Password Sign Up]
    C --> F[Google OAuth Sign Up]

    E --> G{Email Confirmed?}
    F --> H[OAuth Success]

    G -->|Yes| I[Onboarding Step 1]
    G -->|No| J[Email Confirmation Required]
    H --> I

    I[Gmail Connection] --> K{Gmail Connected?}
    K -->|Yes| L[Scan Gmail for Subscriptions]
    K -->|No| M[Skip Gmail]

    L --> N[Onboarding Step 2: Budget Setup]
    M --> N

    N --> O{Budget Set?}
    O -->|Yes| P[Onboarding Complete]
    O -->|No| Q[Skip Budget]

    P --> R[Dashboard]
    Q --> R

    D -->|Yes| R
```

## 2. Budget Setup Flow (Budget.tsx)

```mermaid
flowchart TD
    A[Budget Page Load] --> B[Check User Authentication]
    B --> C{User Valid?}

    C -->|No| D[Show Auth Error]
    C -->|Yes| E[Load Existing Budget Data]

    D --> F[Redirect to Login]

    E --> G[Display Budget Form]
    G --> H[User Fills Form]

    H --> I[Monthly Income Input]
    H --> J[Fixed Costs Input]
    H --> K[Savings Target Input]

    I --> L[Calculate Available Budget]
    J --> L
    K --> L

    L --> M[Show Budget Summary]
    M --> N[User Submits Form]

    N --> O[Validate Inputs]
    O --> P{Validation Pass?}

    P -->|No| Q[Show Error Message]
    P -->|Yes| R[Check User Session]

    R --> S{Session Valid?}
    S -->|No| T[Refresh Session]
    S -->|Yes| U[Save to Database]

    T --> V{Refresh Success?}
    V -->|No| W[Show Session Error]
    V -->|Yes| U

    U --> X{Save Success?}
    X -->|No| Y[Show Database Error]
    X -->|Yes| Z[Show Success Message]

    Z --> AA[Redirect to Dashboard]

    Q --> G
    Y --> G
    W --> G
```

## 3. Dashboard Data Loading Flow

```mermaid
flowchart TD
    A[Dashboard Load] --> B[Check Authentication]
    B --> C[Initialize Alert System]
    C --> D[Load User Data in Parallel]

    D --> E[Load Subscriptions]
    D --> F[Load Budget Profile]
    D --> G[Load Pending Alerts]
    D --> H[Load Weekly Digest]
    D --> I[Load Budget Insights]

    E --> J[Process Subscription Data]
    F --> K[Calculate Budget Usage]
    G --> L[Display Alert Banner]
    H --> M[Show Weekly Summary]
    I --> N[Generate Recommendations]

    J --> O[Group by Category]
    J --> P[Calculate Monthly Totals]
    J --> Q[Find Upcoming Charges]
    J --> R[Identify Trials Ending]

    K --> S[Budget Progress Bar]
    K --> T[Spending Breakdown]

    O --> U[Category Charts]
    P --> V[Total Spending Display]
    Q --> W[Upcoming Tab Content]
    R --> X[Trial Alerts]

    L --> Y[Dashboard Ready]
    M --> Y
    N --> Y
    S --> Y
    U --> Y
    V --> Y
    W --> Y
    X --> Y
```

## 4. Subscription Management Flow

```mermaid
flowchart TD
    A[User Action] --> B{Action Type}

    B -->|Add New| C[Open Add Modal]
    B -->|Edit| D[Open Edit Modal]
    B -->|Delete| E[Confirm Delete]
    B -->|Cancel| F[Update Status to Cancelled]
    B -->|Duplicate| G[Pre-fill Add Modal]

    C --> H[Fill Subscription Details]
    D --> I[Modify Existing Data]
    G --> H

    H --> J[Validate Form Data]
    I --> J

    J --> K{Validation Pass?}
    K -->|No| L[Show Form Errors]
    K -->|Yes| M[Submit to Database]

    E --> N{Confirm Delete?}
    N -->|No| O[Cancel Action]
    N -->|Yes| P[Delete from Database]

    F --> Q[Update Database Status]

    M --> R{Database Success?}
    P --> R
    Q --> R

    R -->|No| S[Show Error Message]
    R -->|Yes| T[Refresh Subscription List]

    T --> U[Update Dashboard Data]
    U --> V[Recalculate Totals]
    V --> W[Update Budget Usage]

    L --> H
    L --> I
    S --> X[Stay on Current View]
    W --> Y[Action Complete]
    O --> Y
    X --> Y
```

## 5. Gmail Integration Flow

```mermaid
flowchart TD
    A[Gmail Integration Trigger] --> B{Integration Type}

    B -->|OAuth Setup| C[Redirect to Google OAuth]
    B -->|Email Scan| D[Use Stored Token]

    C --> E[User Grants Permission]
    E --> F[Receive Auth Code]
    F --> G[Exchange for Access Token]
    G --> H[Store Token in Profile]

    H --> I[Scan Gmail for Subscriptions]
    D --> I

    I --> J[Fetch Email Messages]
    J --> K[Parse Subscription Emails]
    K --> L[Extract Service Details]

    L --> M[Identify Service Name]
    L --> N[Extract Pricing Info]
    L --> O[Determine Billing Cycle]
    L --> P[Find Trial End Dates]

    M --> Q[Create Subscription Objects]
    N --> Q
    O --> Q
    P --> Q

    Q --> R[Deduplicate Existing]
    R --> S[Present Found Subscriptions]
    S --> T[User Confirms/Edits]
    T --> U[Save to Database]

    U --> V[Update Dashboard]
```

## 6. Alert System Flow

```mermaid
flowchart TD
    A[Alert System Initialize] --> B[Start Monitoring Timer]
    B --> C[Check Alerts Every Hour]

    C --> D[Check Trial Alerts]
    C --> E[Check Budget Alerts]

    D --> F[Get Active Trials]
    F --> G[Calculate Days Until End]
    G --> H{Days Remaining}

    H -->|7 days| I[Create 7-day Alert]
    H -->|3 days| J[Create 3-day Alert]
    H -->|1 day| K[Create 1-day Alert]
    H -->|Expired| L[Create Expired Alert]

    E --> M[Get Budget Profile]
    M --> N[Calculate Current Spending]
    N --> O[Calculate Budget Usage %]
    O --> P{Usage Level}

    P -->|>85%| Q[Create Approaching Limit Alert]
    P -->|>100%| R[Create Exceeded Limit Alert]

    I --> S[Check if Alert Exists]
    J --> S
    K --> S
    L --> S
    Q --> S
    R --> S

    S --> T{Alert Exists?}
    T -->|No| U[Store Alert in Database]
    T -->|Yes| V[Skip Duplicate]

    U --> W[Send Browser Notification]
    W --> X[Display in Dashboard]

    X --> Y[User Can Acknowledge]
    Y --> Z[Mark Alert as Read]

    V --> AA[Continue Monitoring]
    Z --> AA
```

## 7. Weekly Digest Generation Flow

```mermaid
flowchart TD
    A[Weekly Digest Trigger] --> B[Every Sunday 9 AM]
    B --> C[Get All Users with Subscriptions]

    C --> D[For Each User]
    D --> E[Check if Digest Exists]
    E --> F{Digest Exists?}

    F -->|Yes| G[Skip User]
    F -->|No| H[Generate New Digest]

    H --> I[Get User Subscriptions]
    I --> J[Get Budget Profile]

    J --> K[Calculate Week Stats]
    K --> L[Count New Subscriptions]
    K --> M[Count Cancelled Subscriptions]
    K --> N[Calculate Weekly Spending]
    K --> O[Find Trials Ending]
    K --> P[Calculate Budget Usage]

    L --> Q[Generate Recommendations]
    M --> Q
    N --> Q
    O --> Q
    P --> Q

    Q --> R[Create Digest Object]
    R --> S[Store in Database]
    S --> T[Send Notification]

    T --> U[Mark as Sent]
    U --> V[Continue to Next User]

    G --> V
    V --> W{More Users?}
    W -->|Yes| D
    W -->|No| X[Digest Generation Complete]
```

## 8. Data Persistence Layer

```mermaid
flowchart TD
    A[Client Action] --> B{Data Operation}

    B -->|Create| C[Insert Query]
    B -->|Read| D[Select Query]
    B -->|Update| E[Update Query]
    B -->|Delete| F[Delete Query]

    C --> G[Validate Data]
    E --> G

    G --> H{Validation Pass?}
    H -->|No| I[Return Validation Error]
    H -->|Yes| J[Check User Permissions]

    D --> J
    F --> J

    J --> K{Authorized?}
    K -->|No| L[Return Auth Error]
    K -->|Yes| M[Execute Database Query]

    M --> N{Query Success?}
    N -->|No| O[Return Database Error]
    N -->|Yes| P[Return Success Data]

    P --> Q[Update Client State]
    Q --> R[Refresh UI Components]

    I --> S[Show Error to User]
    L --> S
    O --> S

    S --> T[User Can Retry]
    R --> U[Operation Complete]
```

## 9. Settings & Preferences Flow

```mermaid
flowchart TD
    A[Settings Page Load] --> B[Load User Profile]
    B --> C[Load Current Settings]

    C --> D[Display Settings Form]
    D --> E[User Modifies Settings]

    E --> F{Setting Type}

    F -->|Gmail Sync Toggle| G[Update Sync Preference]
    F -->|Export Data| H[Generate CSV Export]
    F -->|Change Password| I[Password Update Flow]
    F -->|Delete Account| J[Account Deletion Flow]
    F -->|Disconnect Gmail| K[Revoke OAuth Token]

    G --> L[Update Profile Table]
    H --> M[Query All User Data]
    I --> N[Update Auth Table]
    K --> O[Remove Stored Token]

    J --> P[Confirm Deletion]
    P --> Q{User Confirms?}
    Q -->|No| R[Cancel Deletion]
    Q -->|Yes| S[Delete All User Data]

    S --> T[Delete Subscriptions]
    T --> U[Delete Budget Profile]
    U --> V[Delete User Profile]
    V --> W[Delete Auth User]

    W --> X[Sign Out User]
    X --> Y[Redirect to Home]

    L --> Z[Show Success Message]
    M --> AA[Download CSV File]
    N --> Z
    O --> Z
    R --> Z

    AA --> BB[Settings Updated]
    Z --> BB
    Y --> CC[Account Deleted]
```

## 10. Error Handling & Recovery Flow

```mermaid
flowchart TD
    A[Operation Starts] --> B[Try Operation]
    B --> C{Success?}

    C -->|Yes| D[Return Success]
    C -->|No| E[Catch Error]

    E --> F{Error Type}

    F -->|Network Error| G[Show Network Error]
    F -->|Auth Error| H[Clear Session]
    F -->|Validation Error| I[Show Field Errors]
    F -->|Database Error| J[Show Generic Error]
    F -->|Permission Error| K[Show Access Error]

    G --> L[Offer Retry Option]
    H --> M[Redirect to Login]
    I --> N[Highlight Invalid Fields]
    J --> O[Log Error Details]
    K --> P[Suggest Sign Out]

    L --> Q{User Retries?}
    Q -->|Yes| B
    Q -->|No| R[Operation Cancelled]

    N --> S[User Can Correct]
    S --> B

    O --> T[Contact Support Option]
    P --> U[Emergency Logout]

    M --> V[User Must Re-authenticate]
    U --> V

    D --> W[Operation Complete]
    R --> X[User Informed]
    T --> X
    V --> X
    X --> Y[App State Recovered]
```

These flow diagrams illustrate the key interactions in your SubTracker application, showing how data flows between the UI components, business logic, and database layers. Each diagram focuses on a specific aspect of the application while showing the decision points, error handling, and user experience flows.
