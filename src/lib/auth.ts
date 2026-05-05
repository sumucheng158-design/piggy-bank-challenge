import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { createUser, getUserByName, linkAuthIdToUser } from "./firestore";

/**
 * 確保目前有匿名登入的 Firebase Auth session。
 * 回傳 Firebase Auth user。
 */
export async function ensureAnonymousAuth(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}

/**
 * 以名字開始挑戰：
 * 1. 確保有 Firebase Auth uid
 * 2. 建立或取得 Firestore user 文件（綁定 uid）
 * 回傳 { userId, userName }
 */
export async function startChallenge(
  name: string
): Promise<{ userId: string; userName: string }> {
  const firebaseUser = await ensureAnonymousAuth();
  const uid = firebaseUser.uid;

  // 嘗試以 uid 查找既有帳號（避免重複建立）
  const existing = await getUserByName(uid);
  if (existing) {
    return { userId: existing.id, userName: existing.name };
  }

  // 全新帳號
  const user = await createUser(name, uid);
  return { userId: user.id, userName: user.name };
}

/**
 * 以名字查詢已存在的帳號（換裝置/清除 localStorage 補救）
 * 回傳找到的使用者或 null
 */
export async function recoverByName(
  name: string
): Promise<{ userId: string; userName: string } | null> {
  const firebaseUser = await ensureAnonymousAuth();
  const uid = firebaseUser.uid;

  const found = await getUserByName(uid, name);
  if (!found) return null;

  // 把目前的 uid 關聯到找到的帳號
  await linkAuthIdToUser(found.id, uid);
  return { userId: found.id, userName: found.name };
}
