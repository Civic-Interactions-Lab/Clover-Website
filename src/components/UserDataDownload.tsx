import { Download } from "lucide-react";
import { Button } from "./ui/button";
import { BASE_ENDPOINT } from "@/api/endpoints";

const UserDataDownload = ({ userId }: { userId: string }) => {
  return (
    <Button>
      <a
        href={`${BASE_ENDPOINT}/data/${userId}`}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        <span>Download User Data</span>
      </a>
    </Button>
  );
};

export default UserDataDownload;
