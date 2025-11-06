import { useAuthStore } from "@/stores/useAuthStore"
import axios from "axios"
const api = axios.create({
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api",
    withCredentials: true, //send cookies, nếu thiếu thì sẽ không gửi lên server và người dùng bị log out liên tục
})

//gán accessToken vào req header
api.interceptors.request.use((config) => {
    const { accessToken } = useAuthStore.getState()
    console.log('Sending token:', accessToken);

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
})

// //tự động gọi refresh token khi access token hết hạn
api.interceptors.response.use((res) => res, async (error) => {
    const originalRequest = error.config //lấy cấu hình của request bị lỗi

    //những api không cần 
    if (originalRequest.url.includes("/auth/refresh") ||
        originalRequest.url.includes("/auth/signin") ||
        originalRequest.url.includes("/auth/signup")
    ) {
        return Promise.reject(error) //bỏ qua trả về lỗi
    }

    //kiểm tra số lần retry, tránh lỗi 403 liên tục
    originalRequest._retryCount = originalRequest._retryCount || 0

    if (error.response.status === 403 && originalRequest._retryCount < 4) {
        originalRequest._retryCount += 1

        console.log("Refresh:", originalRequest._retryCount)
        try {
            const res = await api.post("/auth/refresh", { withCredentials: true })
            const newAccessToken = res.data.accessToken

            useAuthStore.getState().setAccessToken(newAccessToken)

            //gán accesToken vào req của header cũ
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

            return api(originalRequest)
        } catch (refreshError) {
            useAuthStore.getState().clearState()
            return Promise.reject(refreshError)
        }
    }

    //nếu ko là lỗi 403(Forbidden)
    return Promise.reject(error)
})


export default api