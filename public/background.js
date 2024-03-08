chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

var totalClicks = 0;
var bc = 0;
chrome.runtime.onMessage.addListener( function (message, sender, sendResponse) {
  chrome.storage.sync.get().then((items) => {
    totalClicks = items.click_count;
    bc = items.bc_count;

    if (message.updatedClicks){
      totalClicks = message.updatedClicks;
    }
    else if (message.getClicks){
      chrome.runtime.sendMessage({updatedClicks : totalClicks});
    }
    else if (message.getBc){
      chrome.runtime.sendMessage({updatedBc : bc});
    }
  });
});

chrome.storage.sync.get().then((items) => {
  totalClicks = items.click_count;
  bc = items.bc_count;
});