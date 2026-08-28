import axios from "axios";

const API_KEY = process.env.EXPO_PUBLIC_BLOGGER_API_KEY;
const BLOG_ID = process.env.EXPO_PUBLIC_BLOGGER_BLOG_ID;

export const getArticles = async () => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts?key=${API_KEY}&maxResults=50`
    );
    
    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching from Blogger:", error);
    return [];
  }
};

export const getArticleById = async (postId) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/${postId}?key=${API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching article by ID:", error);
    return null;
  }
};

export const addArticle = async (articleData) => {
  throw new Error("Please add new articles directly on the Google Blogger website.");
};

export const updateArticle = async (id, articleData) => {
  throw new Error("Please edit articles directly on the Google Blogger website.");
};

export const deleteArticle = async (id) => {
  throw new Error("Please delete articles directly on the Google Blogger website.");
};
