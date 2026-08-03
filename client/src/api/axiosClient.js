import axios from "axios";

const axiosClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

// --- Silent refresh-and-retry on 401 ---
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error) => {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  pendingQueue = [];
};

// Separate axios call (NOT through axiosClient) for the refresh request
// itself. Routing it through axiosClient would re-enter this same
// interceptor on failure, relying on config merge to preserve a custom
// "retried" flag — that's the exact class of bug that can silently hang.
// A plain axios call with an explicit timeout can't loop and can't hang.
const rawRefresh = () =>
  axios.post("/api/v1/auth/refresh", null, { withCredentials: true, timeout: 8000 });

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (!response || response.status !== 401 || config?._retried || config?.url === "/auth/refresh") {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => pendingQueue.push({ resolve, reject })).then(() =>
        axiosClient({ ...config, _retried: true })
      );
    }

    isRefreshing = true;

    try {
      await rawRefresh();
      processQueue(null);
      return axiosClient({ ...config, _retried: true });
    } catch (refreshError) {
      processQueue(refreshError);
      window.dispatchEvent(new Event("auth:session-expired"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;