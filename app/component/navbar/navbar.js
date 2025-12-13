import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/map">Map</Link>
      <Link href="/login">Login</Link>
    </nav>
  );
}
