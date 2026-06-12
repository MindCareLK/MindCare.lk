import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function initializeCollections() {
  if (!db) {
    console.warn("Firestore not initialized");
    return;
  }

  try {
    // Create members collection with a sample doc (will be deleted later)
    await setDoc(doc(collection(db, "members"), "_setup"), {
      createdAt: new Date(),
    });

    // Create counselors collection with a sample doc
    await setDoc(doc(collection(db, "counselors"), "_setup"), {
      createdAt: new Date(),
    });

    // Create appointments collection with a sample doc
    await setDoc(doc(collection(db, "appointments"), "_setup"), {
      createdAt: new Date(),
    });

    // Create notifications collection with a sample doc
    await setDoc(doc(collection(db, "notifications"), "_setup"), {
      createdAt: new Date(),
    });

    console.log("Collections initialized successfully");
  } catch (error) {
    console.error("Error initializing collections:", error);
  }
}
