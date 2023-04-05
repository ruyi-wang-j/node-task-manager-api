import {mongoose} from 'mongoose';

const mongooseConnect = async() => {
    await mongoose.connect(process.env.MONGODB_URL);
}

mongooseConnect();