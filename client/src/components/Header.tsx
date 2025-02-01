import { Link } from "wouter";

export default function Header() {
  return (
    <header className="w-full border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <span className="font-bold text-2xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              CognetoSystems
            </span>
          </div>
        </Link>

        <nav className="flex gap-6">
          <Link href="/products">
            <span className="hover:text-primary cursor-pointer">Products</span>
          </Link>

          <span className="text-muted-foreground cursor-not-allowed">
            Resources
          </span>

          <span className="text-muted-foreground cursor-not-allowed">
            Pricing
          </span>

          <span className="text-muted-foreground cursor-not-allowed">
            About
          </span>
        </nav>
      </div>
    </header>
  );
}