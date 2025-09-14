# Creator Suite Next.js Frontend

A modern Next.js 14 application with App Router, TypeScript, and theme support.

## Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Theme Support** (Light/Dark mode with persistence)
- **Responsive Design** with CSS variables
- **Authentication** with JWT tokens and cookies
- **API Integration** with Axios interceptors
- **Modern UI** with clean, accessible design
- **Error Handling** and loading states

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable React components (Header, Footer, Layout, ThemeProvider)
- `lib/` - Utility libraries (API client with auth)
- `styles/` - Global styles with CSS variables for theming
- `types/` - TypeScript type definitions

## Pages

- `/home` - Dashboard with showcase items
- `/models` - AI model selection and management
- `/studio` - Content creation workspace
- `/billing` - Subscription and payment management
- `/user/login` - User authentication
- `/user/profile` - User profile and settings

## API Integration

The app integrates with the Creator Suite backend API using Axios with automatic token handling.

## Theme System

- Light and dark themes with CSS variables
- Theme preference persisted in localStorage
- Smooth transitions between themes
- Accessible color schemes

## Authentication

- JWT-based authentication
- Token stored in localStorage and cookies
- Automatic redirect for protected routes
- Logout functionality with token cleanup

## Development

- Create a `.env.local` for local development
- Set `NEXT_PUBLIC_API_URL` to your backend URL
- Use the provided middleware for route protection
- All secrets remain in the backend service

## Build

```bash
npm run build
npm start
```
# video_generation
