import request from 'supertest';
import app from '../src/app';
import Task from '../src/models/task';
import {
    userOneId,
    userOne,
    userTwoId,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    setupDatabase
} from './fixtures/db.js';

beforeEach(setupDatabase);
// 如果有問題，試試看
// beforeEach(async() => {
//     await setupDatabase();
// })

// 確保執行user.test和task.test順序
// 在package.json加上 --runInBand
test('Should create task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'From my test'
        })
        .expect(201);
    
    const task = await Task.findById(response.body._id);
    expect(task).not.toBeNull();
    expect(task.completed).toEqual(false); // toBe也可
})

test('Should fetch user tasks', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
    
    expect(response.body.length).toEqual(2);
})

test('Should not delete other users tasks', async () => {
    const response = await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404);
    
    const task = await Task.findById(taskOne._id);
    expect(task).not.toBeNull();
})