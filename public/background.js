chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

var totalClicks = 0;
var totalKeys = 0;
var bc = 0;
var keysUnlocked = false;
chrome.runtime.onMessage.addListener( function (message, sender, sendResponse) {
  chrome.storage.sync.get().then((items) => {
    totalClicks = items.click_count;
    totalKeys = items.key_count;
    bc = items.bc_count;
    keysUnlocked = items.keys_unlocked;

    // Background.js listens to messages from App.js AND Content.js and responds by sending information from storage or updating its own variables.
    if (message.updatedClicks){
      totalClicks = message.updatedClicks;
    }
    else if (message.getClicks){
      chrome.runtime.sendMessage({updatedClicks : totalClicks});
    }
    else if (message.getBc){
      chrome.runtime.sendMessage({updatedBc : bc});
    }
    else if (message.updatedKeys){
      totalKeys = message.updatedKeys;
    }
    else if (message.getKeys && keysUnlocked){
      chrome.runtime.sendMessage({updatedKeys: totalKeys, keysUnlocked: true });
    }
  });
});

chrome.storage.sync.get().then((items) => {
  totalClicks = items.click_count;
  totalKeys = items.key_count;
  bc = items.bc_count;
  keysUnlocked = items.keys_unlocked;
});