exports.autoComplete = () => {
    // auto-complete code
};

// side-worker functions: (Not optimized)
const commonChars = (title, match) => {
    title = title.toLowerCase();
    match = match.toLowerCase();
    // match = match.split(' ').join('');
    // title = title.split(' ').join('');
    // match = match.split('-').join('');
    // title = title.split('-').join('');
    const arr = new Array(title.length + 1).fill(0).map(el => new Array(match.length + 1).fill(0));
    for (let i = 1; i < title.length + 1; i++) {
        for (let j = 1; j < match.length + 1; j++) {
            if (match[j - 1] == title[i - 1]) {
                arr[i][j] = arr[i - 1][j - 1] + 1;
            } else {
                arr[i][j] = Math.max(arr[i - 1][j], arr[i][j - 1]);
            }
        }
    }
    return Number(arr[arr.length - 1][arr[0].length - 1]);
};

const minChanges = (str1, str2) => {//str1->str2
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    // str2 = str2.split(' ').join('');
    // str1 = str1.split(' ').join('');
    // str2 = str2.split('-').join('');
    // str1 = str1.split('-').join('');
    const arr = new Array(str1.length + 1).fill(0).map(el => new Array(str2.length + 1).fill(0));
    for (let i = 1; i < str1.length + 1; i++) {
        arr[i][0] = i;
    }
    for (let j = 1; j < str2.length + 1; j++) {
        arr[0][j] = j;
    }
    for (let i = 1; i <= str1.length; i++) {
        for (let j = 1; j <= str2.length; j++) {
            if (str2[j - 1] === str1[i - 1]) {
                arr[i][j] = arr[i - 1][j - 1];
            } else {
                arr[i][j] = Math.min(arr[i - 1][j], arr[i][j - 1], arr[i - 1][j - 1]) + 1;
            }
        }
    }
    return Number(arr[arr.length - 1][arr[0].length - 1]);
};


// main-filters
exports.filter = (posts, search) => {
    if (search.length < 1 || search.length > 25) return [];
    const filteredPosts = posts.map(post => [post, [0, 0]]);
    for (let arr of filteredPosts) {
        arr[1][0] = commonChars(arr[0].title, search);
        arr[1][1] = minChanges(arr[0].title, search);
    }
    return filteredPosts.sort((a, b) => {
        if (a[1][0] === b[1][0]) {
            if (a[1][1] === b[1][1]) {
                return 0;
            }
            return a[1][1] > b[1][1] ? 1 : -1;
        } else {
            return a[1][0] > b[1][0] ? -1 : 1;
        }
    }).map(post => post[0]).slice(0, 2);
};

exports.filterFriends = (friends, search) => {
    if (search.length < 1 || search.length > 25) return [];
    const filteredFriends = friends.map(friend => [friend, [0, 0]]);
    for (let arr of filteredFriends) {
        arr[1][0] = commonChars(arr[0].username, search);
        arr[1][1] = minChanges(arr[0].username, search);
    }
    return filteredFriends.sort((a, b) => {
        if (a[1][0] === b[1][0]) {
            if (a[1][1] === b[1][1]) {
                return 0;
            }
            return a[1][1] > b[1][1] ? 1 : -1;
        } else {
            return a[1][0] > b[1][0] ? -1 : 1;
        }
    }).map(friend => friend[0]).slice(0, 2);
};

exports.filterMessages = (msgs, search) => {
    if (search.length < 1 || search.length > 25) return [];
    const filteredMsgs = msgs.map(msg => [msg, [0, 0]]);
    for (let arr of filteredMsgs) {
        arr[1][0] = commonChars(arr[0].message.title, search);
        arr[1][1] = minChanges(arr[0].message.title, search);
    }
    return filteredMsgs.sort((a, b) => {
        if (a[1][0] === b[1][0]) {
            if (a[1][1] === b[1][1]) {
                return 0;
            }
            return a[1][1] > b[1][1] ? 1 : -1;
        } else {
            return a[1][0] > b[1][0] ? -1 : 1;
        }
    }).map(msg => msg[0]).slice(0, 2);
};