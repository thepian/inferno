var jsdom = require("jsdom").jsdom;
// We want to execute all scripts, because this is for test environment only
var document = jsdom("<!doctype html><html><body></body></html>", { runScripts: "dangerously" });
global.document = document;
global.usingJSDOM = true;

// https://github.com/orta/vscode-jest
// `yarn add jest-environment-node-debug --dev`
// ` node --inspect-brk ./node_modules/.bin/jest --runInBand components2 --no-cache --no-watchman --env jest-environment-node-debug`
// https://github.com/facebook/jest/issues/1652#issuecomment-265423666
// https://github.com/kulshekhar/ts-jest/issues/46#issuecomment-276630132
// https://garethevans.com/2016/06/14/react-jest-typescript-and-visual-studio-code-on-windows/
// https://github.com/kulshekhar/ts-jest/issues/170#issuecomment-296353654
console.log("hit me");
