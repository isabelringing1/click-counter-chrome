var clicks = 0;
var keys = 0;
var keysUnlocked = false;
var bc =  0;
const storageCache = { click_count: 0, bc_count: 0, key_count: 0, keys_unlocked: false };
var cacheLoaded = false;

var currentClickBatchIndex = 0
var batchClickSize = 10

var currentKeyBatchIndex = 0
var batchKeySize = 50

var lastClickTimestamp;
var lastKeyDownTimestamp = 0;

var longEnoughMs = 1000

// Tell background.js that content.js wants to receive get click messages
chrome.runtime.sendMessage({from:"content"}); 

getStorageAsync();
document.addEventListener("click", (event) => {
    onClick(event);
});
document.addEventListener("keydown", (event) => {
    onKeyDown(event);
});
document.addEventListener("input", (event) => {
    onKeyDown(event);
});

window.onload = () => {
    // Hack for google docs
    var editingIFrame = document.getElementsByClassName("docs-texteventtarget-iframe")[0];
    if (editingIFrame) {
        editingIFrame.contentDocument.addEventListener("keydown", (e) => {onKeyDown(e)}, false);
    }
}

chrome.runtime.onMessage.addListener(async function(message) {
    if (message.updateClicks){ // background.js tells us the popup has been opened, need to update clicks
        chrome.runtime.sendMessage({updatedClicks : clicks}); 
        await chrome.storage.sync.set({ "click_count" : clicks });
        currentClickBatchIndex = 0
    }
    if (message.updateKeys){
        chrome.runtime.sendMessage({updatedKeys: keys, keysUnlocked: keysUnlocked });
        await chrome.storage.sync.set({ "key_count" : keys });
        currentKeyBatchIndex = 0
    }
});

// If tab is revisited, retreive storage again
document.addEventListener("visibilitychange", (event) => {
    if (document.visibilityState == "visible") {
        getStorageAsync();
        chrome.runtime.sendMessage({from:"content"}); 
    }
    else if (document.visibilityState == "hidden"){
        //Save what we have
        chrome.storage.sync.set({ "click_count" : clicks, "key_count" : keys });
        currentClickBatchIndex = 0
        currentKeyBatchIndex = 0
        cacheLoaded = false
    }
});

window.addEventListener("focus", (event) => {
    getStorageAsync();
    chrome.runtime.sendMessage({from:"content"}); 
})

window.addEventListener("blur", (event) => {
    //Save what we have
    chrome.storage.sync.set({ "click_count" : clicks, "key_count" : keys });
    currentClickBatchIndex = 0
    currentKeyBatchIndex = 0
    cacheLoaded = false
});


let _original_stopPropogation = Event.prototype.stopPropagation;
Event.prototype.stopPropagation = function (...args) {
    onClick();
    return _original_stopPropogation.apply(this, args);
};

async function onClick(e){
    clicks++;
    currentClickBatchIndex++
    if (cacheLoaded){
        if (currentClickBatchIndex % batchClickSize == 0 || hasBeenLongEnough(e.timeStamp, lastClickTimestamp)){
            await chrome.storage.sync.set({ "click_count" : clicks });
            currentClickBatchIndex = 0
        }
    }
    lastClickTimestamp = e.timeStamp
    broadcastUpdatedClicks();
}

function hasBeenLongEnough(newTimestamp, lastTimestamp){
    if (newTimestamp - lastTimestamp > longEnoughMs){
        return true;
    }
    return false;
}

async function spendClicks(amount){
    clicks = Math.max(0, clicks - amount)
    /* if (cacheLoaded){
        await chrome.storage.sync.set({ "click_count" : clicks });
    }*/
    broadcastUpdatedClicks();
}

async function setClicks(amount){
    clicks = Math.max(0, amount)
    if (cacheLoaded){
        await chrome.storage.sync.set({ "click_count" : clicks });
    }
    broadcastUpdatedClicks();
}

async function onKeyDown(e){
    if (!keysUnlocked){
        return;
    }
    keys++;
    currentKeyBatchIndex++
    if (cacheLoaded){
        if (currentKeyBatchIndex % batchKeySize == 0 || hasBeenLongEnough(e.timeStamp, lastKeyDownTimestamp)){
            await chrome.storage.sync.set({ "key_count" : keys });
            currentKeyBatchIndex = 0
        }
    }
    lastKeyDownTimestamp = e.timeStamp
    broadcastUpdatedKeys();
}

async function spendKeys(amount){
    if (!keysUnlocked){
        return;
    }
    keys -= amount;
    if (cacheLoaded){
        await chrome.storage.sync.set({ "key_count" : keys });
    }
    broadcastUpdatedKeys();
}

async function unlockKeys(){
    keysUnlocked = true;
    if (cacheLoaded){
        await chrome.storage.sync.set({ "keys_unlocked" : true });
    }
    broadcastUpdatedKeys();
}

async function lockKeys(){
    keysUnlocked = false
    if (cacheLoaded){
        await chrome.storage.sync.set({ "keys_unlocked" : false });
    }
}

async function getStorageAsync(){
    var items = await chrome.storage.sync.get();
    if (items){
        Object.assign(storageCache, items);
    }
    clicks = parseInt(storageCache.click_count);
    bc = parseInt(storageCache.bc_count);
    keys = parseInt(storageCache.key_count);
    keysUnlocked = storageCache.keys_unlocked;
    chrome.runtime.sendMessage({updatedBc : bc});
    cacheLoaded = true;
    
    // In case the website is listening
    broadcastUpdatedClicks();
    broadcastUpdatedKeys();
}

// Listens to the Bread website's requests
window.addEventListener("message", (event) => {
    if (event.data.id == "getClicks"){
        broadcastUpdatedClicks(true);
    }
    else if (event.data.id == "spendClicks"){
        spendClicks(event.data.amount);
    }
    else if (event.data.id == "resetClicks"){
       spendClicks(clicks);
    }
    else if (event.data.id == "setClicks"){
        setClicks(event.data.amount);
    }
    else if (event.data.id == "getKeys"){
        broadcastUpdatedKeys();
    }
    else if (event.data.id == "unlockKeys"){
        unlockKeys();
    }
    else if (event.data.id == "spendKeys"){
        spendKeys(event.data.amount)
    }
    else if (event.data.id == "lockKeys"){
        lockKeys();
    }
});

function broadcastUpdatedClicks(justMessage = false){
    if (!justMessage){
        chrome.runtime.sendMessage({updatedClicks : clicks}); 
    }
    window.postMessage({ // alerts website
        id: "updatedClicks",
        clicks: clicks
    });
}

function broadcastUpdatedKeys(justMessage = false){
    if (!keysUnlocked){
        return;
    }
    if (!justMessage){
        chrome.runtime.sendMessage({updatedKeys : keys });
    }
    window.postMessage({
        id: "updatedKeys",
        keys: keys
    });
}
