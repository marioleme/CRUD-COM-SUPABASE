import { Link } from "react-router-dom";
import Logo from "./assets/logo.png";
import Feed from "./assets/feed.svg";
import "./styles.css";

export default function MenuLateral() {
  return (
    <aside>
      <nav>
        <ul className="lista-sidebar">
          <li>
            <Link to="/" >
              <img  className="logo"  src={Logo} alt="Logo do CodeConnect" />
            </Link>
          </li>
             <li>
            <Link to="/" className="item__link-publicacao">
              <img src={Feed} alt="" />
              <span>Home</span>
            </Link>
          </li>
          <li>
            <Link to="/nova-publicacao" className="item__link-publicacao">
              Criar
            </Link>
          </li>
       

        </ul>
      </nav>
    </aside>
  );
}
