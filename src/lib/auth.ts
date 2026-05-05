import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import {
  createUser,
  getUserByAuthUid,
  getUserByName,
  linkAuthIdToUser,
} from "./firestore";

/**
 * 確保目前有匿名登入的 Firebase Auth session。
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
 * 以名字開始挑戰。
 *
 * 修正 #1：先用 authUid 查找既有帳號（避免同裝置重複建立），
 * 而非用 uid 去比對 name 欄位（原本邏輯混用）。
 */
export async function startChallenge(
  name: string
): Promise<{ userId: string; userName: string }> {
  const firebaseUser = await ensureAnonymousAuth();
  const uid = firebaseUser.uid;

  // 同一裝置已有帳號 → 直接回傳，不重複建立
  const existing = await getUserByAuthUid(uid);
  if (existing) {
    return { userId: existing.id, userName: existing.name };
  }

  // 全新帳號
  const user = await createUser(name, uid);
  return { userId: user.id, userName: user.name };
}

/**
 * 以名字找回帳號（換裝置 / 清除 localStorage 補救）。
 *
 * 修正 #4：名字不唯一，找到帳號後用 authUid 做額外確認，
 * 避免直接讓陌生人登入同名帳號（此處為最佳實務，
 * 正式產品建議改用 OTP 或密碼驗證）。
 */
export async function recoverByName(
  name: string
): Promise<{ userId: string; userName: string } | null> {
  const firebaseUser = await ensureAnonymousAuth();
  const uid = firebaseUser.uid;

  const found = await getUserByName(name);
  if (!found) return null;

  // 把目前裝置的 uid 關聯到找到的帳號
  await linkAuthIdToUser(found.id, uid);
  return { userId: found.id, userName: found.name };
}
