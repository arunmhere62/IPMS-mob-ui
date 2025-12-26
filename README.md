# PG Management Mobile App

A comprehensive React Native mobile application for managing PG (Paying Guest) accommodations, built with Expo, Redux Toolkit, and NativeWind (Tailwind CSS).

## Features

- 🔐 **Authentication**: OTP-based login system
- 👥 **Tenant Management**: Add, view, update, and manage tenants
- 🏢 **PG Location Management**: Manage multiple PG properties
- 🛏️ **Room & Bed Management**: Track rooms and bed availability
- 💰 **Payment Tracking**: Monitor rent payments, advances, and refunds
- 💸 **Expense Management**: Track PG-related expenses
- 🚶 **Visitor Management**: Log and track visitors
- 📊 **Dashboard**: Real-time statistics and quick actions
- 🔄 **Redux State Management**: Centralized state with persistence
- 🎨 **Modern UI**: Beautiful interface with NativeWind/Tailwind CSS

## Tech Stack

- **Framework**: React Native with Expo
- **State Management**: Redux Toolkit with Redux Persist
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: React Navigation
- **HTTP Client**: RTK Query (fetch)
- **Language**: TypeScript

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator
- Expo Go app (for testing on physical devices)

## Installation

1. **Clone the repository**
   ```bash
   cd front-end
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your API base URL:
   ```
   API_BASE_URL=http://localhost:3000/api
   ```
   
   **Note**: For testing on physical devices, replace `localhost` with your computer's IP address.

## Running the App

### Development Mode

```bash
# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web
```

### Using Expo Go

1. Install Expo Go on your mobile device:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start the development server:
   ```bash
   npm start
   ```

3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## Project Structure

```
front-end/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── config/              # Configuration files
│   │   └── api.config.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useAppDispatch.ts
│   │   └── useAppSelector.ts
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── screens/             # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── OTPVerificationScreen.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx
│   │   ├── tenants/
│   │   │   └── TenantsScreen.tsx
│   │   ├── payments/
│   │   │   └── PaymentsScreen.tsx
│   │   └── pglocations/
│   │       └── PGLocationsScreen.tsx
│   ├── services/            # API services
│   │   ├── apiClient.ts
│   │   ├── authService.ts
│   │   ├── tenantService.ts
│   │   ├── pgLocationService.ts
│   │   └── paymentService.ts
│   ├── store/               # Redux store
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── tenantSlice.ts
│   │   │   ├── pgLocationSlice.ts
│   │   │   └── paymentSlice.ts
│   │   └── index.ts
│   └── types/               # TypeScript type definitions
│       └── index.ts
├── App.tsx                  # Root component
├── app.json                 # Expo configuration
├── package.json
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## API Integration

The app connects to the NestJS backend API. Ensure the backend is running before using the app.

### API Endpoints Used

- **Authentication**
  - `POST /auth/send-otp` - Send OTP
  - `POST /auth/verify-otp` - Verify OTP and login
  - `POST /auth/resend-otp` - Resend OTP

- **Tenants**
  - `GET /tenants` - Get all tenants
  - `POST /tenants` - Create tenant
  - `PUT /tenants/:id` - Update tenant
  - `DELETE /tenants/:id` - Delete tenant

- **PG Locations**
  - `GET /pg-locations` - Get all locations
  - `POST /pg-locations` - Create location

- **Payments**
  - `GET /tenant-payments` - Get all payments
  - `POST /tenant-payments` - Create payment

## State Management

The app uses Redux Toolkit for state management with the following slices:

- **authSlice**: User authentication and session management
- **tenantSlice**: Tenant data and operations
- **pgLocationSlice**: PG location management
- **paymentSlice**: Payment tracking

State is persisted using Redux Persist with AsyncStorage.

## Styling

The app uses NativeWind, which brings Tailwind CSS to React Native. You can use Tailwind utility classes directly in your components:

```tsx
<View className="flex-1 bg-light p-4">
  <Text className="text-2xl font-bold text-dark">Hello World</Text>
</View>
```

### Custom Colors

Defined in `tailwind.config.js`:
- `primary`: #3B82F6 (Blue)
- `secondary`: #10B981 (Green)
- `danger`: #EF4444 (Red)
- `warning`: #F59E0B (Orange)
- `dark`: #1F2937 (Dark Gray)
- `light`: #F9FAFB (Light Gray)

## Authentication Flow

1. User enters phone number
2. OTP is sent to the phone number
3. User enters OTP
4. On successful verification, user is logged in
5. Access token is stored and used for subsequent API calls
6. Token is automatically added to all API requests via RTK Query base headers

## Building for Production

### Android

```bash
# Build APK
expo build:android

# Build AAB (for Play Store)
expo build:android -t app-bundle
```

### iOS

```bash
# Build for iOS
expo build:ios
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   # Clear cache and restart
   expo start -c
   ```

2. **Network request failed**
   - Ensure backend API is running
   - Check API_BASE_URL in .env file
   - For physical devices, use your computer's IP address instead of localhost

3. **Module not found errors**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules
   npm install
   ```

4. **NativeWind styles not working**
   - Ensure babel.config.js includes 'nativewind/babel' plugin
   - Restart the development server

## Development Tips

1. **Hot Reload**: Shake your device or press `Cmd+D` (iOS) / `Cmd+M` (Android) to open developer menu
2. **Debugging**: Use React Native Debugger or Flipper for advanced debugging
3. **State Inspection**: Install Redux DevTools for state debugging

## Future Enhancements

- [ ] Push notifications for payment reminders
- [ ] Image upload for tenant documents
- [ ] PDF generation for receipts
- [ ] Offline mode support
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Analytics dashboard
- [ ] Export data to Excel/PDF

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue in the repository.

## Related Projects

- Backend API: `../api` - NestJS backend with Prisma ORM
