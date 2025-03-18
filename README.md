# TimeBank - Community Skill Exchange Platform

TimeBank is a modern web application that allows users to exchange time credits for services within their community. Users can offer their skills, request services from others, and build connections while helping each other.

## Features

- **User Authentication**: Secure signup, signin, and profile management
- **Service Listings**: Browse, filter, and search for available services
- **Time Credit System**: Earn credits by providing services and spend them to receive help
- **Service Requests**: Request services from other users and manage your requests
- **User Dashboard**: Track your services, requests, and time credits
- **Real-time Updates**: All data (credits, listings, reviews) updates in real-time

## Technology Stack

- **Frontend**: Next.js (React), Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **Icons**: React Icons (Feather Icons)
- **Deployment**: Vercel (or similar)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/time-bank.git
   cd time-bank
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Set up Firestore security rules:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       match /services/{serviceId} {
         allow read;
         allow create: if request.auth != null;
         allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.providerId;
       }
       match /serviceRequests/{requestId} {
         allow read: if request.auth != null && 
                     (request.auth.uid == resource.data.requesterId || 
                      request.auth.uid == resource.data.providerId);
         allow create: if request.auth != null;
         allow update: if request.auth != null && 
                       (request.auth.uid == resource.data.requesterId || 
                        request.auth.uid == resource.data.providerId);
       }
       match /reviews/{reviewId} {
         allow read;
         allow create: if request.auth != null;
         allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.reviewerId;
       }
     }
   }
   ```

## Project Structure

```
time-bank/
├── public/                  # Static files
├── src/                     # Source code
│   ├── app/                 # Next.js app router
│   │   ├── auth/            # Authentication pages
│   │   ├── dashboard/       # User dashboard
│   │   ├── services/        # Service listings and creation
│   │   ├── profile/         # User profile
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Homepage
│   │   └── providers.tsx    # Context providers
│   ├── components/          # React components
│   │   ├── auth/            # Authentication components
│   │   ├── layout/          # Layout components
│   │   ├── profile/         # Profile components
│   │   └── services/        # Service components
│   ├── firebase/            # Firebase configuration and hooks
│   │   ├── config.ts        # Firebase initialization
│   │   ├── auth.ts          # Authentication functions
│   │   ├── services.ts      # Service-related functions
│   │   └── AuthContext.tsx  # Authentication context
│   └── styles/              # Global styles
├── .env.local               # Environment variables (not in repo)
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── package.json             # Project dependencies
```

## Future Enhancements

- **Mobile App**: Develop a mobile application using React Native
- **Notifications**: Implement real-time notifications for service requests and messages
- **Messaging**: Add direct messaging between users
- **Blockchain Integration**: Implement a blockchain-based time credit system
- **Community Groups**: Allow users to create and join community groups
- **Service Categories**: Expand service categories and add subcategories
- **Advanced Search**: Implement location-based search and filtering

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [TimeRepublik](https://www.timerepublik.com/) and TimeBanks USA
- Built for a government-supported initiative at Omninvention
- Designed to be donated to a Non-Profit organization in the Toronto GTA
