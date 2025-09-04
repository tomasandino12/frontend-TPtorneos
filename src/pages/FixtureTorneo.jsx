import "../styles/IndexStyle.css";

function FixtureTorneo() {
    return (
    <div className="FixtureTorneo">
        <header>
            <nav className="navbar">
                <div className="navdiv">
                    <div className="logo">
                        <Link to="/gestorTorneos">Gestor de Torneos</Link>
                    </div>
                    <ul className="navlinks">
                        <li><Link to="/gestorTorneos"><i className='bx  bx-trophy-star'></i> Tabla de Posiciones</Link></li> 
                        <li><Link to="/estadisticas"><i className='bx  bx-chart-bar-big-columns'></i> Estadísticas</Link></li>
                        <li><Link to="/fixture" className="active"><i className='bx  bx-calendar' ></i> Fixture</Link></li>
                        <li><Link to="/equipos"> <i className='bx  bx-group'></i> Equipos</Link></li>
                        <li><Link to="/miPerfil"><i className='bx  bx-user'></i> Mi Perfil</Link></li>
                    </ul>
                </div>
            </nav>
        </header>
        <main>
            <p>ESTA ES LA PARTE DE ESTADISTICAS </p>
            <h3>Ingresar nombre del equipo</h3>
            <form>
                <input type="" name="Nombre de equipo" required="" />
                <input type="submit" />
            </form>
        </main>
        <footer>
            <h5> © 2025 - Gestor de Torneos -Para mas información o problemas con la página contactate a: 341 6173297 o a nuestra cuenta de instagram @todotorneos </h5>
        </footer>
    </div>
  );
}

export default FixtureTorneo;