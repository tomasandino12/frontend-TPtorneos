import "../styles/IndexStyle.css";

function Equipos() {
  return (
    <div className="Equipos">
        <header>
            <nav className="navbar">
                <div className="navdiv">
                    <div className="logo">
                        <Link to="/gestorTorneos">Gestor de Torneos</Link>
                    </div>
                    <ul className="navlinks">
                        <li><Link to="/gestorTorneos"><i className='bx  bx-trophy-star'></i> Tabla de Posiciones</Link></li> 
                        <li><Link to="/estadisticas"><i className='bx  bx-chart-bar-big-columns'></i> Estadísticas</Link></li>
                        <li><Link to="/fixture"><i className='bx  bx-calendar' ></i> Fixture</Link></li>
                        <li><Link to="/equipos" className="active"> <i className='bx  bx-group'></i> Equipos</Link></li>
                        <li><Link to="/miPerfil"><i className='bx  bx-user'></i> Mi Perfil</Link></li>
                    </ul>
                </div>
            </nav>
        </header>
        <main>
            <p>ESTA ES LA PARTE DE EQUIPOS </p>
            <h3>Ingresar nombre del Jugador que desea agregar a su Equipo</h3>
            <form id="form-jugador">
                <input type="text" id="nombre" placeholder="Nombre" required />
                <input type="text" id="apellido" placeholder="Apellido" required />
                <button type="submit">Agregar</button>
            </form>
            <h2>Jugadores del Equipo</h2>
            <ul id="lista-jugadores"></ul>
        </main>
        <footer>
            <h5> © 2025 - Gestor de Torneos -Para mas información o problemas con la página contactate a: 341 6173297 o a nuestra cuenta de instagram @todotorneos </h5>
        </footer>
    </div>
  );
}

export default Equipos;
