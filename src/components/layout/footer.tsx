import Link from "next/link";

const Footer = () => {
  return (
    <footer className="w-full py-8 text-center text-muted-foreground text-sm">
      <p>
        Created by Jayprakash |{' '}
        <a
          href="mailto:deyjayprakash123@gmail.com"
          className="text-accent hover:text-primary transition-colors"
        >
          deyjayprakash123@gmail.com
        </a>
      </p>
    </footer>
  );
};

export default Footer;
