import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';



export function Footer() {
  // Footer links data
  const footerLinks = {   
    quickLinks: [
      { name: "Home", href: "/" },
      { name: "Pricing", href: "/pricing" },
      { name: "Features", href: "#" },
      { name: "Contact", href: "#" }
    ],
    moreLinks: [
      { name: "About Us", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Support", href: "#" }
    ],
    useCases: [
      { name: "Parental Control", href: "#" },
      { name: "Employee Monitoring", href: "#" },
      { name: "Device Security", href: "#" },
      { name: "Data Backup", href: "#" }
    ],
    legalPolicies: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Refund Policy", href: "#" },
      { name: "Disclaimer", href: "#" }
    ]
  };

  return (
    <footer className="mt-10 border-t border-gray-200 pt-12 px-24 bg-amber-600">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Quick Links */}
        <div>
          <h3 className="text-md font-semibold text-gray-900 tracking-wider uppercase mb-4">
            Quick Links
          </h3>
          <ul className="space-y-2">
            {footerLinks.quickLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} className="text-md text-white hover:text-gray-900">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* More Links */}
        <div>
          <h3 className="text-md font-semibold text- tracking-wider uppercase mb-4">
            More Links
          </h3>
          <ul className="space-y-2">
            {footerLinks.moreLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} className="text-md text-white hover:text-gray-900">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Use Cases */}
        <div>
          <h3 className="text-md font-semibold text-gray-900 tracking-wider uppercase mb-4">
            Use Cases
          </h3>
          <ul className="space-y-2">
            {footerLinks.useCases.map((link) => (
              <li key={link.name}>
                <a href={link.href} className="text-md text-white hover:text-gray-900">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Policies */}
        <div>
          <h3 className="text-md font-semibold text-gray-900 tracking-wider uppercase mb-4">
            Legal Policies
          </h3>
          <ul className="space-y-2">
            {footerLinks.legalPolicies.map((link) => (
              <li key={link.name}>
                <a href={link.href} className="text-md text-white hover:text-gray-900">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Payment Methods and Social Links */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Payment Methods */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Secure Payments</h4>
            <div className="flex space-x-4">
              <img src="/visa.png" alt="Visa" className="h-10 " />
              <img src="/mc.png" alt="Mastercard" className="h-10" />
              <img src="/PayPal1.webp" alt="PayPal" className="h-10  " />
              <img src="/paytmupi.webp" alt="Paytm" className="h-10" />
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Connect With Us</h4>
            <div className="flex space-x-4">
              <a href="#" className=" hover:text-white">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className=" hover:text-white">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className=" hover:text-white">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className=" hover:text-white">
                <Linkedin className="h-6 w-6" />
              </a>
              <a href="#" className=" hover:text-white">
                <Youtube className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </div>

 
    </footer>
  );
}