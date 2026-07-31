import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 70000,
});

export async function getDemoAgreement() {
  const response = await api.get(
    "/agreements/demo",
  );

  return response.data.agreement;
}

export async function evaluateMilestone(evidence) {
  const response = await api.post(
    "/agreements/demo/evaluate",
    evidence,
  );

  return response.data;
}

export async function executeMilestone(evidence) {
  const response = await api.post(
    "/agreements/demo/execute",
    evidence,
  );

  return response.data;
}

export async function getPaymentTransaction(
  transactionId,
) {
  const response = await api.get(
    `/agreements/transactions/${transactionId}`,
  );

  return response.data.transaction;
}

export default api;