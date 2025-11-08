import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        trim: true
    },
    imgUrl: {
        type: String,
    }

}, {
    timestamps: true
})

// tạo compound index: chỉ mục kết hợp nhiều trường trong collection
messageSchema.index({ conversationId: 1, createdAt: -1 }) //truy vấn với tin nhắn mới nhất nằm đầu tiên

const Message = mongoose.model("Message", messageSchema)

export default Message