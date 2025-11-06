import React from 'react'
import Logout from '../components/auth/Logout'
import { useAuthStore } from '../stores/useAuthStore'
import api from '@/lib/axios'
import { toast } from 'sonner'

const ChatAppPage = () => {
  // const { user } = useAuthStore() //theo dõi toàn bộ state, 1 commponent thay đổi thì toàn bộ bị render => bất tiện

  const user = useAuthStore((state) => state.user) //chỉ theo dõi trường user trong stores

  const handleOnclick = async () => {
    try {
      await api.get("/users/test", { withCredentials: true })
      toast.success("Test thành công")
    } catch (error) {
      toast.error("Test thất bại")
      console.log(error)
    }
  }

  return (
    <div>
      <p>{user?.username}</p>
      <Logout />

      <button onClick={handleOnclick}>Test</button>
    </div>
  )
}

export default ChatAppPage