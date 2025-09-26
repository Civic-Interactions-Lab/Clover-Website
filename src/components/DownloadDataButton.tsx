import { Download } from "lucide-react";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { Button } from "./ui/button";

interface DownloadDataButtonProps {
  data: any[];
  filename?: string;
  format?: "json" | "csv";
  buttonText?: string;
}

/**
 * DownloadDataButton component allows users to download data in JSON or CSV format.
 * @param {any[]} data - The data array to be downloaded
 * @param {string} filename - Optional filename (default: 'data')
 * @param {"json" | "csv"} format - Optional format (default: 'json')
 * @param {string} buttonText - Optional button text (default: 'Download Data')
 */
const DownloadDataButton = ({
  data,
  filename = "data",
  format = "json",
  buttonText = "Download Data",
}: DownloadDataButtonProps) => {
  const handleDownload = () => {
    if (!data || data.length === 0) {
      alert("No data to download");
      return;
    }

    if (format === "json") {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      saveAs(blob, `${filename}.json`);
    } else if (format === "csv") {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `${filename}.csv`);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      className="bg-gradient-to-r from-[#50B498] to-[#9CDBA6] 
                 hover:from-[#3a8a73] hover:to-[#50B498] 
                 text-white font-semibold py-3 px-8 rounded-xl
                 transition-all duration-200 hover:scale-105 hover:shadow-lg
                 border-0"
    >
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4" />
        <span>{buttonText}</span>
      </div>
    </Button>
  );
};

export default DownloadDataButton;
