 /*global chrome*/
import './App.css';
import {useState, useEffect} from 'react';
import bcSymbol from './bc.png'

function App() {
  const [clickCt, setClickCt] = useState(0);
  const [bc, setBc] = useState(0);

  useEffect(() => {
    chrome.runtime.onMessage.addListener( function (message, sender, sendResponse) {
      if (message.updatedClicks){
        console.log(message)
        setClickCt(message.updatedClicks);
      }
      if (message.updatedBc){
        console.log(message)
        setBc(message.updatedBc);
      }
    });
    chrome.runtime.sendMessage({getClicks : true});
    chrome.runtime.sendMessage({getBc : true});
  }, []);
  
  
  return (
    <div className="App">
      <div id="click-ct">{clickCt.toLocaleString()} clicks</div>
      <div id="bc-ct"><span className="bc-symbol-span"><img className="bc-symbol" src={bcSymbol.toLocaleString()}/></span>{bc}</div>
    </div>
  );
}

export default App;
