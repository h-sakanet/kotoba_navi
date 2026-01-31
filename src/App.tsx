import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { WordList } from './pages/WordList';
import { Test } from './pages/Test';
// Import other pages as placeholders for now to avoid build errors if referenced in Home logic


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/view/:scopeId" element={<WordList />} />
        <Route path="/test/:scopeId" element={<Test />} />
      </Routes>
    </Router>
  );
}

export default App;
