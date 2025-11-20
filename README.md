# 🔦 Beacon - Community Lost & Found Platform

> Reconnecting people with their belongings through technology, community, and verified safe exchanges.

Beacon is a modern, community-driven lost and found platform that combines interactive mapping, secure messaging, and gamification to help people recover lost items and return found belongings to their rightful owners.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Key Features

### 🗺️ **Interactive Location-Based Map**
- Browse all lost and found items on a real-time interactive map
- Filter by item type (lost/found), category, and date range
- Powered by Leaflet and OpenStreetMap for accurate geolocation
- Cluster markers for better visualization in dense areas

### 💬 **Secure Messaging System**
- Built-in encrypted chat between item owners and finders
- Real-time message notifications
- Content moderation with keyword filtering
- Safety tips and warnings built into the chat interface
- Block and report functionality for user safety

### 🔔 **Smart Notifications**
- Real-time push notifications for:
  - New item claims
  - Incoming messages
  - Item resolution confirmations
  - System announcements
- Notification center with read/unread tracking
- Email notifications (optional)

### 🏆 **Karma & Reputation System**
- Earn karma points for helping others
- Build trust through verified transactions
- Public reputation scores visible on profiles
- Badges for community milestones
- Review system for completed exchanges

### 🛡️ **Safe Haven Network**
- Curated list of verified public meeting locations
- Police stations, libraries, coffee shops, and community centers
- Interactive map showing nearby safe havens
- User-contributed locations with admin verification

### 🌍 **Bilingual Support**
- Full internationalization (i18n) support
- English and Spanish languages
- Easy to extend to additional languages
- Language switcher in navigation

### 📊 **Admin Dashboard**
- Comprehensive user management
- Item moderation and verification
- Analytics and reporting
- Test message functionality
- Sample data for development

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.0 or higher
- npm, yarn, or pnpm
- A Supabase account (optional for production, mock mode available for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/laresbernardo/beacon.git
   cd beacon
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   
   ```env
   # For production with Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # For local development (mock mode)
   NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=example-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Setup

### Supabase Schema

Run the SQL schema from `schema.sql` in your Supabase SQL editor to create all required tables:

**Tables:**
- `profiles` - User profiles, karma, and verification status
- `items` - Lost and found item listings
- `messages` - Chat messages between users
- `notifications` - User notification queue
- `safe_havens` - Verified meeting locations

**Key Features:**
- Row Level Security (RLS) policies for data protection
- Database triggers for automatic profile creation
- Indexed columns for optimized queries
- Referential integrity with foreign keys

### Mock Mode (Development)

For local development without a Supabase instance:

1. Set mock credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=example-key
   ```

2. The app automatically uses `localStorage` for data persistence
3. Sample data can be toggled from the Admin Dashboard
4. Full CRUD operations supported in mock mode

---

## 📱 Application Structure

### Key Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Home page with interactive map | No |
| `/explore` | Browse and search all items | No |
| `/report` | Report a lost or found item | Yes |
| `/item/[id]` | Item detail page | No |
| `/chat` | Message inbox | Yes |
| `/chat/[id]` | Conversation thread | Yes |
| `/profile/[userId]` | User profile and activity | No |
| `/safe-havens` | Safe meeting locations | No |
| `/how-it-works` | Documentation and guidelines | No |
| `/admin` | Admin dashboard | Admin only |
| `/login` | User login | No |
| `/signup` | User registration | No |

### Component Architecture

```
src/
├── app/                    # Next.js app directory
│   ├── (pages)/           # Main application routes
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Auth callbacks
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # UI primitives
│   ├── Map.tsx           # Main map component
│   ├── ItemCard.tsx      # Item display card
│   └── ...
├── lib/                   # Utilities and services
│   ├── supabase/         # Database client
│   ├── i18n/             # Internationalization
│   └── notifications/    # Notification system
└── styles/               # Global styles
```

---

## 🎨 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Maps**: Leaflet + React Leaflet + OpenStreetMap

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage (for images)

### Development
- **Package Manager**: npm
- **Linting**: ESLint (Next.js config)
- **Type Checking**: TypeScript strict mode
- **Version Control**: Git

---

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Content Moderation**: Automated keyword filtering in messages
- **Safe Havens**: Verified public meeting locations only
- **User Reporting**: Report inappropriate content or users
- **Email Verification**: Required for account creation
- **Data Privacy**: GDPR-compliant data handling
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Next.js built-in protections

---

## 🎯 User Flows

### Reporting a Lost Item
1. User logs in and clicks "Report Item"
2. Selects "Lost" and item category
3. Uploads photos (optional but recommended)
4. Pins location on map where item was lost
5. Adds description and reward amount
6. Submits report

### Claiming a Found Item
1. User browses map or explore page
2. Clicks on a lost item matching what they found
3. Clicks "This Is Mine" button
4. Initiates chat with the finder
5. Arranges meeting at a Safe Haven
6. Both parties confirm resolution

### Finding and Returning an Item
1. User finds an item and clicks "Report Item"
2. Selects "Found" and item category
3. Uploads photos (mandatory for found items)
4. Pins location on map where item was found
5. Chooses return method (Chat, Pickup, or Left It)
6. Item appears on map for owners to claim

---

## 🛠️ Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

### Code Style
- Use TypeScript for type safety
- Follow Next.js best practices
- Use Tailwind CSS for styling
- Keep components small and reusable
- Write meaningful commit messages

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/laresbernardo/beacon)

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

---

## 📖 Documentation

- [Database Schema](./schema.sql) - Complete database structure
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [How It Works](http://localhost:3000/how-it-works) - User guide (in-app)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Bernardo Lares**
- GitHub: [@laresbernardo](https://github.com/laresbernardo)
- Website: [laresbernardo.com](https://laresbernardo.com)

---

## 🙏 Acknowledgments

- OpenStreetMap for mapping data
- Supabase for backend infrastructure
- Leaflet for map implementation
- Next.js team for the amazing framework
- Community contributors

---

## 📊 Project Status

- ✅ MVP Complete
- ✅ Core features implemented
- ✅ Mock mode for development
- ✅ Bilingual support (EN/ES)
- 🚧 Mobile app (planned)
- 🚧 AI-powered image matching (planned)
- 🚧 Payment integration (planned)

---

<div align="center">
  <strong>Built with ❤️ for the community</strong>
</div>
