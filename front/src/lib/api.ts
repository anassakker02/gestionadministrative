import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Utilisation pour GET
export const fetcher = async (url: string) => {
  console.log("Fetching URL:", `${API_BASE_URL}${url}`); // Temporary log
  const response = await axiosInstance.get(url);
  return response.data;
};

// Utilisation pour POST, PUT, DELETE
export const apiRequest = async (
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: Record<string, unknown>
) => {
  const response = await axiosInstance.request({
    url,
    method,
    data,
  });
  return response.data;
};

export default axiosInstance;
