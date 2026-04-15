import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { HomePage } from "./pages/HomePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";

export default function App() {
  const { pathname } = useLocation();
  const authModal = pathname === "/login" || pathname === "/signup";
  return (
    <div className={authModal ? "contents" : "min-h-screen bg-surface"}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<Navigate to="/login" replace />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </div>
  );
}
