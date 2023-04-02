import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import User from '../models/user.js';
import auth from '../middleware/auth.js';
import {sendWelcomeEmail, sendCancelationEmail} from '../emails/account.js';
const router = new express.Router();


// users是url，不是資料庫的collection
router.post('/users', async (req, res) => {
    // 加上async改變function性質，但是對功能來說沒差，因為Express不在乎我們return什麼，只在乎req、res
    const user = new User(req.body);

    try{
        await user.save(); // 可以不用
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    }catch(e){
        res.status(400).send(e);
    }
    // user.save().then(() => {
    //     res.status(200).send(user);
    // }).catch((e) => {
    //     // 一定要在send之前寫，否則無效
    //     res.status(400);
    //     res.send(e);
    //     // 等同 res.status(400).send(e);
    // })
})

router.post('/users/login', async(req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({user, token});
    }catch(e){
        res.status(400).send();
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        })
        await req.user.save();
        res.send();
    }catch(e){
        res.status(500).send();
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try{
        req.user.tokens = [];
        await req.user.save();
        res.send();
    }catch(e){
        res.status(500).send();
    }
})

// 不需要有user id，因為有token -> auth
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
})

router.patch('/users/me', auth, async(req, res) => {
    // Object.key回傳可列舉的屬性所組成的array
    const updates = Object.keys(req.body);
    // 注意是用array
    // 原本：如果req.body有額外的屬性，他會被自動忽略，不會更新到資料庫
    // 加了allowedUpdates：非以上屬性會出錯
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid updates!'});
    }

    try{
        // const user = await User.findById(req.params.id);
        
        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();
        
        // 原本寫法：無法觸發Middleware
        // new: true是為了回傳修改後的資料（原本會回傳修改前的舊資料）
        // runValidator: true是在更新時一樣要驗證是否符合規定
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidator: true});
        
        res.send(req.user);
    }catch(e){
        // 與create user出錯一樣（可能是不合法的名字）
        res.status(400).send(e);
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try{
        sendCancelationEmail(req.user.email, req.user.name);
        await req.user.deleteOne();
        res.send(req.user);
    }catch(e){
        res.status(500).send();
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000 // 1MB
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload an image'));
        }
        cb(undefined, true);
    }
});

// 若要一次上傳多個file，將single改為array
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    // 如果在file system儲存data，我們會丟失資料，所以我們要將它存成binary data存在DB
    // req.user.avatar = req.file.buffer;
    // req.file為multer提供，是一個upload object，包含我們學過的所有屬性
    // 可上傳任何檔案類別
    // req.file.buffer是multer預設上傳文件會先寫入memory

    // 用sharp調整照片大小、檔案類型
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
    req.user.avatar = buffer;

    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    // error handler function，client得到的response才會是可讀的，而非html
    res.status(400).send({error: error.message}); // message是error的property
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined; // avatar field會消失
    await req.user.save();
    res.send();
})

router.get('/users/:id/avatar', async (req, res) => {
    // 確保user看到圖片而非binary
    try{
        const user = await User.findById(req.params.id);
        
        if(!user || !user.avatar){
            throw new Error();
        }

        // set可以設定response header
        // 未設定時Express自動設Content-Type為'application/json'
        res.set('Content-Type', 'image/jpg');
        res.send(user.avatar);

    }catch(e){
        res.status(404).send();
    }
})

export default router;