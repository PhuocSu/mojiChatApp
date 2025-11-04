import api from "@/lib/axios"

export const authService = {
    signUp: async (
        username: string,
        password: string,
        email: string,
        firstName: string,
        lastName: string
    ) => {
        const res = await api.post("/auth/signup", {
            username,
            password,
            email,
            firstName,
            lastName
        },
            { withCredentials: true }
        )

        return res.data
    },

    signIn: async (
        username: string,
        password: string
    ) => {
        const res = await api.post("/auth/signin", {
            username,
            password
        },
            { withCredentials: true }
        )

        return res.data //accestoken mà server gửi lại
    },

    signOut: async () => {
        return await api.post("/auth/signout", {}, { withCredentials: true })
    }
}

// authService.ts > useAuthStore.ts > store.ts > components/auth/signin-form.tsx