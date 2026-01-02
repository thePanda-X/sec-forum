import "./index.css";
import { Routes, Route } from "react-router-dom";
import { MainForum } from "./components/forum";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { CreatePostPage } from "./components/forum/CreatePostPage";
import { PostView } from "./components/forum/PostView";

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
