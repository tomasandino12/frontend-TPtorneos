import "../styles/IndexStyle.css";
import "../styles/MiPerfil.css";
import { useEffect, useState } from "react";

function MiPerfil() {
  const [jugador, setJugador] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    const jugadorGuardado = JSON.parse(localStorage.getItem("jugador"));
    const jugadorId = jugadorGuardado?.id;

    const fetchJugador = async () => {
      try {
        console.log("Obteniendo datos de jugador con ID:", jugadorId);
        const response = await fetch(`http://localhost:3000/api/jugadores/${jugadorId}`);
        if (!response.ok) throw new Error("Error al obtener los datos del jugador");

        const data = await response.json();
        console.log("Datos del jugador recibidos:", data);

        
        setJugador(data.data);
      } catch (error) {
        console.error("Error al obtener el jugador:", error);
      } finally {
        setLoading(false);
      }
    };

    if (jugadorId) fetchJugador();
    else setLoading(false);
  }, []);

  const handleSalirEquipo = async () => {
  if (!jugador?.equipo) return;

  const confirmar = window.confirm("¿Estás seguro de que deseas salir de tu equipo?");
  if (!confirmar) return;

  try {
    const response = await fetch(`http://localhost:3000/api/jugadores/${jugador.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...jugador, equipo: null }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Error al salir del equipo");

    
    const actualizado = { ...jugador, equipo: null };
    setJugador(actualizado);
    localStorage.setItem("jugador", JSON.stringify(actualizado));

    
    if (data.message?.includes("Equipo eliminado")) {
      alert("⚠️ El equipo fue eliminado porque se quedó sin jugadores.");
    } else if (data.message?.includes("Nuevo capitán")) {
      alert("👑 Se asignó un nuevo capitán automáticamente.");
    } else {
      alert("Has salido del equipo correctamente.");
    }

    
    window.location.reload();

  } catch (error) {
    console.error("Error al salir del equipo:", error);
    alert("Ocurrió un error al salir del equipo.");
  }
};



  if (loading) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Cargando perfil...</p>;
  }

  if (!jugador) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>No se encontró información del jugador.</p>;
  }

  return (
    <div className="MiPerfil">
      <main className="mi-perfil-container">
        <h1 className="mi-perfil-titulo">👤 Mi Perfil</h1>
        <p className="mi-perfil-subtitulo">Gestiona tu información y estadísticas</p>

        <div className="perfil-seccion">
          <button className="boton-editar">✏️ Editar</button>

          <h2>Información Personal</h2>
          <p>Datos básicos del jugador</p>

          <div className="perfil-campo">
            <div className="input-grupo">
              <label>Nombre Completo</label>
              <input
                type="text"
                value={`${jugador.nombre} ${jugador.apellido}`}
                readOnly
              />
            </div>
            <div className="input-grupo">
              <label>Fecha de Nacimiento</label>
              <input type="text" value={jugador.fechaNacimiento || "—"} readOnly />
            </div>
          </div>

          <div className="perfil-campo">
            <div className="input-grupo">
              <label>Equipo</label>
              <input
                type="text"
                value={jugador.equipo?.nombreEquipo || "No perteneces a ningún equipo"}
                readOnly
                className={!jugador.equipo ? "input-vacio" : ""}
              />
            </div>
            <div className="input-grupo">
              <label>Posición</label>
              <input type="text" value={jugador.posicion || "—"} readOnly />
            </div>
          </div>

          {jugador.equipo && (
            <div className="boton-salir-container">
              <button className="boton-salir-equipo" onClick={handleSalirEquipo}>
                🚪 Salir del equipo
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MiPerfil;
