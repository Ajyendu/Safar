import { Link, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-surface">
      <nav className="fixed bottom-0 left-0 right-0 z-[40] flex justify-center gap-6 border-t border-white/10 bg-surface-card/95 py-3 text-xs font-medium text-zinc-500 backdrop-blur sm:top-0 sm:bottom-auto sm:justify-end sm:px-6 sm:py-3">
        <Link to="/" className="hover:text-white">
          Map
        </Link>
        <Link to="/profile" className="hover:text-white">
          Profile
        </Link>
        <Link to="/login" className="hover:text-white">
          Auth
        </Link>
        <Link to="/admin" className="hover:text-white">
          Admin
        </Link>
      </nav>
      <div className="pb-16 sm:pb-0 sm:pt-12">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </div>
  );
}
