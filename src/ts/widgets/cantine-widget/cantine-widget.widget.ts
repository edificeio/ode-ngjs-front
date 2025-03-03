import angular, { IAttributes, IController, IDirective, IScope, ITimeoutService } from "angular";
import { conf, notif, http, session, Base64 } from "../../utils";
import moment from "moment";
import 'moment/locale/fr';
import axios from 'axios';

class Controller implements IController {
  data: any = {};
  error: any = null;
  uai: string = '';
  apiDate: string = moment().format('YYYY-MM-DD');
  public apply?: () => void;
  public currentDate: string = '';
  public pickerDate: Date;
  public showDatepicker: boolean = false;
  public previousApiDate: string = '';
  private inactivityTimeoutId: angular.IPromise<void> | null = null;


  constructor(private $scope: IScope) {
    this.uai = session().user.uai.toString()
    this.$scope = $scope;

    this.pickerDate = new Date();
    this.updateCurrentDateDisplay();
    this.updateApiDate();
    this.fetchMenu();
  }
  public changeDate(delta: number): void {
    const currentDate = new Date(this.pickerDate);
    currentDate.setDate(currentDate.getDate() + delta);
    this.pickerDate = currentDate;
    this.updateApiDate();
    if (this.apiDate !== this.previousApiDate) {
      this.previousApiDate = this.apiDate;
      this.updateCurrentDateDisplay();
      this.fetchMenu();
    }
  }

  public processDateSelection(): void {
    this.updateApiDate();
    if (this.apiDate !== this.previousApiDate) {
      this.previousApiDate = this.apiDate;
      this.updateCurrentDateDisplay();
      this.fetchMenu();
    }
    this.showDatepicker = false;
  }

  public onDateBlur(): void {
    if (this.pickerDate instanceof Date && !isNaN(this.pickerDate.getTime())) {
      this.processDateSelection();
      this.$scope.$apply(); // in case it's outside AngularJS digest
    }
  }


  public toggleDatepicker(forceOpen: boolean | null = null): void {
    if (forceOpen === true) {
      this.showDatepicker = true;
    } else if (forceOpen === false) {
      this.showDatepicker = false;
    } else {
      this.showDatepicker = !this.showDatepicker;
    }
  }

  private updateCurrentDateDisplay(): void {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    };
    this.currentDate = this.pickerDate.toLocaleDateString('fr-FR', options);
    this.currentDate = this.currentDate.charAt(0).toUpperCase() + this.currentDate.slice(1);

  }

  private updateApiDate(): void {
    this.apiDate = moment(this.pickerDate).format('YYYY-MM-DD');
  }

  fetchMenu() {
    // this.uai = "0772128V"; //use this in order to test locally
    axios.get(`/appregistry/${this.uai}/cantine/menu?date=${this.apiDate}`).then(
      (response) => {
        if (response.data && response.data.menu) {

          this.data = {
            entrees: response.data.menu.filter((item: any) => item.type === "entree"),
            plats: response.data.menu.filter((item: any) => item.type === "plat"),
            accompagnements: response.data.menu.filter((item: any) => item.type === "accompagnement"),
            laitage: response.data.menu.filter((item: any) => item.type === "laitage"),
            desserts: response.data.menu.filter((item: any) => item.type === "dessert"),
          };
          this.error = null;
        } else {
          this.data = { entrees: [], plats: [], accompagnements: [], desserts: [] };
          this.error = response.data?.error || "No menu data available.";
        }
        this.apply && this.apply();
      }
    ).catch((error) => {
      if (error.response?.status === 400) {
        console.warn("Received 400 error, returning empty menu.");
        this.data = { entrees: [], plats: [], accompagnements: [], desserts: [] };
        this.error = null; // No actual error, just no data
      } else {
        this.error = "An error occurred while fetching the menu.";
      }
      this.apply && this.apply();
    })
  }

  getAllergies(item: any): string[] {
    if (!item) {
      return [];
    }

    return Object.keys(item)
      .filter((key) => key.startsWith("allerg_") && item[key] !== 0 && item[key] !== undefined) // Avoid undefined and 0
      .map((key) => key.replace("allerg_", "").replace("_", " ")); // Format for display
  }

  // formatName(name: string): string {
  //   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  // }
}

/* Directive */
class Directive implements IDirective<IScope, JQLite, IAttributes, IController[]> {
  restrict = "E";
  template = require("./cantine-widget.widget.html").default;
  scope = {};
  bindToController = true;
  controller = [Controller];
  controllerAs = "ctrl";
  require = ["odeCantineWidget"];

  async link(scope: IScope, elem: JQLite, attrs: IAttributes, controllers?: IController[]) {
    const ctrl: Controller | null = controllers ? (controllers[0] as Controller) : null;
    if (!ctrl) {
      return;
    } else {
      ctrl.apply = () => {
        scope.$apply();
      };
    }

  }
}

/** The cantine widget. */
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

// THIS ANGULAR MODULE WILL BE DYNAMICALLY ADDED TO THE APPLICATION.
// RESPECT THE NAMING CONVENTION BY EXPORTING THE MODULE NAME :
export const odeModuleName = "odeCantineWidgetModule";
angular
  .module(odeModuleName, [])
  .directive("odeCantineWidget", DirectiveFactory);
