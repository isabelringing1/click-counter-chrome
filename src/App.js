 /*global chrome*/
import './App.css';
import {useState, useEffect} from 'react';

function App() {
  const [clickCt, setClickCt] = useState(0);

  useEffect(() => {
    chrome.runtime.onMessage.addListener( function (message, sender, sendResponse) {
      if (message.updatedClicks){
        setClickCt(message.updatedClicks);
      }
    });
    chrome.runtime.sendMessage({getClicks : true});
  }, []);
  
  
  return (
    <div className="App">
      Click Count: {clickCt}
    </div>
  );
}

export default App;
