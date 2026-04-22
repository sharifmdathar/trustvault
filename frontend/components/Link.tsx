import { usePageContext } from "vike-react/usePageContext";

type LinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function Link({ href, children, className, onClick }: LinkProps) {
  const pageContext = usePageContext();
  const { urlPathname } = pageContext;
  const isActive =
    href === "/" ? urlPathname === href : urlPathname.startsWith(href);
  const activeClass = isActive ? "is-active" : undefined;
  const classes = [className, activeClass].filter(Boolean).join(" ");

  return (
    <a href={href} className={classes || undefined} onClick={onClick}>
      {children}
    </a>
  );
}
