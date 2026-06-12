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
    const snap = await getDocs(collection(db, "articles"));
    if (snap.docs.length > 0) {
      // Sort articles by published date descending
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
    }

    // Seed Firestore with Blogger articles if empty
    const response = await axios.get(
      `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts?key=${API_KEY}`
    );
    const items = response.data.items || [];

    for (const item of items) {
      await setDoc(doc(db, "articles", item.id), {
        title: item.title,
        content: item.content || "",
        published: item.published || new Date().toISOString(),
        author: {
          displayName: item.author?.displayName || 'Admin'
        },
        labels: item.labels || ['General'],
      });
    }

    return items;
  } catch (error) {
    console.error("Error in getArticles:", error);
    const response = await axios.get(
      `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts?key=${API_KEY}`
    );
    return response.data.items || [];
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