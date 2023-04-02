import express from 'express';
import './db/mongoose.js';
import userRouter from './routers/user.js';
import taskRouter from './routers/task.js';

const app = express();
const port = process.env.PORT;

// app.use((req, res, next) => {
//     if(req.method === 'GET'){
//         res.send('GET requests are disabled.');
//     }else{
//         next();
//     }
// })

// app.use((req, res, next) => {
//     res.status(503).send('Site is currently down. Check back soon!');
// })

import multer from 'multer';
const upload = multer({
    dest: 'images',
    limits: {
        fileSize: 1000000 // in bytes，1MB
    },
    fileFilter(req, file, cb){
        // multer會call此function
        // cb stands for callback

        if(!file.originalname.match(/\.(doc|docx)$/)){
            // .match可以用regular expression判斷多個檔名，/寫在這裡/
            return cb(new Error('Please upload a Word document'));
        }
        cb(undefined, true);
        // cb(new Error('File must be a PDF'));
        // cb(undefined, true);
        // cb(undefined, false);
    }
});
// const errorMiddleware = (req, res, next) => {
//     throw new Error('1223');
// }
// body -> form-data -> key的名字需要和single('upload')一致
app.post('/upload', upload.single('upload'), (req, res) => {
    res.send();
}, (error, req, res, next) => {
    console.log(typeof(error.body));
    res.status(400).send(error);
})
// middleware執行成功 -> 做第一個callback function
// middleware執行失敗 -> 做第二個callback function
// 無middleware也可以執行

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

//
// Without middleware: new request -> run route handler
// With middleware   : new request -> do something -> run route handler
//

app.listen(port, () => {
    console.log('Server is on port ' + port);
})


// encryption：可逆
// hashing algo：不可逆，單向


// import Task from './models/task.js';
// import User from './models/user.js';

// const main = async function() {
//     // const task = await Task.findById('641abb6f3df424e446b71316');
//     // await task.populate('owner'); // 透過task schema中user的ref來連結到User的collection
//     // console.log(task.owner);

//     const user = await User.findById('641ab73fcc8cf244ac8b4295');
//     await user.populate('tasks');
//     console.log(user.tasks);
// }

// main();