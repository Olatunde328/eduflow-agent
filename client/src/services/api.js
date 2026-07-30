import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export async function getDemoAgreement() {
  const response = await api.get("/agreements/demo");
  return response.data.agreement;
}

export async function evaluateMilestone(evidence) {
  const response = await api.post("/agreements/demo/evaluate", evidence);
  return response.data;
}

export default api;
