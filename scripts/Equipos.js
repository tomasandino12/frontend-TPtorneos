document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-jugador');
  const lista = document.getElementById('lista-jugadores');

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Evita que recargue la página

    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;

    if (nombre.trim() === '' || apellido.trim() === '') return;          //el .trim() saca espacios en blanco en inicio y final, la linea verifica que no haya campos en blanco

    const nuevoJugador = document.createElement('li');                 
    nuevoJugador.textContent = `${nombre} ${apellido}`;
    lista.appendChild(nuevoJugador);

    form.reset(); // Limpia el formulario
  });
});
