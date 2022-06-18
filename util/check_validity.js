exports.hasDuplicateValue = (array) => {
    let set = new Set();
    for (let i = 0; i < array.length; i++) {
        if (set.has(array[i])) {
            return true;
        }
        set.add(array[i]);
    }
    return false; //no duplicate
};

exports.isInFriendsList = (friendsList, emails) => {
    // to check if the emails provided are actually friends of the user
    const friendsEmails = {};
    for (const friendEmail of friendsList) {
        friendsEmails[friendEmail] = true;
    }
    for (const email of emails) {
        if (!(email in friendsEmails)) {
            return false;
        }
    }
    return true;
};

exports.isValidEmailString = (str) => {
    const toCheck = [',', '@', '.', '_'];
    // console.log(str);
    for (let char of str) {
        const isAplha = char.match(/[a-z]/i);
        const isNumeric = char.match(/[0-9]/i);
        if (!isAplha && !isNumeric && !toCheck.includes(char)) {
            return false;
        }
    }
    return true;
};