// resetAll.ts
import * as FileSystem from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";

export async function resetAll() {
  // 1) AsyncStorage
  try { await AsyncStorage.clear(); } catch {}

  // 2) SecureStore (you must know the keys you used)
  const secureKeys = ["auth_token", "refresh_token", "user_profile"]; // <- your keys
  await Promise.all(secureKeys.map(k => SecureStore.deleteItemAsync(k).catch(() => {})));

  // 3) SQLite (delete your DB file if you use it)
  try {
    // @ts-ignore
    const dbNames = ["app.db"]; // <- your db file(s)
    for (const name of dbNames) {
      const path = `${FileSystem.documentDirectory}SQLite/${name}`;
      const exists = await FileSystem.getInfoAsync(path);
      if (exists.exists) await FileSystem.deleteAsync(path, { idempotent: true });
    }
  } catch {}

  // 4) App document dir & caches (be careful: removes your saved files)
  try { await FileSystem.deleteAsync(FileSystem.documentDirectory!, { idempotent: true }); } catch {}
  try { await FileSystem.deleteAsync(FileSystem.cacheDirectory!, { idempotent: true }); } catch {}

  // 5) (Optional) MMKV/other libs: call their clear APIs here.
}