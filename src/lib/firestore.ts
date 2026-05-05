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
  FieldValue,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

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

// Internal type used only when writing to Firestore
interface UserWriteData {
  name: string;
  authUid: string;
  createdAt: FieldValue;
}

// ── Users ──────────────────────────────────────────────────────────────────

/**
 * 建立新使用者，綁定 Firebase Auth uid。
 */
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
 * 以 Firebase Auth uid 查詢使用者（防止重複建立帳號）。
 * 若傳入 name，則同時比對名字（用於換裝置後的帳號補救）。
 */
export async function getUserByName(
  authUid: string,
  name?: string
): Promise<User | null> {
  const constraints = [where("authUid", "==", authUid)];
  if (name) constraints.push(where("name", "==", name));
  const q = query(collection(db, "users"), ...constraints);
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

/**
 * 當使用者換裝置後重新登入，更新帳號上的 authUid。
 */
export async function linkAuthIdToUser(
  userId: string,
  authUid: string
): Promise<void> {
  const ref = doc(db, "users", userId);
  await updateDoc(ref, { authUid });
}

// ── CheckIns ───────────────────────────────────────────────────────────────

export async function getCheckins(userId: string): Promise<CheckIn[]> {
  const q = query(
    collection(db, "checkins"),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as CheckIn);
}

export async function toggleCheckin(
  userId: string,
  date: string,
  completed: boolean
): Promise<void> {
  // Use a deterministic doc id so we never create duplicates
  const docId = `${userId}_${date}`;
  const ref = doc(db, "checkins", docId);
  await setDoc(ref, { userId, date, completed }, { merge: true });
}
