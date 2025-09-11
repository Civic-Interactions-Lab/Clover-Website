import { Outlet } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
