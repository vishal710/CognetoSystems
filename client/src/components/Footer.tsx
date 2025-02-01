import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FaLinkedin, FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary">
                <FaLinkedin size={24} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <FaInstagram size={24} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <FaFacebook size={24} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <FaYoutube size={24} />
              </a>
            </div>
          </div>

          <div className="md:text-center">
            <Select defaultValue="en">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="text-sm text-muted-foreground">
          <p>© 2024 CognetoSystems. All rights reserved.</p>
          <p className="mt-2">
            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
          </p>
        </div>
      </div>
    </footer>
  );
}
