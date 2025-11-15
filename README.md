# 🏨 Hotel Booking App

A modern, full-stack hotel booking application built with Next.js, TypeScript, Prisma, MongoDB, and Stripe. Features a complete booking system with user authentication, room management, payment processing, and admin analytics.

## ✨ Features

### 🎯 Core Features
- **User Authentication**: Secure login/signup with JWT tokens
- **Room Management**: Browse, search, and filter available rooms
- **Booking System**: Real-time availability checking and booking management
- **Payment Processing**: Secure payments via Stripe integration
- **Admin Dashboard**: Comprehensive analytics and room management
- **Review System**: User reviews and ratings for rooms

### 🚀 Advanced Features
- **Real-time Availability**: Dynamic room availability checking
- **Advanced Search**: Filter by dates, price, amenities, and room type
- **Booking Management**: Modify, cancel, and track bookings
- **Analytics Dashboard**: Revenue tracking, occupancy rates, and performance metrics
- **Audit Logging**: Complete activity tracking for security
- **Rate Limiting**: API protection against abuse
- **Security Headers**: Production-ready security configuration

### 🛡️ Security Features
- Input validation and sanitization
- Rate limiting on API endpoints
- Security headers (CSP, HSTS, etc.)
- Audit logging for all user actions
- JWT-based authentication
- Password hashing with bcrypt

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (MongoDB)     │
│   TypeScript    │    │   Prisma ORM    │    │   Prisma Client │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Stripe        │    │   File Storage   │    │   Email Service  │
│   Payments      │    │   (Optional)     │    │   (Optional)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- Stripe account for payments

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hotel-booking-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/hotel-booking-app"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# Stripe Payment Processing
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"

# SMTP Email Configuration (for email verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="Feudo Nobile <noreply@feudo.nobile.com>"

# Application Settings
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe dashboard
3. Add them to your `.env.local` file
4. Configure webhook endpoints for payment confirmation

### SMTP Email Setup

The application uses Nodemailer for sending verification emails. Configure SMTP settings in your `.env.local` file.

#### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
   - Copy the generated password
3. **Add to `.env.local`**:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-app-password-here"
   SMTP_FROM="Feudo Nobile <your-email@gmail.com>"
   ```

#### Other SMTP Providers

For other providers (SendGrid, Mailgun, AWS SES, etc.), update the SMTP settings accordingly:

- **SendGrid**: `smtp.sendgrid.net`, port `587`
- **Mailgun**: `smtp.mailgun.org`, port `587`
- **AWS SES**: `email-smtp.region.amazonaws.com`, port `587`

**Note**: If SMTP is not configured, the application will log verification URLs to the console in development mode.

## 📱 Usage

### For Users
1. **Sign Up/Login**: Create an account or log in
2. **Browse Rooms**: View available rooms with filters
3. **Book a Room**: Select dates and complete payment
4. **Manage Bookings**: View, modify, or cancel bookings
5. **Leave Reviews**: Rate and review your stay

### For Admins
1. **Access Admin Dashboard**: Login with admin credentials
2. **Manage Rooms**: Add, edit, or delete rooms
3. **View Analytics**: Monitor bookings, revenue, and occupancy
4. **Track Activity**: Review audit logs and user activity

## 🐳 Docker Deployment

### Using Docker Compose

1. **Build and start services**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**
   ```bash
   docker-compose exec app npm run db:push
   ```

3. **Seed the database**
   ```bash
   docker-compose exec app npm run db:seed
   ```

### Using the deployment script

```bash
# Deploy with Docker
./deploy.sh deploy docker

# Check application health
./deploy.sh health

# Clean up resources
./deploy.sh cleanup docker
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=booking
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Room Endpoints
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/[id]` - Get room details
- `POST /api/rooms/availability` - Check room availability
- `POST /api/rooms` - Create room (admin)
- `PUT /api/rooms/[id]` - Update room (admin)
- `DELETE /api/rooms/[id]` - Delete room (admin)

### Booking Endpoints
- `GET /api/bookings` - Get all bookings (admin)
- `GET /api/bookings/user` - Get user bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Cancel booking

### Payment Endpoints
- `POST /api/stripe/checkout` - Create payment session
- `POST /api/stripe/confirm` - Confirm payment

### Analytics Endpoints
- `GET /api/analytics` - Get analytics data (admin)
- `GET /api/analytics/trends` - Get trend data (admin)

### System Endpoints
- `GET /api/health` - Health check
- `GET /api/audit` - Get audit logs (admin)

## 🛠️ Development

### Project Structure
```
hotel-booking-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── book/              # Booking pages
│   ├── dashboard/         # User dashboard
│   ├── rooms/             # Room pages
│   └── ...                # Other pages
├── lib/                   # Utility functions
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── components/            # Reusable components
└── tests/                 # Test files
```

### Database Schema

The application uses MongoDB with Prisma ORM. Key models include:

- **User**: User accounts and profiles
- **Room**: Hotel rooms with amenities and pricing
- **Booking**: Room reservations with payment info
- **Review**: User reviews and ratings
- **AuditLog**: System activity tracking

### Adding New Features

1. **Database Changes**: Update `prisma/schema.prisma`
2. **API Routes**: Create new routes in `app/api/`
3. **Frontend**: Add pages/components in `app/`
4. **Tests**: Write tests for new functionality

## 🚀 Production Deployment

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

### Using the deployment script

```bash
# Deploy to production
./deploy.sh deploy production

# Health check
./deploy.sh health
```

### Environment Setup

For production deployment:

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Configure proper Stripe keys
4. Set up SSL certificates
5. Configure reverse proxy (nginx)

## 🔒 Security Considerations

- **Environment Variables**: Never commit sensitive data
- **JWT Secrets**: Use strong, random secrets
- **Database Access**: Restrict database permissions
- **API Rate Limiting**: Implement rate limiting
- **Input Validation**: Validate all user inputs
- **HTTPS**: Always use HTTPS in production
- **Security Headers**: Configure proper security headers

## 📈 Performance Optimization

- **Image Optimization**: Use Next.js Image component
- **Database Indexing**: Add indexes for frequently queried fields
- **Caching**: Implement Redis for session storage
- **CDN**: Use CDN for static assets
- **Monitoring**: Set up application monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🎯 Roadmap

- [x] Email notifications (SMTP configured)
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Integration with booking systems
- [ ] Loyalty program
- [ ] Social login
- [ ] Real-time chat support

---

Built with ❤️ using Next.js, TypeScript, Prisma, MongoDB, and Stripe.
