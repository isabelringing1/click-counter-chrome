chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

var totalClicks = 0;
chrome.runtime.onMessage.addListener( function (message, sender, sendResponse) {
  if (message.updatedClicks){
    totalClicks = message.updatedClicks;
  }
  else if (message.getClicks){
    chrome.runtime.sendMessage({updatedClicks : totalClicks});
  }
});

chrome.storage.sync.get().then((items) => {
  totalClicks = items.click_count;
});