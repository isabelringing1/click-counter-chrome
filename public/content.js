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
    chrome.runtime.sendMessage({updatedClicks : clicks});
    console.log("content.js: updating clicks to " + clicks)
    window.postMessage({
        id: "updatedClicks",
        clicks: clicks
    });
}

async function getStorageAsync(){
    var items = await chrome.storage.sync.get();
    if (items){
        Object.assign(storageCache, items);
    }
    console.log("retreiving storage as " + storageCache.click_count)
    clicks = parseInt(storageCache.click_count);
    chrome.runtime.sendMessage({updatedClicks : clicks});
    cacheLoaded = true;

    // In case the website is listening
    window.postMessage({
        id: "updatedClicks",
        clicks: clicks
    });
}

// Listens to the website's request to get click count
window.addEventListener("message", (event) => {
    if (event.data.id == "getClicks"){
        window.postMessage({
            id: "updatedClicks",
            clicks: clicks
        });
    }
});

