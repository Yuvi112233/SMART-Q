# SmartQ - Salon Queue Management System

## Project Structure

### Backend (server/)

#### Key Files:
1. `server/index.ts`
   - Main server setup using Express.js
   - Handles middleware configuration
   - Request logging
   - Error handling

2. `server/routes.ts`
   - API route definitions
   - WebSocket server setup for real-time updates
   - Authentication middleware using JWT
   - Handles all API endpoints

3. `server/storage.ts`
   - Database interface implementation
   - CRUD operations for:
     - Users
     - Salons
     - Services
     - Queues
     - Offers
     - Reviews

### Frontend (client/)

#### Key Files:
1. `client/src/App.tsx`
   - Main application component
   - Route configuration using Wouter
   - Global providers setup:
     - QueryClient for data fetching
     - Auth context
     - WebSocket context
     - UI components (Toaster, Tooltip)

2. `client/src/pages/`
   - Home: Landing page
   - Auth: Login/Registration
   - SalonProfile: Individual salon view
   - Queue: Queue management
   - Dashboard: User/Salon dashboard

### Shared (shared/)

#### Key Files:
1. `shared/schema.ts`
   - Database schema definitions using Drizzle ORM
   - Tables:
     - users: Customer and salon owner information
     - salons: Salon details and operating hours
     - services: Available services and pricing
     - queues: Queue management and status

## Data Flow

1. **Authentication Flow**:
   - User registration/login through `/api/auth`
   - JWT token generation and validation
   - Protected routes using `authenticateToken` middleware

2. **Queue Management**:
   - Real-time updates using WebSocket
   - Queue position tracking
   - Status updates (waiting, in-progress, completed)

3. **Database**:
   - PostgreSQL with Drizzle ORM
   - Schema migrations using `drizzle.config.ts`
   - Environment variables in `.env`:
     - DATABASE_URL
     - JWT_SECRET
     - PORT

## Key Features

1. **User Management**:
   - Customer and salon owner roles
   - Profile management
   - Loyalty points system

2. **Salon Features**:
   - Service management
   - Operating hours
   - Location-based search
   - Rating system

3. **Queue System**:
   - Real-time position updates
   - Estimated wait times
   - Service selection
   - Status notifications

4. **Additional Features**:
   - Special offers management
   - Review system
   - Image handling for salons
   - Operating hours management

## Development Setup

1. Environment Setup:
   ```bash
   npm install