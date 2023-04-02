import express from 'express';
import Task from '../models/task.js';
import auth from '../middleware/auth.js';
const router = new express.Router();


router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body);
    const task = new Task({
        // ES6 spread operator
        // The syntax is three dots(...) followed by the array (or iterable*).
        // It expands the array into individual elements.
        ...req.body,        // 將create task中的全部資料寫入Task collection
        owner: req.user._id // auth.js中我們有將req.user = user，所以這裡可以操作req.user._id
    });

    try{
        await task.save();
        res.status(201).send(task);
    }catch(e){
        res.status(400).send(e);
    }
})

// Show all tasks
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt_desc，可以寫「:desc」或「_desc」，任何間隔字元都可
router.get('/tasks', auth, async (req, res) => {
    try{
        const match = {};
        const sort = {};

        if(req.query.completed){
            // 判斷req.query是否等於'true'字串，是則match.completed為true boolean，否則為false boolean
            match.completed = req.query.completed === 'true';
        }

        if(req.query.sortBy){
            const parts = req.query.sortBy.split(':');
            sort[parts[0]] = parts[1] === 'desc'? -1: 1;
        }
        // 方法一
        // const tasks = await Task.find({owner: req.user._id});
        // res.send(tasks);

        // 方法二
        await req.user.populate({
            path: 'tasks', // 'tasks'名稱須和virtual命名一致
            match,
            options: {
                // parseInt是JS提供的，若不為int，會被忽略
                limit: parseInt(req.query.limit), // 限制一次只顯示幾筆
                skip: parseInt(req.query.skip),   // 忽略前幾筆
                sort
                // sort: {
                //      createdAt: -1, // descending為-1，ascending為1
                //      completed: -1  // 已完成先為-1，未完成先為1；true or false照boolean 0, 1想
                // }
            }
        });
        res.send(req.user.tasks); // .tasks名稱須和virtual命名一致
    }catch(e){
        res.status(500).send();
    }
})

// Show a single task
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id; // task id

    try{
        // const task = await Task.findById(_id);
        const task = await Task.findOne({_id, owner: req.user._id});
        if(!task){
            return res.status(404).send();
        }
        res.send(task);
    }catch(e){
        res.status(500).send();
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid updates!'});
    }
    
    try{
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
        
        if(!task){
            return res.status(404).send();
        }
        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidator: true});
        res.send(task);
    }catch(e){
        res.status(400).send(e);
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try{
        // const task = await Task.findByIdAndDelete(req.params.id);
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id});
        if(!task){
            return res.status(404).send();
        }
        res.send(task);
    }catch(e){
        res.status(500).send();
    }
})


export default router;