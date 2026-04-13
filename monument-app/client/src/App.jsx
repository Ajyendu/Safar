import { Route, Routes, useLocation } from "react-router-dom";
import { HomePage } from "./pages/HomePage.jsx";
import { LoginPage, SignupPage } from "./pages/LoginPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";

export default function App() {
  const { pathname } = useLocation();
  const authModal = pathname === "/login" || pathname === "/signup";
  return (
    <div className={authModal ? "contents" : "min-h-screen bg-surface"}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}
