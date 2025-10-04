//frontend/src/services/api.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});


// api.js - Add interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout - server too slow';
    } else if (!error.response) {
      error.message = 'Network error - check if backend is running';
    }
    return Promise.reject(error);
  }
);


// MIDI to Text conversion
export const convertMidiToText = async (file) => {
  const formData = new FormData();
  formData.append("midiFile", file);

  const response = await api.post("/midi-to-text", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// Text to MIDI conversion
export const convertTextToMidi = async (text) => {
  const response = await api.post(
    "/text-to-midi",
    { text },
    {
      responseType: "blob",
    }
  );

  return response.data;
};

export default api;
