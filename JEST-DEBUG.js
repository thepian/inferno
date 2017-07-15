// This file is work around for jest-environment-jsdom plugin which kills debugger
var jsdom = require("jsdom").jsdom;
// We want to execute all scripts, because this is for test environment only
var document = jsdom("<!doctype html><html><body></body></html>", { runScripts: "dangerously" });
global.document = document;
global.window = document.defaultView;
global.navigator = global.window.navigator;
global.usingJSDOM = true;
