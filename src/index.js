import app from './app.js';
const port = process.env.PORT;

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