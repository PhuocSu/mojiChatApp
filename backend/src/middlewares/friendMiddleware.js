import Conversation from "../models/Conversation.js"
import Friend from "../models/Friend.js"

const pair = (a, b) => (a < b ? [a, b] : [b, a])

export const checkFriendship = async (req, res, next) => {
    try {

        // Chat one to one
        const me = req.user._id.toString()

        const recipientId = req.body?.recipientId ?? null

        const memberIds = req.body?.memberIds ?? []

        if (!recipientId && memberIds.length === 0) {
            return res.status(400).json({ message: "Cần cung cấp recipientId hoặc memberIds" })
        }

        if (recipientId) {
            const [userA, userB] = pair(me, recipientId)
            const isFriend = await Friend.findOne({ userA, userB })
            if (!isFriend) {
                return res.status(403).json({ message: "Bạn chưa kết bạn với người này" })
            }

            return next()
        }

        // Chat group
        // Kiểm tra tất cả member có phải là bạn của người tạo
        const friendCheck = memberIds.map(async (memberId) => {
            const [userA, userB] = pair(me, memberId)
            const friend = await Friend.findOne({ userA, userB })
            return friend ? null : memberId
        })

        const results = await Promise.all(friendCheck)
        const notFriends = results.filter(Boolean)
        // .filter(Boolean) sẽ bỏ ra tất cả các giá trị "falsy" (null, undefined, 0, '', false)
        // Trong trường hợp này, nó sẽ lọc ra tất cả các memberId khác null => true
        // Tức là lọc ra những người KHÔNG phải là bạn bè

        if (notFriends.length > 0) {
            return res.status(403).json({ message: "Bạn chỉ có thể thêm bạn bè vào nhóm: ", notFriends })
        }

        return next()


    } catch (error) {
        console.error("Lỗi khi checkFriendship: ", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}