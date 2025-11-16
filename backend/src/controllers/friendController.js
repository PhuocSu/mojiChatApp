import User from "../models/User.js";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";

export const sendFriendRequest = async (req, res) => {
    try {
        const { to, message } = req.body;

        const from = req.user._id;

        if (from === to) {
            return res.status(400).json({ message: "Không thể gửi yêu cầu kết bạn cho chính bạn" })
        }

        const userExists = await User.exists({ _id: to })
        if (!userExists) {
            return res.status(404).json({ message: "Người dùng không tồn tại" })
        }

        // kiểm tra userA và userB đã là bạn bè chưa, hoặc đã là bạn bè đang chờ kết bạn
        let userA = from.toString()
        let userB = to.toString()

        if (userA > userB) {
            [userA, userB] = [userB, userA]
        }

        // dùng Promise.all để chạy 2 query cùng lúc
        const [alreadyFriend, existingRequest] = await Promise.all([
            // kiểm tra userA và userB đã là bạn bè chưa
            Friend.findOne({ userA, userB }),
            // Kiểm tra người gửi từ phía nào
            FriendRequest.findOne({
                $or: [
                    { from, to },
                    { from: to, to: from }
                ]
            })
        ])

        if (alreadyFriend) {
            return res.status(400).json({ message: "Hai người đã là bạn bè" })
        }

        if (existingRequest) {
            return res.status(400).json({ message: "Đã có yêu cầu kết bạn đang chờ" })
        }

        const request = await FriendRequest.create({
            from,
            to,
            message
        })

        return res.status(201).json({
            message: "Yêu cầu kết bạn đã được gửi",
            request
        })


    } catch (error) {
        console.error("Lỗi khi gửi yêu cầu kết bạn", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}

export const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params
        const userId = req.user._id

        //Kiểm tra lời mời có tồn tại trong FriendRequest không
        const request = await FriendRequest.findById(requestId)

        if (!request) {
            return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn' })
        }

        // kiểm tra người nhận lời mời có phải người dùng hiện tại
        if (request.to.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền chấp nhận lời mời này' })
        }

        //Nếu có, tạo quan hệ Friend
        const friend = await Friend.create({
            userA: request.from,
            userB: request.to
        })

        // Xóa lời mời trong FriendRequest
        await FriendRequest.findByIdAndDelete(requestId)

        const from = await User.findById(request.from).select("_id displayName avatarUrl").lean()
        // lean(): Trả về javascript object thay vì document mongoose => ối ưu hiệu năng query => nhanh hơn

        return res.status(200).json({
            message: "Chập nhận lời mời kết bạn thành công",
            newFriend: {
                id: from?._id,
                displayName: from?.displayName,
                avatarUrl: from?.avatarUrl
            }
        })

    } catch (error) {
        console.error("Lỗi khi chấp nhận yêu cầu kết bạn", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}

export const declineFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params
        const userId = req.user._id

        const request = await FriendRequest.findById(requestId)

        if (!request) {
            return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn' })
        }

        if (request.to.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền từ chối lời mời này' })
        }

        await FriendRequest.findByIdAndDelete(requestId)

        return res.sendStatus(204)

    } catch (error) {
        console.error("Lỗi khi từ chối yêu cầu kết bạn", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}

export const getAllFriends = async (req, res) => {
    try {
        const userId = req.user._id //nhờ middlewares/authMiddleware.js

        // Lấy danh sách bạn bè
        const friendships = await Friend.find({
            $or: [
                { userA: userId },
                { userB: userId }
            ]
        })
            //populate: trả về thêm thông tin của userA và userB
            .populate("userA", "_id displayName avatarUrl")
            .populate("userB", "_id displayName avatarUrl")
            .lean()

        if (!friendships.length) {
            return res.status(404).json({ friends: [] })
        }

        const friends = friendships.map((f) => f.userA._id.toString() === userId.toString() ? f.userB : f.userA)

        return res.status(200).json({ friends })

    } catch (error) {
        console.error("Lỗi khi lấy danh sách bạn bè", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}

export const getFriendRequests = async (req, res) => {
    try {
        const userID = req.user._id

        const populateFields = '_id displayName avatarUrl'

        const [sent, received] = await Promise.all([
            FriendRequest.find({ from: userID }).populate("to", populateFields),
            FriendRequest.find({ to: userID }).populate("from", populateFields)
        ])

        return res.status(200).json({ sent, received })

    } catch (error) {
        console.error("Lỗi khi lấy danh sách yêu cầu kết bạn", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}