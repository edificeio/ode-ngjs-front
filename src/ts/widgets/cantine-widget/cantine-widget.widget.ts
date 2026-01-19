import angular, { IAttributes, IController, IDirective, IScope } from "angular";
import { conf, notif, session } from "../../utils";
import moment from "moment";
import 'moment/locale/fr';
import axios from 'axios';

class Controller implements IController {
  data: any = {};
  error: string | null = null;
  uaiList: string[] = [];
  selectedUai: string = '';
  schoolOptions: { uai: string; name: string }[] = [];

  menuUnavailable: boolean = false;
  noStructuresError: boolean = false;
  loadStructuresError: boolean = false;
  selectInstitutionError: boolean = false;
  menuNotAvailableError: boolean = false;
  menuUnavailableForInstitutionError: boolean = false;
  loadMenuError: boolean = false;
  dinnerAvailable: boolean = false;
  currentMenuType: 'lunch' | 'dinner' = 'lunch';
  lunchData: any = { entrees: [], plats: [], accompagnements: [], desserts: [], laitage: [] };
  dinnerData: any = { entrees: [], plats: [], accompagnements: [], desserts: [], laitage: [] };

  apiDate: string;
  currentDate: string = '';
  pickerDate: Date = new Date();
  showDatepicker: boolean = false;
  previousApiDate: string = '';

  public apply?: () => void;

  constructor(private $scope: IScope) {
    const user = session().user;

    this.apiDate = moment(this.pickerDate).format('YYYY-MM-DD');
    this.updateCurrentDateDisplay();

    const uaiFromSession = user.uai;
    if (Array.isArray(uaiFromSession) && uaiFromSession.length > 1) {
      this.loadUserStructures(user.userId);
    } else if (typeof uaiFromSession === 'string' || (Array.isArray(uaiFromSession) && uaiFromSession.length === 1)) {
      this.uaiList = Array.isArray(uaiFromSession) ? uaiFromSession : [uaiFromSession];
      const nameList = Array.isArray(user.structureNames) ? user.structureNames : [];

      this.schoolOptions = this.uaiList.map((uai, i) => ({ uai, name: nameList[i] || uai }));

      this.setupUaiDropdown(); // 🔹 call helper
    } else {
      this.uaiList = [];
      this.schoolOptions = [];
      this.selectedUai = '';
    }
  }

  onUaiSelected() {
    if (this.selectedUai) {
      this.fetchMenu();
    }
  }

  get showUaiDropdown(): boolean {
    return this.schoolOptions.length > 1;
  }

  async loadUserStructures(userId: string) {
    try {
      const { data } = await axios.get(`/directory/user/${userId}`);
      if (data && Array.isArray(data.structureNodes)) {
        this.schoolOptions = data.structureNodes.map((node: any) => ({
          uai: node.UAI,
          name: node.feederName || node.name || node.UAI,
        }));
        this.uaiList = this.schoolOptions.map(opt => opt.uai);

        this.setupUaiDropdown(); // 🔹 call helper
        this.apply?.();
      } else {
        this.clearAllErrorFlags();
        this.noStructuresError = true;
      }
    } catch {
      this.clearAllErrorFlags();
      this.loadStructuresError = true;
    }
  }

  changeDate(delta: number): void {
    this.pickerDate.setDate(this.pickerDate.getDate() + delta);
    this.updateDateAndFetch();
  }

  processDateSelection(): void {
    this.updateDateAndFetch();
    this.showDatepicker = false;
  }

  onDateBlur(): void {
    if (this.pickerDate instanceof Date && !isNaN(this.pickerDate.getTime())) {
      this.processDateSelection();
      this.$scope.$apply();
    }
  }

  toggleDatepicker(forceOpen: boolean | null = null): void {
    if (forceOpen !== null) {
      this.showDatepicker = forceOpen;
    } else {
      this.showDatepicker = !this.showDatepicker;
    }
  }

  private updateDateAndFetch() {
    this.apiDate = moment(this.pickerDate).format('YYYY-MM-DD');
    if (this.apiDate !== this.previousApiDate) {
      this.previousApiDate = this.apiDate;
      this.updateCurrentDateDisplay();
      this.fetchMenu();
    }
  }

  private updateCurrentDateDisplay() {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    };
    
    // Get current language from session or default to French
    const currentLang = session().currentLanguage || 'fr';
    const locale = currentLang === 'en' ? 'en-US' : 'fr-FR';
    
    this.currentDate = this.pickerDate.toLocaleDateString(locale, options);
    this.currentDate = this.currentDate.charAt(0).toUpperCase() + this.currentDate.slice(1);
  }

  fetchMenu() {
    if (!this.selectedUai) {
      this.data = { entrees: [], plats: [], accompagnements: [], desserts: [], laitage: [] };
      this.menuUnavailable = true;
      this.clearAllErrorFlags();
      this.selectInstitutionError = true;
      this.apply?.();
      return;
    }

    axios.get(`/appregistry/${this.selectedUai}/cantine/menu?date=${this.apiDate}`)
      .then(response => {
        const lunchMenu = response.data?.lunchMenu;
        this.dinnerAvailable = response.data?.dinnerAvailable === true;
        const dinnerMenu = this.dinnerAvailable ? response.data?.dinnerMenu : null;

        // Reset to lunch if dinner is not available
        if (!this.dinnerAvailable) {
          this.currentMenuType = 'lunch';
        }

        // Process lunch menu
        if (Array.isArray(lunchMenu) && lunchMenu.length > 0) {
          this.lunchData = {
            entrees: lunchMenu.filter((item: any) => item.type === "entree"),
            plats: lunchMenu.filter((item: any) => item.type === "plat"),
            accompagnements: lunchMenu.filter((item: any) => item.type === "accompagnement"),
            laitage: lunchMenu.filter((item: any) => item.type === "laitage"),
            desserts: lunchMenu.filter((item: any) => item.type === "dessert"),
          };
        } else {
          this.lunchData = { entrees: [], plats: [], accompagnements: [], desserts: [], laitage: [] };
        }

        // Process dinner menu if available
        if (this.dinnerAvailable && Array.isArray(dinnerMenu) && dinnerMenu.length > 0) {
          this.dinnerData = {
            entrees: dinnerMenu.filter((item: any) => item.type === "entree"),
            plats: dinnerMenu.filter((item: any) => item.type === "plat"),
            accompagnements: dinnerMenu.filter((item: any) => item.type === "accompagnement"),
            laitage: dinnerMenu.filter((item: any) => item.type === "laitage"),
            desserts: dinnerMenu.filter((item: any) => item.type === "dessert"),
          };
        } else {
          this.dinnerData = { entrees: [], plats: [], accompagnements: [], desserts: [], laitage: [] };
        }

        // Set the current data based on menu type
        const menuToDisplay = this.currentMenuType === 'lunch' ? this.lunchData : this.dinnerData;
        const hasMenuItems = menuToDisplay.entrees.length > 0 || menuToDisplay.plats.length > 0 || 
                            menuToDisplay.accompagnements.length > 0 || menuToDisplay.laitage.length > 0 || 
                            menuToDisplay.desserts.length > 0;

        if (hasMenuItems) {
          this.data = menuToDisplay;
          this.menuUnavailable = false;
          this.error = null;
          this.selectInstitutionError = false;
          this.menuNotAvailableError = false;
          this.menuUnavailableForInstitutionError = false;
          this.loadMenuError = false;
          this.noStructuresError = false;
          this.loadStructuresError = false;
        } else {
          this.data = { entrees: [], plats: [], accompagnements: [], desserts: [], laitage: [] };
          this.menuUnavailable = true;
          this.clearAllErrorFlags();
          this.menuNotAvailableError = true;
          this.error = null;
        }

        this.apply?.();
      })
      .catch(error => {
        this.data = { entrees: [], plats: [], accompagnements: [], desserts: [], laitage: [] };

        if (error.response?.status === 400) {
          this.menuUnavailable = true;
          this.clearAllErrorFlags();
          this.menuUnavailableForInstitutionError = true;
          this.error = null;
        } else {
          this.menuUnavailable = true;
          this.clearAllErrorFlags();
          this.loadMenuError = true;
          this.error = error.message || "Unknown error";
        }

        this.apply?.();
      });
  }

  switchMenuType(type: 'lunch' | 'dinner') {
    this.currentMenuType = type;
    // Switch data without making another API call
    this.data = type === 'lunch' ? this.lunchData : this.dinnerData;
    this.apply?.();
  }

  getAllergies(item: any): string[] {
    if (!item) return [];
    return Object.keys(item)
      .filter(k => k.startsWith("allerg_") && item[k] !== 0 && item[k] !== undefined)
      .map(k => k.replace("allerg_", "").replace("_", " "));
  }

  // 🔹 Helper method to clear all error flags
  private clearAllErrorFlags() {
    this.noStructuresError = false;
    this.loadStructuresError = false;
    this.selectInstitutionError = false;
    this.menuNotAvailableError = false;
    this.menuUnavailableForInstitutionError = false;
    this.loadMenuError = false;
  }

  // 🔹 New helper method
  private setupUaiDropdown() {
    if (this.schoolOptions.length > 1) {
      const currentLang = session().currentLanguage || 'fr';
      const institutionText = currentLang === 'en' ? 'Institution' : 'Établissement';
      this.schoolOptions.unshift({ uai: '', name: institutionText });
      this.selectedUai = '';
    } else if (this.schoolOptions.length === 1) {
      this.selectedUai = this.schoolOptions[0].uai;
      this.fetchMenu();
    } else {
      this.selectedUai = '';
    }
  }
}

class Directive implements IDirective<IScope, JQLite, IAttributes, IController[]> {
  restrict = "E";
  template = require("./cantine-widget.widget.html").default;
  scope = {};
  bindToController = true;
  controller = [Controller];
  controllerAs = "ctrl";
  require = ["odeCantineWidget"];

  async link(scope: IScope, elem: JQLite, attrs: IAttributes, controllers?: IController[]) {
    const ctrl = controllers?.[0] as Controller | undefined;
    if (ctrl) {
      ctrl.apply = () => scope.$apply();
    }
  }
}

function DirectiveFactory() {
  return new Directive();
}

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

export const odeModuleName = "odeCantineWidgetModule";
angular.module(odeModuleName, []).directive("odeCantineWidget", DirectiveFactory);
