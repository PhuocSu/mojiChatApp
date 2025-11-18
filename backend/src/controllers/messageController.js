import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js"
import { updateConversationAfterCreateMessage } from "../utils/messageHelper.js"

export const sendDirectMessage = async (req, res) => {
    try {
        const { recipientId, content, conversationId } = req.body
        const senderId = req.user._id

        console.log("recipientId", recipientId, "content", content, "conversationId", conversationId)

        let conversation

        if (!content) {
            return res.status(400).json({ message: "Thiếu nội dung tin nhắn" })
        }

        if (conversationId) {
            conversation = await Conversation.findById(conversationId)
        }

        // nếu không có hoặc không tìm thấy
        if (!conversation) {
            conversation = await Conversation.create({
                type: "direct",
                participants: [{
                    userId: senderId,
                    joinedDate: new Date()
                }, {
                    userId: recipientId,
                    joinedDate: new Date()
                }],
                lastMessageAt: new Date(),
                unreadCounts: new Map()
            })
        }

        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            content
        })

        /*Mỗi khi có tin nhắn mới, cần cập nhật lại: số tin nhắn chưa đọc, hiển thị người dùng đã xem, tin nhắn cuối cùng */
        // Cả tin nhắn direct và Group
        updateConversationAfterCreateMessage(conversation, message, senderId)

        await conversation.save() //lưu các thay đổi

        return res.status(201).json({ message })

    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}
export const sendGroupMessage = async (req, res) => { }