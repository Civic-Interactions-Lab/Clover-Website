import { useAIStats } from "../../hooks/useAIStats";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import "react-datepicker/dist/react-datepicker.css";
import { AIStatGraph } from "../../components/AIStatGraph";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

/**
 * DevDashboard component
 * This component is responsible for rendering the developer dashboard.
 * It includes a sidebar for user selection, a details panel for user information,
 * and a graph for AI statistics.
 * @returns {JSX.Element} The DevDashboard component.
 */
export const DevDashboard = () => {
  const { aiStats } = useAIStats();

  return (
    <div>
      <div className="w-full mb-6 text-text">
        <AIStatGraph aiStats={aiStats} />
      </div>
    </div>
  );
};

export default DevDashboard;
