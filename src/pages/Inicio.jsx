import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import "../styles/Inicio.css";

function Inicio() {
  const navigate = useNavigate();
  const fechaHoy = new Date().toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="inicio-page">
    <div className="inicio-hero">
      <div className="inicio-overlay" />
      <div className="inicio-content">
        <span className="inicio-badge">EN VIVO</span>
        <h1 className="inicio-titulo">Bienvenido al Gestor de Torneos</h1>
        <p className="inicio-subtitulo">El torneo más esperado de la temporada</p>

        <div className="inicio-datos">
          <div className="inicio-dato">
            <FaCalendarAlt />
            <span>{fechaHoy}</span>
          </div>
          <div className="inicio-dato">
            <FaMapMarkerAlt />
            <span>Estadio Municipal, Rosario</span>
          </div>
        </div>

        <div className="inicio-botones">
          <button
            className="btn-hero-primary"
            onClick={() => navigate("/gestorTorneos/fixture")}
          >
            Ver Fixture
          </button>
          <button
            className="btn-hero-secondary"
            onClick={() => navigate("/gestorTorneos")}
          >
            Ver Tabla de Posiciones
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}

export default Inicio;
