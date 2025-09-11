import { Download } from "lucide-react";
import { BASE_ENDPOINT } from "../api/endpoints";
import { Button } from "./ui/button";

/**
 * DataDownload component allows admins to download all data.
 * It provides a button that triggers the download of all data in JSON format.
 * @returns {JSX.Element} - A React component that renders a button to download all data.
 */
const DataDownload = () => {
  return (
    <Button
      className="bg-gradient-to-r from-[#50B498] to-[#9CDBA6] 
                     hover:from-[#3a8a73] hover:to-[#50B498] 
                     text-white font-semibold py-3 px-8 rounded-xl
                     transition-all duration-200 hover:scale-105 hover:shadow-lg
                     border-0"
    >
      <a href={`${BASE_ENDPOINT}/data/`} className="flex items-center gap-2">
        <Download className="w-4 h-4" />
        <span>Download All Data</span>
      </a>
    </Button>
  );
};

export default DataDownload;
