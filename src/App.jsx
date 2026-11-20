// TODO #1: shell de la aplicación (navegación, cabecera y contenido de cada ruta).
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Registro from './pages/Registro.jsx'
import Lista from './pages/Lista.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  return (
    <main className="container py-5">
      <h1>PescaControl</h1>
      <p className="text-body-secondary">
        Sistema de Gestión de Operaciones Pesqueras y Desembarque.
      </p>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/registro/:id" element={<Registro />} />
        <Route path="/lista" element={<Lista />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  )
}

export default App
