import { Card } from "@/components/ui/card";
import ClassesDataTable from "../../../../classes/ui/components/ClassesDataTable";

const ClassesAdministrationView = () => {
  return (
    <Card className="p-6 mt-8">
      <div className="flex items-center mb-2 gap-3">
        <h2 className="text-md font-semibold text-primary">
          Insights About Classes
        </h2>
      </div>
      <ClassesDataTable />
    </Card>
  );
};

export default ClassesAdministrationView;
