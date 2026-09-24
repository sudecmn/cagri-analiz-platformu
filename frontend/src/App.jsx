import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import TranscriptsPage from "./components/TranscriptsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import TranscriptDetail from "./components/TranscriptDetail";
import UserManagement from "./components/UserManagement";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transcripts" element={<TranscriptsPage />} />
          <Route path="/transcripts/:id" element={<TranscriptDetail />} />
          <Route path="/users" element={<UserManagement />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;




