import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/user.js';
import {userOneId, userOne, setupDatabase} from './fixtures/db.js';

beforeEach(setupDatabase);
// 如果有問題，試試看
// beforeEach(async() => {
//     await setupDatabase();
// })

test('Should signup a new user', async () => {
    // response包含3個property：status、body、error
    const response = await request(app).post('/users').send({
        name: 'LZW',
        email: 'aaa@example.com',
        password: 'qwe2895509'
    }).expect(201); // expect只會讀取status值，若錯誤，throw error；response不會被改變

    // Assert that the datatbase was changed correctly
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    // Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'LZW',
            email: 'aaa@example.com'
        },
        token: user.tokens[0].token
    })
    expect(user.password).not.toBe('qwe2895509');
})

test('Should login existing user', async () => {
    // response是client端輸入之後server做完事response的結果
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    const user = await User.findById(userOneId);
    expect(user).not.toBeNull();
    expect(user.tokens[1].token).toBe(response.body.token); // 注意！token不是在response.body.user下
})

test('Should not login nonexistent user', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: 'thisisnotmypass'
    }).expect(400);
})

test('Should get profile from user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401);
})

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    const user = await User.findById(userOneId);
    expect(user).toBeNull();
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401);
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg') // supertests，會自動send()
        .expect(200);

    const user = await User.findById(userOneId);
    // expect({}).toEqual({});      // toBe為 A === B，但是對於object {} !== {}，兩者不同
    expect(user.avatar).toEqual(expect.any(Buffer));
    // toEqual用演算法判斷object，更嚴謹
    // expect.any()檢查值的type，而具體的值
})

test('Should upload valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Jess'
        })
        .expect(200);

    const user = await User.findById(userOneId);
    expect(user.name).toEqual('Jess');
})

test('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Taipei'
        })
        .expect(400);
})

