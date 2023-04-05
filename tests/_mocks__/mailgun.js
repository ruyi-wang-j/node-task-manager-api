const mailgun = function (apiKey, domain) {
    console.log('cool');
    const object2 = {
      send() {
        console.log('send function');
      }
    }
   
    const object1 = {
      messages() {
        console.log('messages function');
        return object2
      }
    }
   
    return object1
  }

  export {mailgun};