import LayoutDefault from "../layouts/LayoutDefault";
import "./Layout.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutDefault>{children}</LayoutDefault>;
}
