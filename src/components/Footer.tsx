// El año se calcula una vez al cargar la app.
const anio = new Date().getFullYear()

function Footer() {
  return (
    <footer className="pc-footer">
      <p className="m-0">
        <span className="fw-semibold text-body">PescaControl</span> · Universidad Tecnológica del
        Perú · © {anio}
      </p>
      <a
        href="https://github.com/KevinDC65/PescaControl"
        target="_blank"
        rel="noreferrer"
        className="pc-footer-enlace"
      >
        <i className="bi bi-github" aria-hidden="true" />
        Repositorio en GitHub
      </a>
    </footer>
  )
}

export default Footer
