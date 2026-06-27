import axios from "axios";
import { db } from "../lib/firebase";
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";

const API_KEY = process.env.EXPO_PUBLIC_BLOGGER_API_KEY;
const BLOG_ID = process.env.EXPO_PUBLIC_BLOGGER_BLOG_ID;

export const getArticles = async () => {
  if (!db) {
    const response = await axios.get(
      `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts?key=${API_KEY}`
    );
    return response.data.items || [];
  }

  try {
    // 1. Fetch live articles from Blogger API
    let bloggerItems = [];
    try {
      const response = await axios.get(
        `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts?key=${API_KEY}`
      );
      bloggerItems = response.data.items || [];
    } catch (e) {
      console.warn("Failed to fetch from Blogger API:", e);
    }

    // 2. Fetch all articles from Firestore
    const snap = await getDocs(collection(db, "articles"));
    const firestoreItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 3. Merge them (Blogger API is source of truth for content/images, Firestore for custom articles or edits)
    const mergedMap = new Map();

    firestoreItems.forEach(item => {
      mergedMap.set(item.id, item);
    });

    bloggerItems.forEach(item => {
      const existing = mergedMap.get(item.id);
      if (existing) {
        mergedMap.set(item.id, {
          ...existing,
          title: item.title,
          content: item.content || "",
          published: item.published || existing.published,
          images: item.images,
          labels: item.labels || existing.labels,
        });
      } else {
        mergedMap.set(item.id, item);
      }
    });

    const mergedList = Array.from(mergedMap.values());
    return mergedList.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
  } catch (error) {
    console.error("Error in getArticles:", error);
    try {
      const response = await axios.get(
        `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts?key=${API_KEY}`
      );
      return response.data.items || [];
    } catch (innerError) {
      return [];
    }
  }
};

export const getArticleById = async (postId) => {
  if (!db) {
    const response = await axios.get(
      `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/${postId}?key=${API_KEY}`
    );
    return response.data;
  }

  try {
    // Try to fetch from Blogger API first to get live content
    try {
      const response = await axios.get(
        `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/${postId}?key=${API_KEY}`
      );
      if (response.data) {
        const docSnap = await getDoc(doc(db, "articles", postId));
        if (docSnap.exists()) {
          return { ...docSnap.data(), ...response.data };
        }
        return response.data;
      }
    } catch (e) {
      // Ignore and fallback to Firestore (likely a custom article)
    }

    const docSnap = await getDoc(doc(db, "articles", postId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch (e) {
    console.error("Error in getArticleById:", e);
  }

  const response = await axios.get(
    `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/${postId}?key=${API_KEY}`
  );
  return response.data;
};

export const addArticle = async (articleData) => {
  if (!db) throw new Error("Firestore is unavailable.");
  const newDocRef = doc(collection(db, "articles"));
  const data = {
    title: articleData.title,
    content: articleData.content,
    published: new Date().toISOString(),
    author: {
      displayName: articleData.author || "Admin"
    },
    labels: [articleData.category || "General"]
  };
  await setDoc(newDocRef, data);
  return { id: newDocRef.id, ...data };
};

export const updateArticle = async (id, articleData) => {
  if (!db) throw new Error("Firestore is unavailable.");
  const docRef = doc(db, "articles", id);
  const data = {
    title: articleData.title,
    content: articleData.content,
    labels: [articleData.category || "General"]
  };
  await updateDoc(docRef, data);
};

export const deleteArticle = async (id) => {
  if (!db) throw new Error("Firestore is unavailable.");
  await deleteDoc(doc(db, "articles", id));
};