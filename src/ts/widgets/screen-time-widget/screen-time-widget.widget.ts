import angular, { IAttributes, IController, IDirective, IScope, IHttpService } from "angular";
import { conf, notif, session } from "../../utils";
import { Chart, registerables } from "chart.js";
import moment, { Moment } from "moment";
import 'moment/locale/fr';
import { odeI18nModule } from "../../modules/i18n.module";

Chart.register(...registerables);
moment.locale('fr');

// Controller
export class Controller {
    public selectedUser: string = "";
    public viewMode: "weekly" | "daily" = "weekly";

    public userData: { [key: string]: { weekly: any, daily: any } } = {};
    public selectedDailyDate: string = moment().format('YYYY-MM-DD');
    public weekStart: Moment = moment().startOf('isoWeek'); // Monday
    public weekEnd: Moment = moment().endOf('isoWeek');     // Sunday

    public updateChart: () => void = () => { };

    public todayOnCampus = 0;
    public todayOffCampus = 0;
    public todayTotal = 0;
    public todaySchoolUsePercentage: number = 0;
    public todayOutOfSchoolPercentage: number = 0;

    public weeklyAvgOnCampus = 0;
    public weeklyAvgOffCampus = 0;
    public weeklyTotalAverage = 0;
    public weeklyAvgSchoolUsePercentage: number = 0;
    public weeklyAvgOutOfSchoolPercentage: number = 0;

    // new props
    public fixedTodayOnCampus = 0;
    public fixedTodayOffCampus = 0;
    public fixedTodayTotal = 0;
    public fixedTodaySchoolUsePercentage: number = 0;
    public fixedTodayOutOfSchoolPercentage: number = 0;

    public fixedWeeklyAvgOnCampus = 0;
    public fixedWeeklyAvgOffCampus = 0;
    public fixedWeeklyTotalAverage = 0;
    public fixedWeeklyAvgSchoolUsePercentage: number = 0;
    public fixedWeeklyAvgOutOfSchoolPercentage: number = 0;


    // end of new 


    public isParent: boolean = false;

    public hasError: boolean = false;
    public errorMessage: string = "";

    public fetchDataForCurrentUser: () => void = () => { };
    public fetchLightboxData: () => void = () => { };

    public showLightbox: boolean = false;
    public showDatePicker: boolean = false;

    public children: { id: string; name: string; userId: string }[] = [];
    public selectedChildHistogram = "";

    public toggleDatePicker(show: boolean) {
        this.showDatePicker = show;
    }

    public setDateFromPicker(date: string) {
        this.selectedDailyDate = moment(date).format('YYYY-MM-DD');
        this.showDatePicker = false;
        this.fetchLightboxData();
    }

    public toggleLightbox(show: boolean) {
        this.showLightbox = show;
        if (show) {
            // Store the current summary values when lightbox opens
            this.fixedTodayOnCampus = this.todayOnCampus;
            this.fixedTodayOffCampus = this.todayOffCampus;
            this.fixedTodayTotal = this.todayTotal;
            this.fixedTodaySchoolUsePercentage = this.todaySchoolUsePercentage;
            this.fixedTodayOutOfSchoolPercentage = this.todayOutOfSchoolPercentage;
            this.fixedWeeklyAvgOnCampus = this.weeklyAvgOnCampus;
            this.fixedWeeklyAvgOffCampus = this.weeklyAvgOffCampus;
            this.fixedWeeklyTotalAverage = this.weeklyTotalAverage;
            this.fixedWeeklyAvgSchoolUsePercentage = this.weeklyAvgSchoolUsePercentage;
            this.fixedWeeklyAvgOutOfSchoolPercentage = this.weeklyAvgOutOfSchoolPercentage;

            // Initialize lightbox dates to current date/week
            this.selectedDailyDate = moment().format('YYYY-MM-DD');
            this.weekStart = moment().startOf('isoWeek');
            this.weekEnd = moment().endOf('isoWeek');
            this.selectedChildHistogram = this.selectedUser;

        }
    }

    public changeDay(offset: number) {
        this.selectedDailyDate = moment(this.selectedDailyDate).add(offset, 'days').format('YYYY-MM-DD');
        this.fetchLightboxData();
    }

    public changeWeek(offset: number) {
        this.weekStart = this.weekStart.clone().add(offset, 'weeks');
        this.weekEnd = this.weekStart.clone().endOf('isoWeek');
        this.fetchLightboxData();
    }


    public get weekLabel(): string {
        const start = this.weekStart.format('dddd D MMMM');
        const end = this.weekEnd.format('dddd D MMMM');
        return `du ${start} au ${end}`;
    }

    public get dailyLabel(): string {
        return moment(this.selectedDailyDate).format('dddd D MMMM');
    }

    public get yesterdayTotal(): number {
        const yesterday = moment().subtract(1, 'day').format("YYYY-MM-DD");
        
        // Find the current user's data key
        const currentKey = `${this.selectedUser}_daily_${moment().format('YYYY-MM-DD')}_weekly_${moment().startOf('isoWeek').format('YYYY-MM-DD')}_${moment().endOf('isoWeek').format('YYYY-MM-DD')}`;
        const userData = this.userData[currentKey];
        
        if (!userData || !userData.weekly) {
            return 0;
        }
        
        const yesterdayData = userData.weekly[yesterday];
        if (!yesterdayData) {
            return 0;
        }
        
        return yesterdayData.duration || 0;
    }
}

function fetchAllScreenTimeDataForUserAndDates($http: IHttpService, ctrl: Controller, userId: string, dailyDate: string, startDate: string, endDate: string): Promise<{ weekly: any, daily: any }> {
    ctrl.children = fetchChildren(ctrl);

    const weeklyEndpoint = `/appregistry/screen-time/${userId}/weekly?startDate=${startDate}&endDate=${endDate}`;
    const dailyEndpoint = `/appregistry/screen-time/${userId}/daily?date=${dailyDate}`;

    return Promise.all([
        $http.get(weeklyEndpoint),
        $http.get(dailyEndpoint)
    ]).then(([weeklyResponse, dailyResponse]: [any, any]) => {
        console.log("weekly: ", weeklyResponse.data);
        console.log("daily: ", dailyResponse.data);
        ctrl.hasError = false;
        ctrl.errorMessage = "";
        return {
            weekly: weeklyResponse.data.dailySummaries.reduce((acc: any, day: any) => {
                acc[day.date] = {
                    duration: day.durationMinutes,
                    schoolUsePercentage: day.schoolUsePercentage / 100 // convert to ratio
                };
                return acc;
            }, {}),
            daily: dailyResponse.data.durations.map((hour: any) => ({
                hour: hour.hour,
                duration: hour.durationMinutes,
                schoolUsePercentage: hour.schoolUsePercentage / 100 // convert to ratio
            }))
        };
    }).catch(error => {
        ctrl.hasError = true;

        if (error?.status === 404) {
            ctrl.errorMessage = "Erreur lors de l’identification de l’utilisateur. Contactez l’administrateur de votre établissement.";
        } else {
            ctrl.errorMessage = "Un problème technique est survenu. Si le problème persiste contactez l’administrateur de votre établissement.";
        }

        console.error("Error fetching data for current user and dates:", error);
        return Promise.reject(error);
    });
}

function fetchChildren(ctrl: Controller) {
    const childrenObj = session().user.children;
    ctrl.isParent = false;

    const USE_MOCK_IDS = false;

    if (childrenObj && Object.keys(childrenObj).length > 0) {
        ctrl.isParent = true;

        // Replace userIds with mocked values: 100, 101, 102, ...
        let mockIdCounter = 100;

        return Object.entries(childrenObj).map(([userId, childData]) => {
            const child = childData as { firstName: string; lastName: string };
            const mockedId = (mockIdCounter++).toString(); // To remove and use real Id
            return {
                id: userId,
                name: `${child.firstName} ${child.lastName}`,
                userId: USE_MOCK_IDS ? mockedId : userId
            };
        });
    } else {
        return [];
    }
}

class Directive implements IDirective<IScope, JQLite, IAttributes, IController[]> {
    restrict = "E";
    template = require("./screen-time-widget.widget.html").default;
    scope = {};
    bindToController = true;
    controller = [Controller];
    controllerAs = "ctrl";
    require = ["odeScreenTimeWidget"];

    link(scope: IScope, elem: angular.IAugmentedJQuery, attrs: IAttributes, controllers?: IController[]) {
        const ctrl: Controller | null = controllers ? (controllers[0] as Controller) : null;
        if (!ctrl) return;

        const $http = angular.injector(["ng"]).get<IHttpService>("$http");
        const currentUserId = session().user.userId;

        ctrl.fetchDataForCurrentUser();

        let chartInstance: Chart | null = null;

        // Function to update the summary values from the pre-fetched weekly data
        const updateSummary = (weeklyData: any) => {
            const today = moment().format("YYYY-MM-DD");
            let todayOnCampusTemp = 0;
            let todayOffCampusTemp = 0;

            Object.keys(weeklyData).forEach(dateStr => {
                const entry = weeklyData[dateStr];
                const duration = entry.duration || 0;
                const schoolUsePct = entry.schoolUsePercentage || 0;

                const onCampus = duration * schoolUsePct;
                const offCampus = duration * (1 - schoolUsePct);

                if (moment(dateStr).format("YYYY-MM-DD") === today) {
                    todayOnCampusTemp = onCampus;
                    todayOffCampusTemp = offCampus;
                    ctrl.todaySchoolUsePercentage = entry.schoolUsePercentage * 100;
                    ctrl.todayOutOfSchoolPercentage = 100 - (entry.schoolUsePercentage * 100);
                }
            });

            ctrl.todayOnCampus = todayOnCampusTemp;
            ctrl.todayOffCampus = todayOffCampusTemp;
            ctrl.todayTotal = todayOnCampusTemp + todayOffCampusTemp;
        };

        // Helper to generate a unique key for caching data based on user and date range
        const generateDataKey = (userId: string, dailyDate: string, startDate: string, endDate: string) => {
            return `${userId}_daily_${dailyDate}_weekly_${startDate}_${endDate}`;
        };

        // New function assigned to ctrl.fetchDataForCurrentUser to be called from HTML
        ctrl.fetchDataForCurrentUser = () => {
            ctrl.errorMessage = "";
            ctrl.hasError = false;
            const currentKey = generateDataKey(
                ctrl.selectedUser,
                moment().format('YYYY-MM-DD'), // Always use today's date for initial load
                moment().startOf('isoWeek').format('YYYY-MM-DD'),
                moment().endOf('isoWeek').format('YYYY-MM-DD')
            );

            // Fetch initial summary data (today and current week)
            fetchAllScreenTimeDataForUserAndDates(
                $http,
                ctrl,
                ctrl.selectedUser,
                moment().format('YYYY-MM-DD'),
                moment().startOf('isoWeek').format('YYYY-MM-DD'),
                moment().endOf('isoWeek').format('YYYY-MM-DD')
            ).then((data) => {
                ctrl.userData[currentKey] = { weekly: data.weekly, daily: data.daily };
                updateSummary(data.weekly); // Update the main summary values
                scope.$applyAsync();
            }).catch(error => {
                scope.$applyAsync();
                console.error("Error fetching initial data for current user:", error);
            });
        };

        ctrl.fetchLightboxData = () => {

            const userIdForLightbox = ctrl.selectedChildHistogram || ctrl.selectedUser;

            if (!userIdForLightbox) return;

            const currentKey = generateDataKey(
                userIdForLightbox,
                ctrl.selectedDailyDate,
                ctrl.weekStart.format('YYYY-MM-DD'),
                ctrl.weekEnd.format('YYYY-MM-DD')
            );

            fetchAllScreenTimeDataForUserAndDates(
                $http,
                ctrl,
                userIdForLightbox,
                ctrl.selectedDailyDate,
                ctrl.weekStart.format('YYYY-MM-DD'),
                ctrl.weekEnd.format('YYYY-MM-DD')
            ).then((data) => {
                ctrl.userData[currentKey] = { weekly: data.weekly, daily: data.daily };
                if (ctrl.showLightbox) {
                    setTimeout(() => ctrl.updateChart(), 50);
                }
                scope.$applyAsync();
            }).catch(error => {
                console.error("Error fetching data for lightbox:", error);
            });
        };

        ctrl.updateChart = () => {
            const canvas = elem[0].querySelector<HTMLCanvasElement>("#myChart");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            if (chartInstance) chartInstance.destroy();

            let labels: string[] = [];
            let appTimes: number[] = [];

            const userIdForChart = ctrl.selectedChildHistogram || ctrl.selectedUser;

            // Use the dates from the lightbox controls for the chart data key
            const currentDataKey = generateDataKey(
                userIdForChart,
                ctrl.selectedDailyDate,
                ctrl.weekStart.format('YYYY-MM-DD'),
                ctrl.weekEnd.format('YYYY-MM-DD')
            );
            const currentUserAndDateData = ctrl.userData[currentDataKey];

            if (!currentUserAndDateData) return;

            const dataToUse: any = ctrl.viewMode === "weekly" ? currentUserAndDateData.weekly : currentUserAndDateData.daily;
            if (!dataToUse) return;

            if (ctrl.viewMode === "weekly") {
                const sortedDates = Object.keys(dataToUse).sort();

                sortedDates.forEach(dateStr => {
                    const entry = dataToUse[dateStr];
                    labels.push(moment(dateStr).format("ddd D"));
                    appTimes.push(entry.duration); // Total duration instead of separated
                });
            } else {
                dataToUse.forEach((hourData: any) => {
                    labels.push(`${hourData.hour}h`);
                    appTimes.push(hourData.duration); // Total duration instead of separated
                });
            }

            chartInstance = new Chart(ctx, {
                type: "bar",
                data: {
                    labels,
                    datasets: [
                        {
                            label: "", // Empty label to hide from legend
                            data: appTimes,
                            backgroundColor: "#2A9CC8"
                        }
                    ]
                },
                options: {
                    plugins: {
                        legend: {
                            display: false // Hide legend completely
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const value = context.raw;
                                    return `${value} minutes`;
                                }
                            }
                        }
                    },
                    responsive: true,
                    scales: {
                        x: {
                            // Removed stacked: true since we only have one dataset
                        },
                        y: {
                            // Removed stacked: true since we only have one dataset
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: "Minutes"
                            }
                        }
                    }
                }
            });
        };

        ctrl.children = fetchChildren(ctrl);

        // Determine the user whose data should be fetched on load
        if (ctrl.isParent && ctrl.children.length > 0) {
            // If a parent, and has children, default to the first child if no child is selected yet
            if (!ctrl.selectedUser) {
                ctrl.selectedUser = ctrl.children[0].userId;
            }
            ctrl.fetchDataForCurrentUser();
        } else if (!ctrl.isParent && currentUserId) {
            // If not a parent, and current user ID is available, fetch data for themselves
            ctrl.selectedUser = currentUserId; // Set selectedUser to the current logged-in user's ID
            ctrl.fetchDataForCurrentUser();
        } else {
            // No children AND no current user ID (or other error condition)
            ctrl.hasError = true;
            ctrl.errorMessage = "Aucun utilisateur disponible pour afficher les données de temps d'écran.";
            scope.$applyAsync(); // Ensure the error message is displayed
        }

        // Watch for changes in view mode (within lightbox): only updates the chart
        scope.$watch(() => ctrl.viewMode, (newVal, oldVal) => {
            if (newVal !== oldVal && ctrl.showLightbox) {
                setTimeout(() => ctrl.updateChart(), 50);
            }
        });
        // Watch for selectedUser changes within the lightbox to update chart data
        scope.$watch(() => ctrl.selectedChildHistogram, (newVal, oldVal) => { // Changed from ctrl.selectedUser
            if (newVal !== oldVal && ctrl.showLightbox) {
                ctrl.fetchLightboxData();
            }
        });

        // Watch for lightbox visibility changes
        scope.$watch(() => ctrl.showLightbox, (isVisible: boolean) => {
            if (isVisible) {
                // When lightbox opens:
                // 1. Set selectedChildHistogram. This will trigger the selectedChildHistogram watch,
                //    which will then call fetchLightboxData() (the single desired API call).
                ctrl.selectedChildHistogram = ctrl.selectedUser;

                // 2. Schedule chart update after a short delay, allowing fetchLightboxData() to begin.
                setTimeout(() => {
                    ctrl.updateChart();
                }, 100);
            } else {
                // When lightbox closes
                if (chartInstance) {
                    chartInstance.destroy();
                    chartInstance = null;
                }
            }
        });

    }
}

// Factory function for the directive
function DirectiveFactory() {
    return new Directive();
}

// Define the module name
export const odeModuleName = "odeCantineWidgetModule";

// Angular module definition
angular
    .module(odeModuleName, [odeI18nModule().name])
    // Define the custom 'duration' filter
    .filter('duration', function () {
        return function (input: number) {
            if (isNaN(input) || input === null || input < 0) {
                return '0m';
            }

            const totalMinutes = Math.floor(input);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;

            let result = '';

            if (hours > 0) {
                result += `${hours}h`;
            }
            if (minutes > 0 || (hours === 0 && totalMinutes === 0)) {
                result += `${minutes}m`;
            }

            return result.trim() || '0m';
        };
    })

    // Register the directive
    .directive("odeScreenTimeWidget", DirectiveFactory);

// Internationalization setup
notif()
    .onLangReady()
    .promise.then((lang: any): void => {
        switch (lang) {
            case "en":
                conf().Platform.idiom.addKeys(require("./i18n/en.json"));
                break;
            default:
                conf().Platform.idiom.addKeys(require("./i18n/fr.json"));
                break;
        }
    });
