# SubTracker - Subscription Management App

A React TypeScript application that helps users track their subscriptions, manage budgets, and get AI-powered insights to optimize their recurring expenses.

## 🚀 Features

- **Gmail Integration**: Automatically detect subscriptions from email receipts
- **Budget Management**: Set income, expenses, and savings goals
- **Real-time Dashboard**: View all subscriptions and spending insights
- **Smart Notifications**: Get alerts for trial endings, budget warnings, and new subscriptions
- **Data Export**: Download your subscription data as CSV
- **Secure Authentication**: Powered by Supabase Auth with Google OAuth

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd subtracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
   ```
   
   **⚠️ Important**: Never commit your actual `.env` file to Git. Your sensitive credentials should only exist locally.

4. **Set up Supabase**:
   - Create a new project at [Supabase](https://supabase.com)
   - Run the SQL schema in `supabase-schema.sql` in your Supabase SQL editor
   - Enable Google OAuth in Authentication > Settings

5. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Layout.tsx          # Main layout with navigation
│   └── ProtectedRoute.tsx  # Auth protection wrapper
├── pages/
│   ├── LandingPage.tsx     # Homepage with hero section
│   ├── SignUp.tsx          # User registration
│   ├── Login.tsx           # User authentication
│   ├── ConnectGmail.tsx    # Gmail OAuth setup
│   ├── Dashboard.tsx       # Main subscription dashboard
│   ├── BudgetSetup.tsx     # Budget configuration
│   ├── Notifications.tsx   # Alerts and settings
│   └── Settings.tsx        # Account and privacy settings
├── lib/
│   └── supabase.ts         # Supabase client configuration
├── App.tsx                 # Main app component with routing
├── main.tsx               # React app entry point
└── index.css              # Global styles with Tailwind
```

## 🚀 Build Stages Completed

### ✅ Stage 1: Auth & Onboarding
- **LandingPage.tsx**: Hero section, trust indicators, and 3-step explainer
- **SignUp.tsx**: Email/password registration with Google OAuth
- **Login.tsx**: User authentication with error handling

### ✅ Stage 2: Gmail Connection Flow
- **ConnectGmail.tsx**: Step-by-step Gmail OAuth with privacy explanation

### ✅ Stage 3: Main Dashboard
- **Dashboard.tsx**: Complete dashboard with:
  - Total recurring costs
  - Safe daily spending calculation
  - Subscription table with next charge dates
  - AI insights panel
  - Upcoming charges preview

### ✅ Stage 4: Budget Setup
- **BudgetSetup.tsx**: Income, expenses, and savings goal configuration with real-time budget calculation

### ✅ Stage 5: Notifications
- **Notifications.tsx**: Alert management with notification settings toggles

### ✅ Stage 6: Settings
- **Settings.tsx**: Account management, Gmail connection status, data export, and account deletion

### ✅ Stage 7: Backend Schema
- **Supabase Database**: Complete schema with RLS policies for secure data access

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🗄️ Database Schema

The app uses the following Supabase tables:

- **subscriptions**: Store user subscription data
- **budget_profile**: Store user budget information
- **notifications**: Store user alerts and notifications
- **user_settings**: Store user preferences and settings

All tables include Row Level Security (RLS) policies to ensure users can only access their own data.

## 🔐 Authentication Flow

1. User signs up/logs in via Supabase Auth
2. Optional Gmail OAuth for subscription detection
3. Budget setup for personalized insights
4. Access to full dashboard and features

## 🚀 Deployment

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**:
   - Vercel: Connect your GitHub repo
   - Netlify: Drag and drop the `dist` folder
   - Others: Upload the `dist` folder contents

3. **Configure environment variables** on your hosting platform

## 🔮 Future Enhancements

- Gmail API integration for real subscription detection
- Machine learning for better subscription categorization
- Mobile app with React Native
- Subscription cancellation assistance
- Family plan sharing features
- Advanced analytics and reporting

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
