# SmartQ - Virtual Queue Management System

## Overview

SmartQ is a full-stack web application that revolutionizes salon experiences through virtual queue management. The system allows customers to join virtual queues at salons, receive real-time updates about their position, and earn loyalty points, while salon owners can efficiently manage their queues, services, and customer flow.

The application features a React-based frontend with a Node.js/Express backend, real-time WebSocket communication, and PostgreSQL database integration. It serves both customers looking to skip physical waiting lines and salon owners seeking to optimize their business operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with Radix UI components for consistent, accessible design
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for robust form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the full stack
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Real-time Communication**: WebSocket integration for live queue updates and notifications
- **API Design**: RESTful API endpoints with comprehensive CRUD operations

### Database Design
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Five main entities (Users, Salons, Services, Queues, Offers, Reviews) with proper foreign key relationships
- **Data Types**: Support for JSON fields for flexible data storage (operating hours, images arrays)
- **Migrations**: Automated database schema management through Drizzle Kit

### Authentication & Authorization
- **Strategy**: JWT tokens stored in localStorage with automatic token verification
- **Role-based Access**: Two user roles (customer/salon) with different permissions and interfaces
- **Session Management**: Persistent authentication state across browser sessions
- **Security**: Password hashing with bcrypt and secure token validation

### Real-time Features
- **WebSocket Server**: Integrated with HTTP server for real-time queue position updates
- **Client Management**: Connection mapping for targeted message delivery
- **Event Types**: Queue updates and general notifications broadcast to relevant users
- **Connection Handling**: Automatic reconnection and authentication on WebSocket connections

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity optimized for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations with PostgreSQL support
- **@tanstack/react-query**: Server state management with caching and synchronization

### UI Component Libraries
- **@radix-ui/react-***: Comprehensive suite of accessible, unstyled UI primitives including dialogs, dropdowns, forms, and navigation components
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Type-safe utility for managing CSS class variants

### Authentication & Security
- **jsonwebtoken**: JWT token generation and verification for user authentication
- **bcryptjs**: Password hashing and verification for secure user authentication

### Development & Build Tools
- **vite**: Fast build tool and development server with hot module replacement
- **tsx**: TypeScript execution environment for development
- **esbuild**: Fast JavaScript bundler for production builds

### Form & Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Integration layer between react-hook-form and validation libraries
- **zod**: Schema validation library with TypeScript integration via drizzle-zod

### Real-time Communication
- **ws**: WebSocket library for real-time bidirectional communication
- **connect-pg-simple**: PostgreSQL session store for Express sessions (if needed for fallback authentication)

### Utility Libraries
- **date-fns**: Date manipulation and formatting utilities
- **clsx**: Utility for constructing className strings conditionally
- **cmdk**: Command palette component for enhanced user interactions