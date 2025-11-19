import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = '30m'; //thường là dưới 15m
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; //14 days 24h 60 minutes 60 seconds 1000 milliseconds   

export const signUp = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        if (!username || !email || !password || !firstName || !lastName) {
            return res
                .status(400)
                .json({
                    message:
                        "Không thể thiếu username, password, email, firstName, lastName"
                })
        }

        //kiểm tra username tồn tại chưa
        const duplicate = await User.findOne({ username })
        if (duplicate) {
            return res.status(409).json({ message: "Username đã tồn tại" })
        }

        //mã hóa password
        const hashedPassword = await bcrypt.hash(password, 10) //salt = 10

        //tạo user mới
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${lastName} ${firstName}`
        })

        // Return 204 No Content
        return res.sendStatus(204); // Gửi response với status 204 và không có nội dung

    } catch (error) {
        console.error("Lỗi khi gọi signUp", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}

export const signIn = async (req, res) => {
    try {
        // lấy input từ client
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Không thể thiếu username hoặc password" })
        }

        //lấy hashedPassword trong db để so với password input
        const user = await User.findOne({ username })

        if (!user) {
            return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" }) //401: Unauthorized
        }

        //kiểm tra password
        const correctPassword = await bcrypt.compare(password, user.hashedPassword)

        if (!correctPassword) {
            return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" })
        }

        //nếu khớp, tạo accessToken với JWT
        //B1: đầu tiên cần có accessTokenSecret 
        // => terminal: cd backend => node => require('crypto').randomBytes(64).toString('hex')
        // => sao chép kết quả ra file .env

        const accessToken = jwt.sign(
            { userId: user._id },  // Payload (object): những thông tin ta sẽ gửi vào access token, giữ lại user._id để biết ai gửi request
            process.env.ACCESS_TOKEN_SECRET,  // Secret key
            { expiresIn: ACCESS_TOKEN_TTL }  // Options: thời gian tồn tại của access token
        );

        //tạo refresh token
        const refreshToken = crypto.randomBytes(64).toString('hex')


        //tạo session mới để lưu refresh token => refToken thường lưu trong db
        //B1: tạo model Session.js
        //B2:
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
        })

        //trả refresh token về trong cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true, //cookies không thể truy cập bằng Javascript
            secure: true, //cookies chỉ hoạt động khi kết nối HTTPS
            sameSite: 'none', //cho phép fe, be chạy trên 2 domain khác nhau, nếu deploy fe, be chung => thay 'none' bằng strict
            maxAge: REFRESH_TOKEN_TTL
        })

        //trả access token về trong res
        return res.status(200).json({
            message: `User ${user.username} đã đăng nhập thành công!!!`
            , accessToken
        })

    } catch (error) {
        console.error("Lỗi khi gọi signIn", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}

//nhớ import cookieParser trong server.js
export const signOut = async (req, res) => {
    try {
        // Clear the refresh token cookie
        // res.clearCookie('refreshToken', {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'strict',
        //     path: '/api/auth/refresh-token'
        // });

        // // If you're using access token in cookies, clear that too
        // res.clearCookie('accessToken', {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'strict'
        // });

        // res.status(200).json({ message: 'Đăng xuất thành công' });

        //==========================================================================

        //lấy refresh token từ cookie
        const refreshToken = req.cookies?.refreshToken

        if (refreshToken) {
            //Xóa refreshToken trong cookies
            await Session.deleteOne({ refreshToken }) //Hủy phiên đăng nhập người dùng trong database

            //Xóa cookies
            res.clearCookie("refreshToken")
        }

        return res.sendStatus(204)

    } catch (error) {
        console.error('Lỗi khi đăng xuất:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

//tạo access token từ refresh token
export const refreshToken = async (req, res) => {
    try {
        //Lấy refresh token từ cookie
        const token = req.cookies?.refreshToken

        if (!token) {
            return res.status(401).json({ message: 'Refresh Token không tồn tại' })
        }

        //so sánh với refresh token trong database
        const session = await Session.findOne({ refreshToken: token })

        if (!session) {
            return res.status(403).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' })
        }

        //kiểm tra hết hạn chưa
        if (session.expiresAt < new Date()) {
            return res.status(403).json({ message: 'Refresh token đã hết hạn' })
        }

        //tạo access token mới
        const accessToken = jwt.sign(
            { userId: session.userId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        )

        //return
        return res.status(200).json({ accessToken })

    } catch (error) {
        console.error('Lỗi khi refresh token:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}

//có thể check trên jwt.io rồi dán accessToken và SecretKey vào để đối chiếu
