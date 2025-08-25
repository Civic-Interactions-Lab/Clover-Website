import { ClassData } from "@/types/user";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClassesDropdownMenuProps {
  classes: ClassData[];
  onClassSelect: (classId: string | null) => void;
  selectedId?: string | null;
  placeholder?: string;
}

/**
 * ClassesDropdownMenu component renders a dropdown menu for selecting classes.
 * It allows users to select a specific class or view all classes.
 * @param {Object} props - The props for the ClassesDropdownMenu component.
 * @param {UserClass[]} props.classes - The list of classes to display in the dropdown.
 * @param props.onClassSelect - The function to call when a class is selected.
 * @param {string | null | undefined} props.selectedId - The currently selected class ID.
 * @param {string | undefined} props.placeholder - The placeholder text for the dropdown.
 */
const ClassesDropdownMenu = ({
  classes,
  onClassSelect,
  selectedId,
  placeholder,
}: ClassesDropdownMenuProps) => {
  console.log(classes);
  return (
    <Select
      value={selectedId || undefined}
      onValueChange={(value) => {
        onClassSelect(value);
      }}
    >
      <SelectTrigger className="w-full text-sm text-muted-foreground border-b border-slate-400 dark:border-sidebar-accent bg-gray-100 dark:bg-[#1a1a1a]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {classes.map((cls) => (
            <SelectItem key={cls.id} value={cls.id || ""}>
              <div className="flex items-center justify-start gap-2">
                <div
                  className="w-2 h-2 rounded flex-shrink-0"
                  style={{ backgroundColor: cls.classHexColor || "#cccccc" }}
                />
                <span>
                  {cls.classTitle}
                  {cls.classCode && <span> - {cls.classCode}</span>}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default ClassesDropdownMenu;
