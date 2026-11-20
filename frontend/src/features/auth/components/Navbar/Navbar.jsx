import Upper from "./UpperSection"
import Bottom from "./Bottom";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <Upper />
      <Bottom />
    </header>
  );
};

export default Navbar;