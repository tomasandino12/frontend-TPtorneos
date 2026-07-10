import { Outlet } from "react-router-dom";
import "../styles/IndexStyle.css";
import Navbar from "../components/Navbar.jsx";

function GestorTorneos() {
  return (
    <div className="layout">
      <Navbar />

      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">
        <h5>© 2025 - Gestor de Torneos -Para mas información o problemas con la página contactate a: 341 6173297 o a nuestra cuenta de instagram @todotorneos</h5>
      </footer>
    </div>
  );
}

export default GestorTorneos;
