import Mailgun from 'mailgun.js';
import formData from 'form-data'; // node_modules中已經有此library，不須下載

const mg = new Mailgun(formData);
const client = mg.client({username: 'ruyi', key: process.env.MAILGUN_API_KEY});

const sendWelcomeEmail = (email, name) => {
    const data = {
        from: 'ewq2895509@gmail.com',
	    to: email, 
	    subject: 'Thanks for joining in!',
	    text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
        // ``為template string，${}為引用資料
    }
	client.messages.create(process.env.MAILGUN_DOMAIN, data);
};

const sendCancelationEmail = (email, name) => {
    const data = {
        from: 'ewq2895509@gmail.com',
        to: email,
        subject: 'Sorry to see you go!',
        text: `Goodbye, ${name}! I hope to see you back sometime soon.`
    }
    client.messages.create(process.env.MAILGUN_DOMAIN, data);
}
export {sendWelcomeEmail, sendCancelationEmail};