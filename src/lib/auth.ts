import { signInAnonymously, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import {
  createUser,
  getUserByAuthUid,
  getUserByNameAndPin,
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
 * #4 — 登出時同時清除 Firebase Anonymous Auth session，
 * 確保同一裝置可以建立新的獨立帳號。
 */
export async function signOutAnonymous(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("[Auth] signOut 失敗（忽略）：", err);
  }
}

/**
 * 以名字和 PIN 開始挑戰。
 * #1 — PIN 作為第二因子，防止同名帳號混淆。
 */
export async function startChallenge(
  name: string,
  pin: string,
  goal?: string
): Promise<{ userId: string; userName: string; goal?: string }> {
  const firebaseUser = await ensureAnonymousAuth();
  const uid = firebaseUser.uid;

  // 同一裝置已有帳號 → 直接回傳，不重複建立
  const existing = await getUserByAuthUid(uid);
  if (existing) {
    return { userId: existing.id, userName: existing.name, goal: existing.goal };
  }

  // 全新帳號
  const user = await createUser(name, uid, pin, goal);
  return { userId: user.id, userName: user.name, goal: user.goal };
}

/**
 * 以名字 + PIN 找回帳號（換裝置 / 清除 localStorage 補救）。
 * #1 — PIN 驗證防止同名帳號被他人搶佔。
 */
export async function recoverByNameAndPin(
  name: string,
  pin: string
): Promise<{ userId: string; userName: string; goal?: string } | null> {
  const firebaseUser = await ensureAnonymousAuth();
  const uid = firebaseUser.uid;

  const found = await getUserByNameAndPin(name, pin);
  if (!found) return null;

  await linkAuthIdToUser(found.id, uid);
  return { userId: found.id, userName: found.name, goal: found.goal };
}
