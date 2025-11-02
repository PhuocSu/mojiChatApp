import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true // tự tạo index trong mongoDb
    },
    hashedPassword: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    displayName:{
        type: String,
        required: true,
        trim: true
    },
    avatarUrl:{
        type: String //link cdn để hiển thị hình
    },
    coverId:{
        type: String //Cloudinary public_id để xóa hình
    },
    bio:{
        type: String,
        maxlength: 500,
    },
    phone:{
        type: String,
        sparse: true //cho phép null, không được trùng
    }
},{
    timestamps: true,
});

const User = mongoose.model("User", userSchema);
export default User;