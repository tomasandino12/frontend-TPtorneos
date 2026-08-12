import "../styles/IndexStyle.css";
import "../styles/Equipos.css";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import MobileBottomNav from "../components/MobileBottomNav.jsx";
import EquipoInfo from "../components/EquipoInfo.jsx";
import { PageShell } from "../components/ui";

// Ruta standalone /equipo/:id: se usa para ver CUALQUIER equipo (ej. desde un
// click en una fila de Tabla de Posiciones), no solo el propio — por eso
// conserva su layout con Navbar/footer completo. El contenido en sí vive en
// EquipoInfo, compartido con Equipos.jsx (que lo renderiza directo para el
// propio equipo del jugador, sin pasar por esta ruta).
//
// Lleva MobileBottomNav igual que GestorTorneos.jsx: el Navbar oculta los
// links en mobile (ver Navbar.css), así que cualquier pantalla que lo use
// necesita la barra inferior para seguir teniendo navegación.
function EquipoDetalle() {
  const { id } = useParams();

  return (
    <div className="layout">
      <Navbar />
      <main className="content">
        <PageShell>
          <EquipoInfo equipoId={Number(id)} />
        </PageShell>
      </main>
      <footer className="footer gt-page-footer">
        <h5>© 2025 - Gestor de Torneos -Para mas información o problemas con la página contactate a: 341 6173297 o a nuestra cuenta de instagram @todotorneos</h5>
      </footer>
      <MobileBottomNav />
    </div>
  );
}

export default EquipoDetalle;
