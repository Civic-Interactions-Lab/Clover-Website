import { Download } from "lucide-react";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { Button } from "./ui/button";
import { useState } from "react";
import CustomSelect from "./CustomSelect";

interface DownloadFormattedFileProps {
  data: any[];
  filename?: string;
  disabled?: boolean;
}

/**
 * DownloadFormattedFile component with built-in format selector
 * @param {any[]} data - The data array to be downloaded
 * @param {string} filename - Optional filename (default: 'data')
 */
const DownloadFormattedFile = ({
  data,
  filename = "data",
  disabled = false,
}: DownloadFormattedFileProps) => {
  const [format, setFormat] = useState<"csv" | "json">("csv");

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
    <div className="flex items-center gap-2">
      <CustomSelect
        value={format}
        onValueChange={(val) => setFormat(val as "csv" | "json")}
        options={[
          { label: "CSV", value: "csv" },
          { label: "JSON", value: "json" },
        ]}
        className="w-[120px] mr-2"
      />

      <Button
        onClick={handleDownload}
        className="bg-gradient-to-r from-[#50B498] to-[#9CDBA6] 
                   hover:from-[#3a8a73] hover:to-[#50B498] 
                   text-white font-semibold py-3 px-8 rounded-xl
                   transition-all duration-200 hover:scale-105 hover:shadow-lg
                   border-0"
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>Download {format.toUpperCase()}</span>
        </div>
      </Button>
    </div>
  );
};

export default DownloadFormattedFile;
