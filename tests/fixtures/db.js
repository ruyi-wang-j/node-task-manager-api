import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../../src/models/user';
import Task from '../../src/models/task';

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
    _id: userOneId,
    name: 'Mike',
    email: 'mike@example.com',
    password: 'qwe2895509',
    tokens: [{
        token: jwt.sign({_id: userOneId}, process.env.JWT_SECRET)
    }]
}

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
    _id: userTwoId,
    name: 'Andrew',
    email: 'andrew@example.com',
    password: 'myhouse099@@',
    tokens: [{
        token: jwt.sign({_id: userTwoId}, process.env.JWT_SECRET)
    }]
}

const taskOne = {
    _id: new mongoose.Types.ObjectId(),
    description: 'First task',
    completed: false,
    owner: userOneId // 等於userOne._id
}

const taskTwo = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Secon task',
    completed: true,
    owner: userOneId // 等於userOne._id
}

const taskThree = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Third task',
    completed: true,
    owner: userTwoId // 等於userTwo._id
}

const setupDatabase = async () => {
    await User.deleteMany();
    await Task.deleteMany();

    await new User(userOne).save();
    await new User(userTwo).save();

    await new Task(taskOne).save();
    await new Task(taskTwo).save();
    await new Task(taskThree).save();
}

export {
    userOneId,
    userOne,
    userTwoId,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    setupDatabase
};