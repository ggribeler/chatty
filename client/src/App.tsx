import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Setup from './pages/Setup';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Setup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
