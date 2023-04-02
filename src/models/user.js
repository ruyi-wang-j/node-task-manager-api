import {mongoose} from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Task from './task.js';

// 要使用middleware，必須改為mongoose.Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Password cannot contain "password".');
            }
        }
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid.');
            }
        }
    },
    age: {
        type: Number,
        defualt: 0,
        validate(value){
            if(value < 0){
                throw new Error('Age must be a positive number.');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer // mongoose的type，用來存binary data，這裡是存圖片（對電腦來說本來就是binary）
    }
}, {
    timestamps: true
})

// 一個virtual field，不會真正存在database中；為User和Task之間的virtual reference
// 只是為了mongoose找出誰擁有什麼、相關性
// 相對於Task中owner是一個真正的field，存在DB中
userSchema.virtual('tasks', { // 'tasks'可任意命名，但是populate要一致
    ref: 'Task',          // 連結到Task
    localField: '_id',    // User中的 _id 為內部field
    foreignField: 'owner' // Task中的owner為外部field
})

// 要用到this所以不能使用arrow function
// 原本用user.Schema.methods.getPublicProfile()，但需要在router中手動call function
// 改為toJSON後所有router會自動套用
userSchema.methods.toJSON = function(){
    const user = this;
    const userObject = user.toObject(); // toObject()是由mongoose提供，return raw profile data

    // 刪掉不想公開的資訊
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

// models可以access instances，又稱instance methods
// 造出user的token，可以在
userSchema.methods.generateAuthToken = async function() {
    const user = this;
    // jwt.sign(payload, secretOrPrivateKey, [options, callback])，產生一組JWT
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET);

    user.tokens = user.tokens.concat({token});
    await user.save();
    return token;

}
// statics method相對於dynamic method，前者不需要instance
// static method可以access model
// static methods = model methods
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});
    if(!user){
        throw new Error('Unable to login');
    }

    // 比較目前user輸入的密碼hash結果和資料中的hashed密碼
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        throw new Error('Unable to login');
    }
    return user;
}

// Hash the plain text password before saving
// ----- Middleware -----
// event 'save' 發生前執行function
// params: 事件名稱, 運行的函數
// 運行的函數必須為standard function，不可為arrow function，因為需要用到this綁定
userSchema.pre('save', async function(next){
    const user = this;

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8);
    }
    // 完成時call next middleware function in the middleware stack
    // monoogose 5.0以上不用手動設置next()
    next();
})

// Delete user tasks when user is removed
//
// 如果沒有寫{document: true}，則預設this指向Model而非document本身
// 假設刪除對象為user id，此時this只會有"查詢對象"user id，而不知道"刪除對象"document全部面貌
// 加上後可確保middleware可以正確地access document中的數據
userSchema.pre('deleteOne', {document: true}, async function(next){
    const user = this;
    console.log('UserSchema this with doc true: ',this);
    await Task.deleteMany({owner: user._id});
    next();
})

// mongoose會自動取得model名字'User'，改為小寫、複數，建成新的collection名稱
// 可以做為連結User與Task之間的橋樑
const User = mongoose.model('User', userSchema);

export default User;