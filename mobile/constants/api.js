// Replace with your production backend URL after deployment
// Example: "https://shivam-books-backend.onrender.com/api"
const PROD_URL = "https://your-production-url.com/api"; 
const DEV_URL = "http://10.177.164.164:5000/api";

export const API_URL = __DEV__ ? DEV_URL : PROD_URL;
