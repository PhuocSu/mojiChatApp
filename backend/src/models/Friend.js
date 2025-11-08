import mongoose from "mongoose"

const friendSchema = new mongoose.Schema({
    userA: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    userB: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

}, {
    timestamps: true
})


//Cần phân biệt userA với userB => middleware => trong mongoDb gọi là Pre
friendSchema.pre('save', function (next) {
    const a = this.userA.toString()
    const b = this.userB.toString()

    if (a > b) { //Hoán đổi id để tránh trùng lặp
        this.userA = new mongoose.Types.ObjectId(b)
        this.userB = new mongoose.Types.ObjectId(a)
    }

    next()
})

friendSchema.index({
    userA: 1,
    userB: 1
}, { unique: true }) //tạo index độc nhất cho cả hai users

const Friend = mongoose.model("Friend", friendSchema)
export default Friend