const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    sentMsgs: [
        {
            toId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            message: {
                title: { type: String, required: true },
                text: { type: String, required: true }
            }
        }
    ],
    receivedMsgs: [
        {
            fromId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            message: {
                title: { type: String, required: true },
                text: { type: String, required: true }
            }
        }
    ],
    friends: [
        {
            userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
        }
    ],
    requests: [
        {
            userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
        }
    ],
    isOnline: {
        type: Boolean,
        required: true,
        default: false
    },
    secretQuestion: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    key: {
        type: Buffer,
        required: true
    },
    nextAllowedPasswordReset: Date,
    resetToken: String,
    resetTokenExpiration: Date
});

//sending request/adding request
userSchema.methods.addRequest = function (user) {
    const findUser = user.requests.find(el => el.userId.toString() === this._id.toString());
    if (findUser) {
        throw new Error("Already Sent a Request! You can't send a request twice.");
    }
    const updatedRequests = [...user.requests];
    updatedRequests.push({ "userId": this._id });

    user.requests = updatedRequests;
    return user.save();
}

userSchema.methods.deleteRequest = function (user) {
    if (!this.requests) {
        throw new Error("No requests at all!");
    }
    const userIndex = this.requests.findIndex(el => el.userId.toString() === user._id.toString());
    if (userIndex === -1) {
        throw new Error("No such user sent you a request!");
    }
    const updatedRequests = [...requests];
    updatedRequests.splice(userIndex, 1);

    this.requests = updatedRequests;
    return this.save();
}

//accepting request
userSchema.methods.acceptRequest = function (user) {//person to whom friend request is sent accepts it
    const findUser = this.requests.find(el => el.userId.toString() === user._id.toString());
    if (!findUser) {
        throw new Error("No such user sent you a request!");
    }
    const userIndex = this.friends.findIndex(el => el.userId.toString() === user._id.toString());
    if (userIndex > -1) {
        throw new Error("You can't add a friend twice!");
    }

    const updatedRequests = [...this.requests];
    const updatedFriends = [...this.friends];
    updatedRequests.splice(userIndex, 1);
    updatedFriends.push({ userId: user._id });

    this.requests = updatedRequests;
    this.friends = updatedFriends;

    return this.save();
}

userSchema.methods.addedFriend = function (user) {//the person sent the request gains a new friend
    const userIndex = this.friends.findIndex(el => el.userId.toString() === user._id.toString());
    if (userIndex > -1) {
        throw new Error("You can't add a friend twice!");
    }

    const updatedRequests = [...this.requests];
    const updatedFriends = [...this.friends];
    updatedRequests.splice(userIndex, 1);
    updatedFriends.push({ userId: user._id });

    this.requests = updatedRequests;
    this.friends = updatedFriends;

    return this.save();
}

userSchema.methods.deleteFriend = (user) -> {
    const userIndex = this.friends.findIndex(el => el.userId.toString() === user._id.toString());
    if(userIndex === -1) {
    throw new Error("You have no such friend!");
}

const updatedFriends = [...this.friends];
updatedFriends.splice(userIndex, 1);

this.friends = updatedFriends;
return this.save();
}

userSchema.methods.sendMsgsToAll = function (users, title, message) {
    const updatedSentMsgs = [...this.sentMsgs];
    users.forEach(user => {
        updatedSentMsgs.push({ toId: user._id, message: { title: title, text: message } });
        const updatedReceivedMsgs = [...user.receivedMsgs];
        updatedReceivedMsgs.push({ fromId: this._id, message: { title: title, text: message } });
        user.receivedMsgs = updatedReceivedMsgs;
    });
    this.sentMsgs = updatedSentMsgs;
    this.save().then().catch(err => {
        throw new Error("Server-error! Try again.");
    });
    for (let user of users) {
        user.save().then().catch(err => {
            throw new Error("Server-error! Try again.");
        });
    }
}

userSchema.methods.receivedMessage = function (user, title, message) {
    const friend = this.friends.find(el => el.userId.toString() === user._id.toString());
    if (!friend) {
        throw new Error("No such user in your friend list!");
    }
    const updatedSentMsgs = [...user.sentMsgs];
    updatedSentMsgs.push({ toId: this._id, message: { title: title, text: message } });
    user.sentMsgs = updatedSentMsgs;
    const updatedReceivedMsgs = [...this.receivedMsgs];
    updatedReceivedMsgs.push({ fromId: user._id, message: { title: title, text: message } });
    this.receivedMsgs = updatedReceivedMsgs;
    return Promise.all([this.save(), user.save()]);
}

userSchema.methods.deleteReceivedMessage = function (msgId) {
    const msgIndex = this.receivedMsgs.findIndex(message => message._id.toString() === msgId);
    if (msgIndex === -1) {
        throw new Error("No such message!");
    }
    const updatedReceivedMsgs = [...this.receivedMsgs];
    updatedReceivedMsgs.splice(msgIndex, 1);
    this.receivedMsgs = updatedReceivedMsgs;
    return this.save();
}

userSchema.methods.deleteSentMessage = function (msgId) {
    const msgIndex = this.sentMsgs.findIndex(message => message._id.toString() === msgId);
    if (msgIndex === -1) {
        throw new Error("No such message!");
    }
    const updatedSentMsgs = [...this.sentMsgs];
    updatedSentMsgs.splice(msgIndex, 1);
    this.sentMsgs = updatedSentMsgs;
    return this.save();
}

module.exports = mongoose.model('User', userSchema);