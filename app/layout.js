import "./globals.css";
import Header from "./components/Header";
import { getCurrentUser } from "./actions";

export const metadata = {
  title: "Pages: Your Books Your World",
  description: "Pages is for readers",
};

const user = await getCurrentUser();
console.log(user);

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header user={user} />
        {children}
      </body>
    </html>
  );
}
