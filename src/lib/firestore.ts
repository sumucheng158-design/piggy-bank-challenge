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
} from "./config";

export interface User {
  id: string;
  name: string;
  authUid: string;
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
  createdAt: FieldValue;
}

// ── 日期合法性驗證 (#2) ──────────────────────────────────────────────────────

/**
 * 驗證 date 字串是否為合法的挑戰日期：
 * - 格式必須為 YYYY-MM-DD
 * - 必須落在活動期間內（不允許未來日期相對今天台灣時）
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

  // 不允許打卡未來日期（以台灣時間為準）
  const cellDate = new Date(y, m - 1, d);
  const todayTW = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" })
  );
  todayTW.setHours(0, 0, 0, 0);
  return cellDate <= todayTW;
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function createUser(name: string, authUid: string): Promise<User> {
  const usersRef = collection(db, "users");
  const newDocRef = doc(usersRef);
  const userData: UserWriteData = {
    name,
    authUid,
    createdAt: serverTimestamp(),
  };
  await setDoc(newDocRef, userData);
  return { id: newDocRef.id, name, authUid, createdAt: null };
}

/**
 * 以 Firebase Auth uid 查詢使用者。
 * 若傳入 name，則同時比對名字（換裝置後的補救流程）。
 */
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
 * 注意：名字不唯一，只取第一筆。
 */
export async function getUserByName(name: string): Promise<User | null> {
  const q = query(
    collection(db, "users"),
    where("name", "==", name),
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

/**
 * 取得指定使用者的打卡紀錄。
 * limit(CHALLENGE_TOTAL_DAYS) 防止超大資料集 (#13)。
 */
export async function getCheckins(userId: string): Promise<CheckIn[]> {
  const q = query(
    collection(db, "checkins"),
    where("userId", "==", userId),
    limit(CHALLENGE_TOTAL_DAYS)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as CheckIn);
}

/**
 * 切換打卡狀態。
 * 伺服器端驗證日期合法性，拒絕非法請求 (#2)。
 */
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
