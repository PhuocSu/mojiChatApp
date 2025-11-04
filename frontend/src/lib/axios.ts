import axios from "axios"
const api = axios.create({
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api",
    withCredentials: true, //send cookies, nếu thiếu thì sẽ không gửi lên server và người dùng bị log out liên tục
})

export default api