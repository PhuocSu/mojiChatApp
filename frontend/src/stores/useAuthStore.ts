import { create } from "zustand"
import { toast } from "sonner"
import { authService } from "../services/authService"
import type { AuthState } from "../types/store"

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,
    user: null,
    loading: false, //theo dói trang thái khi gọi API

    setAccessToken: (accessToken: string) => {
        set({ accessToken })
    },

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
            console.error(error)
            toast.error("Đăng ký thất bại")
        } finally {
            set({ loading: false })
        }
    },

    signIn: async (username, password) => {
        try {
            set({ loading: true })

            //gọi API
            const { accessToken } = await authService.signIn(username, password)
            get().setAccessToken(accessToken)

            await get().fetchMe()

            toast.success("Chào mừng bạn quay lại với Moji 🎉")
        } catch (error) {
            console.error(error)
            toast.error('Đăng nhập thất bại!')
        } finally {
            set({ loading: false })
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
    },

    fetchMe: async () => {
        try {
            set({ loading: true })

            const user = await authService.fetchMe()
            set({ user })

        } catch (error) {
            console.error(error)
            set({ user: null, accessToken: null })
            toast.error("Lấy thông tin người dùng thất bại! Hãy thử lại")
        } finally {
            set({ loading: false })
        }
    },

    refresh: async () => {
        try {
            set({ loading: true }) //baos cho ui biết chuẩn bị refresh token

            const { user, fetchMe, setAccessToken } = get() //lấy user trong stores
            const accessToken = await authService.refresh()
            setAccessToken(accessToken)

            if (!user) {
                await fetchMe()
            }

        } catch (error) {
            console.error(error)
            toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!")
            get().clearState()
        } finally {
            set({ loading: false })
        }
    }

}))
