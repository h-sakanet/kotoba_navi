import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { WordList } from './pages/WordList';
import { Test } from './pages/Test';
import { LearningDashboard } from './pages/LearningDashboard';
import { SheetLockPreview } from './pages/ui-preview/SheetLockPreview';
import { LearningDashboardPreview } from './pages/ui-preview/LearningDashboardPreview';
// Import other pages as placeholders for now to avoid build errors if referenced in Home logic


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/view/:scopeId" element={<WordList />} />
        <Route path="/test/:scopeId" element={<Test />} />
        <Route path="/learning/:scopeId" element={<LearningDashboard />} />
        <Route path="/ui-preview/sheet-lock-a" element={<SheetLockPreview variant="a" />} />
        <Route path="/ui-preview/sheet-lock-b" element={<SheetLockPreview variant="b" />} />
        <Route path="/ui-preview/sheet-lock-c" element={<SheetLockPreview variant="c" />} />
        <Route path="/ui-preview/learning-dashboard-a" element={<LearningDashboardPreview variant="a" />} />
        <Route path="/ui-preview/learning-dashboard-b" element={<LearningDashboardPreview variant="b" />} />
        <Route path="/ui-preview/learning-dashboard-c" element={<LearningDashboardPreview variant="c" />} />
      </Routes>
    </Router>
  );
}

export default App;
