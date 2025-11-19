import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js"

export const createConversation = async (req, res) => {
    try {
        const { type, name, memberIds } = req.body
        const userId = req.user._id

        if (!type ||
            (type === "group" && !name) ||
            !memberIds ||
            !Array.isArray(memberIds) ||
            memberIds.length === 0
        ) {
            return res.status(400).json({ message: "Tên nhóm và thành viên là bắt buộc" })
        }

        let conversation

        if (type === 'direct') {
            const participantId = memberIds[0]

            conversation = await Conversation.findOne({
                type: "direct",
                participants: {
                    // kiểm tra người dùng hiện tại và người nhận có cuộc trò chuyện trực tiếp tồn tại chưa, ko cần thì thôi
                    $all: [userId, participantId]
                }
            })

            if (!conversation) {
                conversation = new Conversation({
                    type: "direct",
                    participants: [{ userId }, { userId: participantId }],
                    // ~[{userId: userId}, {userId: participantId}]
                    lastMessageAt: new Date()
                })

                await conversation.save()
            }
        }

        if (type === 'group') {
            conversation = new Conversation({
                type: "group",
                group: {
                    name,
                    createdBy: userId
                },
                participants: [
                    { userId },
                    ...memberIds.map((id) => ({ userId: id }))
                ],
                lastMessageAt: new Date()
            })

            await conversation.save()
        }

        if (!conversation) {
            return res.status(400).json({ message: 'Conversation type không hợp lệ' })
        }

        // conversation tạo xong, goi populate để update các trường liên quan
        await conversation.populate([
            {
                path: "participants.userId", //mảng participants chứa userId - userId là khóa ngoiaj đến User
                select: "displayName avatarUrl" //select thông tin bên trong model User
            },
            {
                path: 'seenBy',
                select: 'displayName avatarUrl'
            },
            { path: 'lastMessage.senderId', select: 'displayName avatarUrl' }
        ])

        return res.status(201).json(conversation)


    } catch (error) {
        console.error("Lỗi khi tạo conversation: ", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}

export const getConversation = async (req, res) => {
    try {
        const userId = req.user._id //user đang gọi API
        const conversations = await Conversation.find({
            'participants.userId': userId
        })
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .populate([
                {
                    path: 'participants.userId',
                    select: 'displayName avatarUrl'
                },
                {
                    path: "seenBy",
                    select: "displayName avatarUrl"
                },
                {
                    path: "lastMessage.senderId",
                    select: "displayName avatarUrl"
                }
            ])

        // format response cho frontend dễ dùng
        const formatted = conversations.map((convo) => {
            const participants = (convo.participants || []).map((p) => ({
                _id: p.userId?._id,
                displayName: p.userId?.displayName,
                avatarUrl: p.userId?.avatarUrl ?? null,
                joinedAt: p.joinedAt
            }))

            return {
                ...convo.toObject(), //chuyển thành object javascripts
                unreadCounts: convo.unreadCounts || {},
                participants, //ghì đè participant bằng mảng participants
            }
        })

        return res.status(200).json({ conversations: formatted })

    } catch (error) {
        console.error("Lỗi khi lấy danh sách conversation: ", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}

export const getMessages = async (req, res) => {
    try {
        //cursor-based pagination: hiệu quả hơn nhiều
        //phân trang tin nhắn hiển thị trong backend
        const { conversationId } = req.params
        const { limit = 50, cursor } = req.query //limit: số lượng tin nhắn, cursor: con trỏ của tin nhắn

        const query = { conversationId }

        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) } //chuyển cursor từ String sang Date 
        }

        let messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit + 1)) //chuyển sang number. +1 là để kiểm tra còn tin nhắn nữa khong ở vị trí 51

        let nextCursor = null

        // Nếu có trang kế tiếp
        if (messages.length > Number(limit)) {
            const nextMessage = messages[messages.length - 1]
            nextCursor = nextMessage.createdAt.toISOString() //đánh dấu vị trí của tin nhắn tiếp theo
            messages.pop() //bỏ tin cuối cùng ra
        }

        //Vì database trả về tin mới nhất trước, nhưng UI cần hiển thị tin cũ → mới => reverse cũ lên trước
        messages = messages.reverse()

        return res.status(200).json({ messages, nextCursor })

    } catch (error) {
        console.error("Lỗi khi lấy messages: ", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}