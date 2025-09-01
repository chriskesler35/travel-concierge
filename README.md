# Travel Concierge Application

A modern travel planning and concierge application built with React and Vite.

## Features

- Travel journey planning and management
- AI-powered travel assistance
- Airport and route information
- User authentication and authorization
- Premium features with subscription management
- Secure file uploads
- Email notifications
- PDF generation for itineraries

## Tech Stack

- **Frontend**: React 18, Vite, React Router v7
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Backend & Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OAuth providers
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: React hooks and Supabase real-time

## Prerequisites

- Node.js 18+ 
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd travel-concierge-copy-689cab49
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with appropriate values:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key
   - Other configuration as needed (see `.env.example`)

### Supabase Setup

This application uses Supabase for authentication and database:

1. Go to [Supabase](https://supabase.com) and create a new project
2. Copy your project URL and anon key to your `.env` file
3. Enable authentication providers you want to use:
   - Go to Authentication → Settings → Auth Providers
   - Enable Google OAuth (and any other providers)
   - Configure redirect URLs: `http://localhost:5175/**` (for development)
4. Set up your database tables as needed for your application

### Google OAuth with Supabase

To enable Google Sign-In through Supabase:

1. In your Supabase project, go to Authentication → Settings → Auth Providers
2. Enable Google provider
3. Create Google OAuth credentials in Google Cloud Console:
   - Application type: Web application
   - Authorized JavaScript origins: `https://your-project.supabase.co`
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret to Supabase
5. Save the configuration

No additional frontend setup needed - Supabase handles everything!

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── api/           # API client and service layers
│   ├── apiClient.js    # Axios configuration with interceptors
│   ├── auth.js         # Authentication service
│   ├── entities.js     # Entity CRUD operations
│   ├── functions.js    # API function calls
│   └── integrations.js # External service integrations
├── components/    # React components
│   ├── ui/        # shadcn/ui components
│   ├── agent/     # Chat and conversation components
│   ├── journey/   # Travel journey components
│   ├── premium/   # Premium feature components
│   ├── common/    # Shared components
│   └── forms/     # Form components
├── pages/         # Page components with routing
├── hooks/         # Custom React hooks
└── lib/           # Utility functions
```

## Security Features

- Supabase Authentication with built-in security
- Multiple OAuth providers (Google, GitHub, etc.)
- Row Level Security (RLS) for database access
- Automatic session management and token refresh  
- Input validation with Zod schemas
- File upload restrictions and validation
- Environment-based configuration
- XSS protection through React's default escaping
- HTTPS enforced in production

## API Integration

The application uses a custom API client built on Axios with:
- Automatic authentication header injection
- Request/response interceptors for error handling
- Token refresh mechanism
- Centralized error logging
- Support for multipart/form-data uploads

## Authentication Flow

1. User logs in with credentials
2. Server returns JWT access token and refresh token
3. Tokens stored in secure cookies
4. Access token included in API request headers
5. Automatic token refresh when access token expires
6. Logout clears tokens and redirects to home

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Environment Variables

See `.env.example` for all available configuration options. Key variables include:

- `VITE_API_BASE_URL`: Backend API endpoint
- `VITE_AUTH_TOKEN_KEY`: Cookie key for auth token
- `VITE_SECURE_COOKIES`: Enable secure cookies (production)
- `VITE_ENABLE_AI_FEATURES`: Toggle AI features
- `VITE_MAX_FILE_SIZE`: Maximum upload file size

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions, please contact the development team.