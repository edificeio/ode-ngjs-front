import angular, { IAttributes, IController, IDirective, IScope } from "angular";
import { conf, notif } from "../../utils";
import { Chart, registerables } from "chart.js";

// Register Chart.js components
Chart.register(...registerables);

// Screen time data structure
interface ScreenTimeData {
    weekly: {
        [key: string]: number[]; // per user, 7-day weekly data
    };
    daily: {
        [key: string]: { [hour: string]: number }; // per user, hourly screen time (e.g., "09:00": 30)
    };
}
// Mocked API function
function fetchScreenTimeData(): Promise<ScreenTimeData> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                weekly: {
                    Mathieu: [12, 19, 3, 5, 2, 3, 1],
                    Jean: [5, 8, 6, 7, 4, 2, 3]
                },
                daily: {
                    Mathieu: {
                        "08:00": 15,
                        "09:00": 10,
                        "10:00": 30,
                        "11:00": 20,
                        "12:00": 25,
                        "13: 00": 17,
                        "16:00": 5,
                        "18:00": 10,
                        "20:00": 8,
                        "22:00": 12,
                        "23:00": 4
                    },
                    Jean: {
                        "07:00": 5,
                        "09:00": 25,
                        "10:00": 10,
                        "18:00": 15
                    }
                }
            });
        }, 100);
    });
}


// Controller
export class Controller {
    public selectedUser: string = "Mathieu";
    public viewMode: "weekly" | "daily" = "weekly";
    public screenTimeData: ScreenTimeData = { weekly: {}, daily: {} };
    public updateChart: () => void = () => { };
}


class Directive implements IDirective<IScope, JQLite, IAttributes, IController[]> {
    restrict = "E";
    template = require("./screen-time-widget.widget.html").default;
    scope = {};
    bindToController = true;
    controller = [Controller];
    controllerAs = "ctrl";
    require = ["odeScreenTimeWidget"];

    async link(scope: IScope, elem: angular.IAugmentedJQuery, attrs: IAttributes, controllers?: IController[]) {
        const ctrl: Controller | null = controllers ? (controllers[0] as Controller) : null;
        if (!ctrl) return;

        let chartInstance: Chart | null = null;
        let debounceTimeout: any;

        // Wait for DOM render
        scope.$evalAsync(() => {
            const canvas = elem[0].querySelector<HTMLCanvasElement>("#myChart");
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Init blank chart first
            chartInstance = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: [],
                    datasets: [{
                        label: "",
                        data: [],
                        borderWidth: 1,
                        backgroundColor: "#4e79a7"
                    }]
                },
                options: {
                    animation: false,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true
                        },
                        tooltip: {
                            enabled: false
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 10
                            }
                        },
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            // Fetch and update chart
            fetchScreenTimeData().then((data) => {
                ctrl.screenTimeData = data;
                ctrl.updateChart();
            });

            ctrl.updateChart = () => {
                if (!chartInstance) return;

                requestAnimationFrame(() => {
                    let labels: string[] = [];
                    let values: number[] = [];

                    if (ctrl.viewMode === "weekly") {
                        labels = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
                        values = ctrl.screenTimeData.weekly[ctrl.selectedUser] || [];
                    } else {
                        const daily = ctrl.screenTimeData.daily[ctrl.selectedUser] || {};
                        labels = Object.keys(daily);
                        values = labels.map(hour => daily[hour]);
                    }

                    if (chartInstance) {
                        chartInstance.data.labels = labels;
                        chartInstance.data.datasets[0].data = values;
                        chartInstance.data.datasets[0].label =
                            ctrl.viewMode === "weekly"
                                ? "Temps d'écran hebdo (heures)"
                                : "Temps d'écran aujourd'hui (minutes)";
                        chartInstance.update();
                    }

                });
            };


            // Watcher for view mode or user change (if you bind to select/input in HTML)
            scope.$watch(() => ctrl.selectedUser, () => ctrl.updateChart());
            scope.$watch(() => ctrl.viewMode, () => ctrl.updateChart());
        });
    }
}

function DirectiveFactory() {
    return new Directive();
}

notif()
    .onLangReady()
    .promise.then((lang) => {
        switch (lang) {
            default:
                conf().Platform.idiom.addKeys(require("./i18n/fr.json"));
                break;
        }
    });

export const odeModuleName = "odeCantineWidgetModule";

angular
    .module(odeModuleName, [])
    .directive("odeScreenTimeWidget", DirectiveFactory);
