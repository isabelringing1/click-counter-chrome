 /*global chrome*/
import './App.css';
import {useState, useEffect} from 'react';
import toGameIcon from './to_game.png'
import decal from './decal.png'
import bcSymbol from './bc.png'

function App() {
  const [clickCt, setClickCt] = useState(0);
  const [keyCt, setKeyCt] = useState(0);
  const [keysUnlocked, setKeysUnlocked] = useState(false);
  const [bc, setBc] = useState(0);

  useEffect(() => {
    chrome.runtime.onMessage.addListener( function (message, sender, sendResponse) {
      if (message.updatedClicks){
        setClickCt(message.updatedClicks);
      }
      if (message.keysUnlocked){
        setKeyCt(message.updatedKeys)
        setKeysUnlocked(true)
      }
      if (message.updatedBc){
        setBc(message.updatedBc);
      }
    });
    // App.js queries information from backoground.js, which gets its information from chrome storage.
    chrome.runtime.sendMessage({getClicks : true});
    chrome.runtime.sendMessage({getBc : true});
    chrome.runtime.sendMessage({getKeys : true});
  }, []);
  console.log("keys unlocked is " + keysUnlocked)
  
  return (
    <div className="App">
      <div className="border"></div>
      <img id="decal" src={decal}/>
      <a id="to-game-link" href="https://isabellee.me/breadwinner" target="_blank" rel="noreferrer"><img id="to-game" src={toGameIcon}/></a>
      <div id="logo">bw</div>
      <div id="click-ct">{clickCt.toLocaleString()} {clickCt == 1 ? "click" : "clicks"}</div>
      { keysUnlocked ? <div id="key-ct">{keyCt.toLocaleString()} {keyCt == 1 ? "key" : "keys"} </div> : null }
      {/*<div id="bc-ct"><span className="bc-symbol-span"><img className="bc-symbol" src={bcSymbol}/></span>{bc.toLocaleString()}</div>*/}
    </div>
  );
}

export default App;
