import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  limit,
  FieldValue,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  CHALLENGE_YEAR,
  CHALLENGE_MONTH,
  CHALLENGE_TOTAL_DAYS,
  BACKDATING_DAYS,
} from "./config";

export interface User {
  id: string;
  name: string;
  authUid: string;
  pin: string;           // #1 — 4位數字 PIN，防止同名帳號衝突
  goal?: string;         // #11 — 存錢目標
  createdAt: Timestamp | null;
}

export interface CheckIn {
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

interface UserWriteData {
  name: string;
  authUid: string;
  pin: string;
  goal?: string;
  createdAt: FieldValue;
}

// ── 日期合法性驗證（#2 修正：允許 BACKDATING_DAYS 天內補打） ────────────────

/**
 * 驗證 date 字串是否為合法的挑戰日期：
 * - 格式必須為 YYYY-MM-DD
 * - 必須落在活動期間內
 * - 不允許打卡未來日期
 * - 允許往前 BACKDATING_DAYS 天補打
 */
function isValidChallengeDate(date: string): boolean {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(date)) return false;

  const [y, m, d] = date.split("-").map(Number);
  if (
    y !== CHALLENGE_YEAR ||
    m !== CHALLENGE_MONTH ||
    d < 1 ||
    d > CHALLENGE_TOTAL_DAYS
  ) {
    return false;
  }

  const cellDate = new Date(y, m - 1, d);
  const todayTW = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" })
  );
  todayTW.setHours(0, 0, 0, 0);

  // 不允許未來日期
  if (cellDate > todayTW) return false;

  // 不允許超過 BACKDATING_DAYS 天前的補打
  const earliestAllowed = new Date(todayTW);
  earliestAllowed.setDate(earliestAllowed.getDate() - BACKDATING_DAYS);
  return cellDate >= earliestAllowed;
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function createUser(
  name: string,
  authUid: string,
  pin: string,
  goal?: string
): Promise<User> {
  const usersRef = collection(db, "users");
  const newDocRef = doc(usersRef);
  const userData: UserWriteData = {
    name,
    authUid,
    pin,
    ...(goal ? { goal } : {}),
    createdAt: serverTimestamp(),
  };
  await setDoc(newDocRef, userData);
  return { id: newDocRef.id, name, authUid, pin, goal, createdAt: null };
}

export async function getUserByAuthUid(
  authUid: string
): Promise<User | null> {
  const q = query(
    collection(db, "users"),
    where("authUid", "==", authUid),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<User, "id">) };
}

/**
 * 以名字查詢使用者（帳號補救用）。
 * #1 — 找到後還需比對 PIN 才算成功，防止同名帳號衝突。
 */
export async function getUserByNameAndPin(
  name: string,
  pin: string
): Promise<User | null> {
  const q = query(
    collection(db, "users"),
    where("name", "==", name),
    where("pin", "==", pin),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<User, "id">) };
}

export async function getUser(userId: string): Promise<User | null> {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<User, "id">) };
}

export async function linkAuthIdToUser(
  userId: string,
  authUid: string
): Promise<void> {
  const ref = doc(db, "users", userId);
  await updateDoc(ref, { authUid });
}

// ── CheckIns ─────────────────────────────────────────────────────────────────

export async function getCheckins(userId: string): Promise<CheckIn[]> {
  const q = query(
    collection(db, "checkins"),
    where("userId", "==", userId),
    limit(CHALLENGE_TOTAL_DAYS)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as CheckIn);
}

export async function toggleCheckin(
  userId: string,
  date: string,
  completed: boolean
): Promise<void> {
  if (!isValidChallengeDate(date)) {
    throw new Error(`非法打卡日期：${date}`);
  }
  const docId = `${userId}_${date}`;
  const ref = doc(db, "checkins", docId);
  await setDoc(ref, { userId, date, completed }, { merge: true });
}
