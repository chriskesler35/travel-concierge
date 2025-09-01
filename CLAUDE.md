# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Travel Concierge application built with:
- **Framework**: React 18 with Vite
- **UI Components**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **Routing**: React Router v7
- **Backend & Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OAuth providers
- **Forms**: React Hook Form with Zod validation

## Commands

### Development
```bash
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Installation
```bash
npm install          # Install dependencies
```

## Architecture

### Directory Structure
- `/src/lib/` - Core utilities
  - `supabase.js` - Supabase client configuration
- `/src/api/` - API client and service layers
  - `supabaseAuth.js` - Supabase authentication service
  - `apiClient.js` - Axios instance for external APIs (legacy)
  - `entities.js` - Generic entity CRUD operations
  - `functions.js` - API function endpoints
  - `integrations.js` - External service integrations (LLM, email, file upload)
- `/src/components/` - React components organized by feature
  - `/ui/` - shadcn/ui components (Button, Card, Dialog, etc.)
  - `/auth/` - Authentication components (SupabaseGoogleButton)
  - `/agent/` - Chat and conversation components
  - `/journey/` - Travel itinerary and journey components
  - `/premium/` - Premium feature gates and subscription components
  - `/common/` - Shared components (AI chatbot, modals)
  - `/forms/` - Form components
- `/src/pages/` - Page components with routing logic
- `/src/hooks/` - Custom React hooks
  - `useAuth.jsx` - Supabase authentication hook
- `/src/lib/` - Utilities (includes `cn` function for className merging)

### Key Patterns
- **Database Integration**: All data operations use Supabase client via `src/lib/supabase.js`
- **Authentication**: Supabase Auth with automatic session management
- **OAuth**: Built-in Google OAuth (and other providers) via Supabase
- **Component Imports**: Use path aliases (`@/` maps to `src/`)
- **UI Components**: Follow shadcn/ui patterns with className variants
- **Styling**: Use Tailwind classes with `cn()` utility for conditional classes
- **State Management**: React hooks + Supabase real-time subscriptions
- **Security**: Row Level Security (RLS), environment-based configuration

### Security Considerations
- Supabase handles all authentication security automatically
- Row Level Security (RLS) policies for data access control
- Automatic session management and token refresh
- OAuth providers managed securely by Supabase
- Input validation using Zod schemas
- File upload restrictions and validation
- XSS protection through React's default escaping
- Sensitive configuration in environment variables

### Environment Configuration
Key environment variables (see `.env.example`):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `VITE_ENABLE_AI_FEATURES` - Toggle AI features
- `VITE_MAX_FILE_SIZE` - Maximum file upload size

### Using Supabase
- Database queries: Use `supabase.from('table_name')` for CRUD operations
- Authentication: Use `supabaseAuth` service or `useAuth()` hook
- Real-time: Subscribe to changes with `supabase.from('table').on('*', callback)`
- Storage: Use `supabase.storage.from('bucket')` for file uploads