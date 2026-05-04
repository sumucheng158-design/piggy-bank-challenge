import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  FieldValue,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface User {
  id: string;
  name: string;
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
  createdAt: FieldValue;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function createUser(name: string): Promise<User> {
  const usersRef = collection(db, "users");
  const newDocRef = doc(usersRef);
  const userData: UserWriteData = {
    name,
    createdAt: serverTimestamp(),
  };
  await setDoc(newDocRef, userData);
  return { id: newDocRef.id, name, createdAt: null };
}

export async function getUser(userId: string): Promise<User | null> {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<User, "id">) };
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
