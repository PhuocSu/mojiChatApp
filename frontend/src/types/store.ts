import type { User } from "./user"

export interface AuthState {
    accessToken: String | null,
    user: User | null,
    loading: boolean,

    clearState: () => void,

    signUp: (username: string, password: string, email: string, firstName: string, lastName: string) => Promise<void>
    signIn: (username: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    fetchMe: () => Promise<void>
    refresh: () => Promise<void>
    //promise đại diện cho 1 thao tác bất đồng bộ, hoàn thành thì ko có giá trị trả về
}

