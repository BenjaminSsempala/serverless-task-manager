import "./globals.css";

export const metadata = {
  title: "Task Manager",
  description: "A serverless task management system on AWS.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
