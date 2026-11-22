import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";

const socialLinks = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1MiaLz3xmp/",
    icon: FaFacebookF,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/ceylonevibe/",
    icon: FaInstagram,
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/94750151250",
    icon: FaWhatsapp,
  },
];

export default function SocialLinks({ className = "" }) {
  return (
    <div className={`social-links ${className}`.trim()} aria-label="Social media">
      {socialLinks.map(({ name, href, icon: Icon }) => (
        <a
          key={name}
          href={href}
          aria-label={`Ceylone Vibe on ${name}`}
          title={name}
          target="_blank"
          rel="noreferrer"
        >
          <Icon aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
