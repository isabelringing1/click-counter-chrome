var clicks = 0;
var keys = 0;
var keysUnlocked = false;
var bc =  0;
const storageCache = { click_count: 0, bc_count: 0, key_count: 0, keys_unlocked: false };
var cacheLoaded = false;
var lastKeyDownTimestamp = 0;

var dupeKeyCutoff = 50; //ms to consider events a dupe

getStorageAsync();
document.addEventListener("click", (event) => {
    onClick();
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

// If tab is revisited, retreive storage again
document.addEventListener("visibilitychange", (event) => {
    if (document.visibilityState == "visible") {
        getStorageAsync();
    }
});

let _original_stopPropogation = Event.prototype.stopPropagation;
Event.prototype.stopPropagation = function (...args) {
    onClick();
    return _original_stopPropogation.apply(this, args);
};

async function onClick(){
    clicks++;
    if (cacheLoaded){
        await chrome.storage.sync.set({ "click_count" : clicks });
    }
    broadcastUpdatedClicks();
}

async function spendClicks(amount){
    clicks -= amount;
    if (cacheLoaded){
        await chrome.storage.sync.set({ "click_count" : clicks });
    }
    broadcastUpdatedClicks();
}

async function setClicks(amount){
    clicks = amount;
    if (cacheLoaded){
        await chrome.storage.sync.set({ "click_count" : clicks });
    }
    broadcastUpdatedClicks();
}

async function setBc(amount){
    bc = amount;
    if (cacheLoaded){
        console.log("Setting bc in storage to " + bc)
        await chrome.storage.sync.set({ "bc_count" : bc });
    }
    chrome.runtime.sendMessage({updatedBc : bc});
}

async function onKeyDown(e){
    var timeDiff = Math.abs(e.timeStamp - lastKeyDownTimestamp)
    lastKeyDownTimestamp = e.timeStamp
    if (!keysUnlocked || timeDiff < dupeKeyCutoff){
        return;
    }
    keys++;
    if (cacheLoaded){
        await chrome.storage.sync.set({ "key_count" : keys });
    }
    
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
    console.log("Extension: Unlocking keys")
    keysUnlocked = true;
    if (cacheLoaded){
        await chrome.storage.sync.set({ "keys_unlocked" : true });
    }
    broadcastUpdatedKeys();
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
    else if (event.data.id == "broadcastBc"){
        setBc(event.data.bc);
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
});

function broadcastUpdatedClicks(justMessage = false){
    if (!justMessage){
        chrome.runtime.sendMessage({updatedClicks : clicks});
    }
    window.postMessage({
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
