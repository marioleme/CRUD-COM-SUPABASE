import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Layout from "./componentes/Layout";
import PaginaInicial from "./paginas/PaginaInicial";
import NovaPublicacao from "./paginas/NovaPublicacao";
import EditarPublicacao from "./paginas/EditarPublicacao";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<PaginaInicial />} />
          <Route path="nova-publicacao" element={<NovaPublicacao />} />
          <Route path="editar-publicacao/:id" element={<EditarPublicacao />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
