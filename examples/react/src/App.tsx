import logo from './logo.svg';
import './App.css';
import { I18nContext } from './i18n/i18n-react';
import {useContext} from 'react';

function App() {
  const {LL, setLocale} = useContext(I18nContext)
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>
          {LL.welcome()}
        </h1>
        <p>
          {LL.subtitle()}
        </p>
        <div>
          <p>{LL.press()}</p>
          <button className="App-flag" onClick={() => setLocale('en')}>🇬🇧</button>
          <button className="App-flag" onClick={() => setLocale('de')}>🇩🇪</button>
          <button className="App-flag" onClick={() => setLocale('fr')}>🇫🇷</button>
          <button className="App-flag" onClick={() => setLocale('da')}>🇩🇰</button>
        </div>
      </header>
    </div>
  );
}

export default App;
