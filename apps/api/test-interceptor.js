const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken = 'expired-token';
let isRefreshing = false;
let pendingQueue = [];

function drainQueue(token, err = null) {
  pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(err)));
  pendingQueue = [];
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        console.log("Mocking refresh...");
        // Mock successful refresh
        await new Promise(r => setTimeout(r, 500));
        accessToken = 'valid-token';
        
        drainQueue(accessToken);
        
        original.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch (refreshError) {
        drainQueue(null, refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// We need a mock server to test this. Let's just create a quick express server.
const express = require('express');
const app = express();
app.use(express.json());

let requests = 0;
app.get('/api/v1/test', (req, res) => {
  if (req.headers.authorization !== 'Bearer valid-token') {
    return res.status(401).json({ statusCode: 401, message: 'Invalid or expired token', path: '/api/v1/test' });
  }
  res.json({ data: 'success' });
});

app.post('/api/v1/auth/refresh', (req, res) => {
  res.json({ accessToken: 'valid-token' });
});

const server = app.listen(4001, async () => {
  apiClient.defaults.baseURL = 'http://localhost:4001/api/v1';
  
  try {
    console.log("Firing request 1...");
    const p1 = apiClient.get('/test');
    console.log("Firing request 2...");
    const p2 = apiClient.get('/test');
    
    const [r1, r2] = await Promise.all([p1, p2]);
    console.log("Req 1 Success:", r1.data);
    console.log("Req 2 Success:", r2.data);
  } catch (err) {
    console.error("Failed:", err.response?.data || err.message);
  }
  server.close();
});
