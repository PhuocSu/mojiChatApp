import jwt from 'jsonwebtoken'
import User from '../models/User.js'

//authorization - xác minh người dùng có quyền truy cập vào API hay không
export const protectedRoute = (req, res, next) => {
    try {
        //lấy token từ header. Bearer <token> : bên trong là accessToken
        const authHeader = req.headers["authorization"]
        const token = authHeader && authHeader.split(" ")[1]

        if (!token) {
            return res.status(401).json({ message: "Không tìm thấy access token" })
        }

        //xác minh nhận token hợp lệ
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
            if (err) {
                return res.status(403).json({ message: "Access Token hết hạn hoặc không đúng" })
            }

            //Nếu token hợp lệ, tìm user trong db để chắc chắn userId là thật và chưa bị xóa
            const user = await User.findById(decodedUser.userId).select("-hashedPassword"); //không lấy hashedPassword ra

            if (!user) {
                return res.status(404).json({ message: "User không tồn tại" })
            }

            //Nếu user tồn tại, gắn user vào req.user => sau này các API khác có thể tận dụng thông tin này
            req.user = user;
            next(); //báo express biết có thể sang phần tiếp theo

        })
        
    } catch (error) {
        console.error('Lỗi khi xác minh JWT trong authMiddleware', error)
        return res.status(500).json({ message: 'Lỗi hệ thống' })
    }
}