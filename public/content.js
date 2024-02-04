var clicks = 0;
const storageCache = { click_count: 0 };
var cacheLoaded = false;

getStorageAsync();
document.addEventListener("click", (event) => {
    onClick();
});
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

async function getStorageAsync(){
    var items = await chrome.storage.sync.get();
    if (items){
        Object.assign(storageCache, items);
    }
    clicks = parseInt(storageCache.click_count);
    cacheLoaded = true;
    
    // In case the website is listening
    broadcastUpdatedClicks();
}

// Listens to the website's requests
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
