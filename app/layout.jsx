import "./globals.css";

export const metadata = {
  title: "Admin Dashboard",
  description: "Dashboard deployed to Vercel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
