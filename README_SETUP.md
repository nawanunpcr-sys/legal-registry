# Legal Registry & Compliance Management System

A comprehensive web application for organizations to manage, track, and ensure compliance with legal requirements and regulatory obligations.

## 🎯 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (optional, for production)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create `.env.local`** file (optional, for real Supabase):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   - Navigate to http://localhost:3000
   - You'll be redirected to login page

### Login Credentials (Demo)
- **Username**: `12345`
- **Password**: `12345`

---

## 📖 Features

### 📚 Legal Registry Management
- **Hierarchical Structure**: Laws organized by categories with expandable sections
- **Quick Search**: Find laws by title, code, or category
- **Compliance Tracking**: View and update compliance status for each law
- **Detailed View**: Complete information including responsible party, review frequency, related documents

### 📝 Add New Laws
Comprehensive form to register new laws with:
- Law type selection (law/announcement/regulation)
- Category assignment
- Responsible person assignment
- Review frequency setting
- Related documents tracking
- Department mapping
- Priority and compliance status

### 🚀 Royal Gazette Integration
- Display recently published laws from Royal Gazette
- Quick preview with summary
- Add laws directly to system
- Auto-categorization support

### 🤖 AI-Powered Analysis
- **Law Summarization**: Extract key points automatically
- **Action Items**: Generate compliance checklists
- **Compliance Planning**: Create step-by-step action plans
- **Key Points Extraction**: Identify penalties, dates, affected parties

### 📊 Dashboard Views

#### Organization Dashboard
- Overall compliance percentage
- Law inventory statistics
- Task status breakdown
- Quick action links
- Department overview

#### Department Dashboard
- Department-wise compliance scores
- Task completion tracking
- Performance comparison
- Visual progress indicators

### ✅ Compliance Tracking
- Mark laws as compliant/non-compliant
- Track compliance scores
- Department-specific status
- Approval workflows
- Timeline tracking

---

## 🗂️ Project Structure

```
legal-registry/
├── pages/
│   ├── _app.jsx                 # App wrapper with auth
│   ├── login.jsx                # Login page
│   ├── index.jsx                # Main dashboard
│   ├── new-laws.jsx             # Royal Gazette display
│   ├── ai-analysis.jsx          # AI summarization
│   ├── dashboard-dept.jsx       # Department dashboard
│   ├── legal/
│   │   ├── index.jsx            # Law registry
│   │   ├── [id].jsx             # Law details
│   │   └── add.jsx              # Add new law
│   └── ...
├── components/
│   ├── Layout.jsx               # Main layout
│   ├── Sidebar.jsx              # Navigation
│   └── ProtectedRoute.jsx       # Auth wrapper
├── contexts/
│   └── AuthContext.jsx          # Auth management
├── hooks/
│   └── useAuth.js               # Auth hook
├── lib/
│   ├── supabase.js              # DB functions
│   ├── royalGazette.js          # Gazette API
│   └── aiSummarization.js       # AI functions
├── styles/
│   └── globals.css              # Global styles
└── public/                       # Static files
```

---

## 🔐 Authentication

The application includes a simple authentication system:
- Login page with form validation
- Session management using localStorage
- Protected routes that redirect to login
- Logout functionality
- User context available throughout the app

**For production**, replace the hardcoded credentials with a real authentication service (Supabase Auth, NextAuth.js, etc.).

---

## 📱 Responsive Design

All pages are fully responsive:
- ✅ Mobile (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)

---

## 🛠️ Available Scripts

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

---

## 🗄️ Database Setup (Supabase)

For production use, create the following tables in Supabase:

### Tables
- `laws` - Main law records
- `law_categories` - Law categories
- `departments` - Organization departments
- `law_department_mapping` - Law-department relationships
- `tasks` - Compliance tasks
- `compliance_records` - Compliance tracking
- `ai_analyses` - AI analysis results

See `IMPLEMENTATION_GUIDE.md` for detailed schema.

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npx vercel
```

### Other Platforms
1. Build: `npm run build`
2. Set environment variables
3. Start: `npm start`

---

## 📚 Documentation

- **IMPLEMENTATION_GUIDE.md** - Detailed feature documentation
- **README.md** (this file) - Quick start guide

---

## 🤝 Support

For issues or questions:
1. Check IMPLEMENTATION_GUIDE.md for detailed documentation
2. Review the code comments
3. Check console for error messages

---

## 📄 License

This project is for organizational use.

---

## 🎉 Ready to Go!

Your legal compliance management system is ready to use. Start by:

1. ✅ Installing dependencies
2. ✅ Running the dev server
3. ✅ Logging in with demo credentials
4. ✅ Exploring the dashboard
5. ✅ Adding your first law

Happy legal compliance tracking! 📚✨
