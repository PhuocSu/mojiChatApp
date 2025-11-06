import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { Navigate, Outlet } from 'react-router'

const ProtectedRoute = () => {
    const { accessToken, user, loading, refresh, fetchMe } = useAuthStore()
    const [starting, setStarting] = useState(true) //đánh dấu đang khởi động

    const init = async () => {
        //có thể xảy ra khi refresh trang
        if (!accessToken) {
            await refresh()
        }

        if (accessToken && !user) {
            await fetchMe()
        }
        //trường hợp vào được nhưng reset trang => để tránh quay lai signin thì: 
        setStarting(false)

    }

    useEffect(() => {
        init()
    }, [])

    //nếu đang kiểm tra hay đang fetch
    if (starting || loading) {
        return <div className="flex h-screen items-center justify-center">Đang tải trang...</div>
    }

    if (!accessToken) {
        return (
            <Navigate
                to="/signin"
                replace //người dùng không thể quay lại trang trước
            />
        )
    }

    return <Outlet></Outlet>; //dùng để render component con
}

export default ProtectedRoute