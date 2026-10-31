// Jest setup for the Seivio mobile application.
// Registers @testing-library/react-native matchers (e.g. toBeInTheDocument)
// and replaces native-only modules with their Jest-safe implementations.

require("@testing-library/react-native/extend-expect");

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock Share module
jest.mock("react-native/Libraries/Share/Share", () => ({
  share: jest.fn().mockResolvedValue({ action: "sharedAction" }),
  dismiss: jest.fn().mockResolvedValue(undefined),
  sharedAction: jest.fn().mockResolvedValue({ action: "sharedAction" }),
}));

// @expo/vector-icons relies on the native font loader, which is unavailable in
// Jest (it throws "loadedNativeFonts.forEach is not a function"). Render the
// icons as plain, inert Text elements instead — tests assert on text and
// testIDs, not on glyphs, so the visual behaviour is unaffected.
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const createIcon = () => {
    const Icon = ({ testID }) => React.createElement(Text, { testID }, null);
    return Icon;
  };

  const Ionicons = createIcon();

  return {
    __esModule: true,
    default: Ionicons,
    Ionicons,
    MaterialIcons: createIcon(),
    MaterialCommunityIcons: createIcon(),
    FontAwesome: createIcon(),
    FontAwesome5: createIcon(),
    Fontisto: createIcon(),
    Feather: createIcon(),
    AntDesign: createIcon(),
    Entypo: createIcon(),
    EvilIcons: createIcon(),
    Foundation: createIcon(),
    Octicons: createIcon(),
    SimpleLineIcons: createIcon(),
    Zocial: createIcon(),
  };
});
