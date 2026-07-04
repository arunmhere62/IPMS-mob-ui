import { registerRootComponent } from 'expo';
import { Text, TextInput } from 'react-native';

// Disable system font scaling before any UI is imported or rendered
Text.defaultProps = {
  ...Text.defaultProps,
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};

TextInput.defaultProps = {
  ...TextInput.defaultProps,
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
