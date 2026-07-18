module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((react-native|@react-native|@react-navigation|expo|@expo|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-webview|react-native-worklets|expo-modules-core|immer|expo-font|expo-asset|expo-constants|react-redux|expo-image-picker|expo-image-manipulator|expo-notifications|@react-native-community/datetimepicker))/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^@/config/environment$': '<rootDir>/src/config/__mocks__/environment',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}',
  ],
  testPathIgnorePatterns: ['node_modules', 'android', 'ios', '.expo'],
};
