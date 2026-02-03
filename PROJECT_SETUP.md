# Welo Platform - React Frontend

A comprehensive data annotation platform with role-based access control, workflow management, and multi-file rendering capabilities.

## Project Status

### ✅ Completed
- **Database Schema**: Full Supabase database with 14 tables, RLS policies, and audit logging
- **Authentication System**: Supabase Auth integration with email/password, signup, role-based redirects
- **Redux Store**: Centralized state management with auth slice
- **Routing**: React Router with protected routes and role-based access control
- **Core Pages**: Login, Signup, Admin Dashboard
- **Layout Component**: Responsive sidebar navigation with role-specific menu items
- **TypeScript Types**: Complete type definitions for all entities

### 🚧 In Progress
The foundation is built and the app successfully compiles. Next phases include:
- Project Manager dashboard and CRUD operations
- Visual workflow builder with drag-and-drop
- Dynamic question builder (7+ question types)
- Multi-file rendering engine (Text, CSV, Audio, Video, Image)
- Annotator portal with FIFO queue
- Reviewer portal with consensus views
- Performance dashboards and analytics

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx              # Main layout with sidebar
│   └── ProtectedRoute.tsx      # Route guard component
├── hooks/
│   ├── useAuth.ts              # Authentication hook
│   └── useRedux.ts             # Typed Redux hooks
├── lib/
│   └── supabase.ts             # Supabase client configuration
├── pages/
│   ├── Login.tsx               # Login page
│   ├── Signup.tsx              # Signup page
│   └── admin/
│       └── AdminDashboard.tsx  # Admin dashboard
├── store/
│   ├── index.ts                # Redux store configuration
│   └── authSlice.ts            # Authentication state slice
├── types/
│   └── index.ts                # TypeScript type definitions
├── App.tsx                     # Main app component with routes
└── main.tsx                    # App entry point
```

## Database Schema

The platform includes a comprehensive Supabase database with:

### Core Tables
- **users**: Platform users with role-based access (ADMIN, PROJECT_MANAGER, REVIEWER, ANNOTATOR, CUSTOMER)
- **customers**: Workspace/organization management
- **projects**: Annotation projects with workflow configuration
- **batches**: Task batch grouping within projects
- **tasks**: Individual annotation tasks
- **task_files**: File metadata and signed URLs
- **assignments**: Task assignments to users
- **annotations**: User annotations on tasks
- **annotation_responses**: Individual question responses
- **reviews**: Review approvals/rejections
- **review_comments**: Reviewer feedback
- **audit_logs**: System activity tracking
- **workflow_configurations**: Project workflow settings
- **user_statistics**: Cached performance metrics

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access policies
- Users can only access data within assigned projects/tasks
- Admins have full access
- Secure by default with explicit access grants

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
Create a `.env` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Database setup**:
The database schema has already been applied to your Supabase project with all necessary tables, RLS policies, and indexes.

4. **Run development server**:
```bash
npm run dev
```

5. **Build for production**:
```bash
npm run build
```

## User Roles & Permissions

### Admin
- Full platform access
- User management
- System configuration
- Analytics and monitoring
- Audit log access

### Project Manager (Ops Manager)
- Create and manage projects
- Configure workflows
- Build annotation questions
- Upload batches
- Team management
- Project analytics

### Reviewer
- Access review queue
- Approve/reject annotations
- Provide feedback
- View consensus metrics
- Bulk review operations

### Annotator
- Pull tasks from queue (FIFO)
- Annotate various file types
- Submit annotations
- View performance metrics
- Auto-save drafts

## Features

### Authentication
- Email/password signup and login
- Role-based access control
- Protected routes
- Session management
- Auto-redirect based on user role

### Dashboard Views
- **Admin Dashboard**: System overview, user management, analytics
- **Ops Manager Dashboard**: Project management, workflow builder, batch upload
- **Reviewer Dashboard**: Review queue, consensus views, bulk operations
- **Annotator Dashboard**: Task queue, performance metrics, history

### Workflow System
- Configurable review levels
- Multi-annotator consensus support
- FIFO queue management
- State machine-based workflow
- Automatic task routing

### File Support (Planned)
- Text documents
- CSV/Excel files
- Audio files with waveform
- Video files with player controls
- Images with zoom/pan
- PDF documents

## API Integration (Planned)

The frontend is designed to integrate with backend microservices:
- **Auth Service** (Port 3002): JWT authentication, RBAC
- **Project Management** (Port 3004): Projects, batches, users
- **Task Management** (Port 3003): Tasks, assignments, annotations
- **Workflow Engine** (Port 3007): XState workflow orchestration

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Tailwind CSS for styling
- ESLint for code quality

## Next Steps

1. **Project Manager Portal**: Build project CRUD, workflow builder, question builder
2. **File Renderers**: Implement multi-file rendering engine
3. **Annotator Portal**: Build task queue and annotation editor
4. **Reviewer Portal**: Build review queue and consensus views
5. **Analytics**: Add charts and performance dashboards
6. **Real-time**: WebSocket integration for live updates

## Contributing

When contributing to this project:
1. Follow existing code structure and patterns
2. Use TypeScript for all new files
3. Add proper type definitions
4. Test authentication flows
5. Ensure RLS policies are respected
6. Document complex components

## License

Proprietary - Welo Platform Team

## Support

For questions or issues, refer to:
- Full specification in `README.md`
- Backend API documentation
- Supabase dashboard for database management
