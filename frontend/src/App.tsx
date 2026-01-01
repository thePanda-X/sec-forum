import "./index.css";
import { Routes, Route } from "react-router-dom";
import { MainForum } from "./components/forum";
import { LoginPage } from "./components/auth/LoginPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainForum />
          </ProtectedRoute>
        }
      />
      {/* Add more routes as needed */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <MainForum />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
