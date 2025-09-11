import { Card } from "@/components/ui/card";
import UsersDataTable from "../../components/UserDataTable";
import DataDownload from "@/components/DataDownload";

const UsersAdministrationView = () => {
  return (
    <Card className="p-6 mt-8">
      <div className="flex items-center mb-2 gap-3">
        <h2 className="text-md font-semibold text-primary">
          Insights About Users
        </h2>
      </div>
      <UsersDataTable />
    </Card>
  );
};

export default UsersAdministrationView;
