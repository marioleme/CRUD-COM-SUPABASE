import { Outlet } from "react-router-dom";
import MenuLateral from "../MenuLateral";
import "./styles.css";

export default function Layout() {
  return (
    <div className="container">
      <header className="cabecalho">
        <h1>Gerenciador de Projetos</h1>
      </header>
      <section className="conteudo">
        <MenuLateral />
        <div className="conteudo-principal">
          <Outlet />
        </div>
        </section>
        <footer className="rodape">
          <p>&copy; 2025 Gerenciador de Projetos Mario Oliveira</p>
        </footer>
      
    </div>
  );
}
