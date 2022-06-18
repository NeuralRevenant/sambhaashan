const fs = require('fs');
const path = require('path');

module.exports = (filePath) => {
    if (!filePath) {
        return;
    }
    const finalPath = path.join(__dirname, '..', filePath);
    fs.unlink(finalPath, (err) => {
        if (err) {
            throw (err);
        }
    });
};