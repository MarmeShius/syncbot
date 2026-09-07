import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";

import Navbar from "./components/Navbar";
import Footer from "./components/footer";
import Customer from "./pages/Customer";
import Agent from "./pages/Agent";
import Admin from "./pages/Admin";

import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <main className="site-content">
        <Routes>

          <Route path="/" element={<Home />} />

          <Route path="/about" element={<About />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />
          <Route path="/customer" element={<ProtectedRoute role="customer"><Customer /></ProtectedRoute>} />
          <Route path="/agent" element={<ProtectedRoute role="agent"><Agent /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />

        </Routes>
      </main>

      <Footer />

    </BrowserRouter>
  );
}

function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-50 p-10 text-center text-slate-500">Loading your workspace...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

export default App;