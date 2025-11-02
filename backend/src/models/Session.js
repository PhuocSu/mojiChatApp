import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,  //userId khóa ngoại trỏ đến user._id
        ref: 'User', //Liên kết tới model User
        required: true,
        //Mỗi session thuộc một user nên cần đánh index => mỗi user có nhiều session(vd: trên nhiều thiết bị)
        index: true
    },
    refreshToken: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true,
    }
}, {
    timestamps: true,
})

//tự động xóa khi hết hạn
sessionSchema.index(
    { expiresAt: 1 },            // Tạo index trên trường expiresAt (kiểu Date)
    { expireAfterSeconds: 0 }    // Tài liệu sẽ bị xóa ngay khi đến thời điểm expiresAt
);

const Session = mongoose.model("Session", sessionSchema);
export default Session;
// 39:30
