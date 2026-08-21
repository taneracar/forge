// AsyncStorage is a native module; without its shipped mock any test that
// transitively imports `lib/supabase` fails at import time rather than in the
// code under test.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// `createClient` runs at import time and rejects an empty URL. Tests never
// reach the network — this only needs to be well-formed, not real.
process.env.EXPO_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
