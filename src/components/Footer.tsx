const Footer = () => {
  return (
    <footer
      className=" border-gray-200 dark:border-gray-700 
                       bg-white/50 dark:bg-sidebar/50 backdrop-blur-sm"
    >
      <div className="container mx-auto px-6 py-6 text-center">
        <div className="space-y-2">
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            © 2025 CLOVER
          </p>
          <p className="text-[#50B498] dark:text-[#9CDBA6] font-semibold">
            HCI Lab @ Temple
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
