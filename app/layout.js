import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { getCurrentUser, getInvitationCount } from "./actions";

export const metadata = {
  title: "Pages: Your Books Your World",
  description: "Pages is for readers",
};

const user = await getCurrentUser();
const invitationCount = await getInvitationCount(user.id);
console.log("layout.js L13",user, invitationCount);

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header user={user} invitationCount = {invitationCount} />
        {children}
        <Footer user={user} />
      </body>
    </html>
  );
}
