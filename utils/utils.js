const { readFile, appendFile } = require('fs');

function readFromFile(file){
    return new Promise(function (resolve, reject){
        readFile(file, function(err, data){
            if (err) reject(err);
            resolve(data);
        });
    });
}
function appendToFile(file, data){
    return new Promise(function (resolve, reject) {
        appendFile(file, data, function(err){
            if(err) reject(err);
            resolve();
        });
    });
}

module.exports = {
    readFromFile,
    appendToFile
}