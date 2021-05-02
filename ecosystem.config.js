module.exports = {
    apps: [{
        name: "bible-robot",
        "script": "./node_modules/.bin/ts-node", // or locally "./node_modules/.bin/_ts-node" 
        "args": "server/index.ts",
        "env": {
        }
    }]

}