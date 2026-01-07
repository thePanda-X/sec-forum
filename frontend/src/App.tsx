import "./index.css";
import { Routes, Route } from "react-router-dom";
import { MainForum } from "./components/forum";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { CreatePostPage } from "./components/forum/CreatePostPage";
import { PostView } from "./components/forum/PostView";
import { UserSettings } from "./components/settings/UserSettings";
import { UserProfile } from "./components/profile/UserProfile";
import { AdminPanel } from "./components/admin/AdminPanel";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainForum />
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-post"
        element={
          <ProtectedRoute>
            <CreatePostPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/post/:postId"
        element={
          <ProtectedRoute>
            <PostView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <UserSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:username"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminPanel />
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
