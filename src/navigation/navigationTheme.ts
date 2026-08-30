import { Theme } from '@/theme';

/** Navigation theme applied to NavigationContainer */
export const navigationTheme = {
  dark: false,
  colors: {
    primary: Theme.colors.primary,
    background: Theme.colors.background.primary,
    card: Theme.colors.background.primary,
    text: Theme.colors.text.primary,
    border: Theme.colors.border,
    notification: Theme.colors.primary,
  },
};

/** Default stack screen options (no headers, themed background) */
export const stackScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: Theme.colors.background.primary },
};
