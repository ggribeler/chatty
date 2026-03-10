import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api/client';
import Setup from './pages/Setup';
import Inbox from './pages/Inbox';

function App() {
  const [accountExists, setAccountExists] = useState<boolean | null>(null);

  useEffect(() => {
    api.getAccount()
      .then((account) => setAccountExists(account.exists))
      .catch(() => setAccountExists(false));
  }, []);

  if (accountExists === null) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={accountExists ? <Navigate to="/inbox" /> : <Setup />} />
        <Route path="/inbox" element={accountExists ? <Inbox /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
