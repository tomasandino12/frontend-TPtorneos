import "../styles/IndexStyle.css"; 
import "../styles/TablaPosiciones.css"; 


function TablaPosiciones() {
  return (
    <div className="tabla-container">
      <h2 className="tabla-titulo">🏆 Liga Amateur 2024</h2>
      <p className="tabla-subtitulo">Tabla de Posiciones - Temporada Regular</p>

      <table className="tabla-posiciones">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Equipo</th>
            <th>PJ</th>
            <th>PG</th>
            <th>PE</th>
            <th>PP</th>
            <th>GF</th>
            <th>GC</th>
            <th>DG</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Los Tigres FC</td>
            <td>8</td>
            <td className="positivo">6</td>
            <td>1</td>
            <td className="negativo">1</td>
            <td>18</td>
            <td>8</td>
            <td className="positivo">+10</td>
            <td className="puntos">19</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Águilas United</td>
            <td>8</td>
            <td className="positivo">5</td>
            <td>2</td>
            <td className="negativo">1</td>
            <td>15</td>
            <td>7</td>
            <td className="positivo">+8</td>
            <td className="puntos">17</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default TablaPosiciones;
