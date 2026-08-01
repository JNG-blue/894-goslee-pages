import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { getCurrentUser, getInvitationCount } from "./actions";

export const metadata = {
  title: "Pages: Your Books Your World",
  description: "Pages is for readers",
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  const invitationCount = user?.id
    ? await getInvitationCount(user.id)
    : null;

  return (
    <html lang="en">
      <body>
        <Header user={user} invitationCount={invitationCount} />
        {children}
        <Footer user={user} />
      </body>
    </html>
  );
}