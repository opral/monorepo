import {
  Route,
  Switch,
  useLocation,
} from 'react-router-dom';
import NavBar from './components/nav/NavBar';
import Home from './pages/home/Home';
import Categories from './pages/categories/Categories';
import NotMatch from './pages/NotMatch';

function App() {
  const location = useLocation();
  return (
    <div className="App">
      <NavBar />
      <Switch location={location} key={location.pathname}>
        <Route exact path="/">
          <Home />
        </Route>
        <Route path="/categories">
          <Categories />
        </Route>
        <Route path="*">
          <NotMatch />
        </Route>
      </Switch>
    </div>
  );
}

export default App;
