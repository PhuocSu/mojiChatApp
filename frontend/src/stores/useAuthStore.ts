import { create } from "zustand"
import { toast } from "sonner"
import { authService } from "../services/authService"
import type { AuthState } from "../types/store"

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,
    user: null,
    loading: false, //theo dói trang thái khi gọi API

    clearState: () => {
        set({ accessToken: null, user: null, loading: false })
    },

    signUp: async (username, password, email, firstName, lastName) => {
        try {
            set({ loading: true })

            //gọi API
            await authService.signUp(username, password, email, firstName, lastName)


            toast.success("Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập.")
        } catch (error) {
            console.log(error)
            toast.error("Đăng ký thất bại")
        } finally {
            set({ loading: false })
        }
    },

    signIn: async (username, password) => {
        try {
            set({ loading: true })

            //gọi API
            const accessToken = await authService.signIn(username, password)
            set({ accessToken }) //cập nhật giá trị accesstoken trong store

            toast.success("Chào mừng bạn quay lại với Moji 🎉")
        } catch (error) {
            console.error(error)
            toast.error('Đăng nhập thất bại!')
        }
    },

    signOut: async () => {
        try {
            get().clearState()
            await authService.signOut()

            toast.success("Đăng xuất thành công!")
        } catch (error) {
            console.error(error)
            toast.error("Đăng xuất thất bại! Hãy thử lại")
        }
    }

}))
