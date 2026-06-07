import axios from "axios";

const API_KEY = process.env.EXPO_PUBLIC_BLOGGER_API_KEY;
const BLOG_ID = process.env.EXPO_PUBLIC_BLOGGER_BLOG_ID;

export const getArticles = async () => {
  const response = await axios.get(
    `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts?key=${API_KEY}`
  );

  return response.data.items; 
};

export const getArticleById = async (postId) => {
  const response = await axios.get(
    `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/${postId}?key=${API_KEY}`
  );
  return response.data; 
};