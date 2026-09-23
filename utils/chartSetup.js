// Chart.js registration. This used to be a Nuxt plugin, which put Chart.js
// and its date adapter in the eager entry chunk of every page — including
// the landing page, where no chart is on screen. The chart components pull
// it in instead, so it travels in their chunk.
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  TimeScale,
  Title,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { chartFontFamily, doughnutCenterText } from "~/utils/chartTheme";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  TimeScale,
  Title,
  Tooltip,
  doughnutCenterText,
);

// The site's type on the canvas too, so a chart does not fall back to the
// Chart.js default sans while everything around it is the system font.
ChartJS.defaults.font.family = chartFontFamily;
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = "rgba(29, 29, 31, 0.68)";
ChartJS.defaults.borderColor = "rgba(29, 29, 31, 0.07)";
