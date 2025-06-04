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
  unavailableMessage: string = '';

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
        this.error = "No structures found for user.";
      }
    } catch {
      this.error = "Failed to load user structures.";
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
    this.currentDate = this.pickerDate.toLocaleDateString('fr-FR', options);
    this.currentDate = this.currentDate.charAt(0).toUpperCase() + this.currentDate.slice(1);
  }

  fetchMenu() {
    if (!this.selectedUai) {
      this.data = { entrees: [], plats: [], accompagnements: [], desserts: [], laitage: [] };
      this.menuUnavailable = true;
      this.unavailableMessage = "Veuillez sélectionner un établissement.";
      this.apply?.();
      return;
    }

    axios.get(`/appregistry/${this.selectedUai}/cantine/menu?date=${this.apiDate}`)
      .then(response => {
        const menu = response.data?.menu;

        if (Array.isArray(menu) && menu.length > 0) {
          this.data = {
            entrees: menu.filter((item: any) => item.type === "entree"),
            plats: menu.filter((item: any) => item.type === "plat"),
            accompagnements: menu.filter((item: any) => item.type === "accompagnement"),
            laitage: menu.filter((item: any) => item.type === "laitage"),
            desserts: menu.filter((item: any) => item.type === "dessert"),
          };
          this.menuUnavailable = false;
          this.error = null;
          this.unavailableMessage = '';
        } else {
          this.data = { entrees: [], plats: [], accompagnements: [], desserts: [], laitage: [] };
          this.menuUnavailable = true;
          this.unavailableMessage = "Menu non disponible pour cette date.";
          this.error = null;
        }

        this.apply?.();
      })
      .catch(error => {
        this.data = { entrees: [], plats: [], accompagnements: [], desserts: [], laitage: [] };

        if (error.response?.status === 400) {
          this.menuUnavailable = true;
          this.unavailableMessage = "Menu indisponible pour cet établissement.";
          this.error = null;
        } else {
          this.menuUnavailable = true;
          this.unavailableMessage = "Une erreur est survenue lors du chargement du menu.";
          this.error = error.message || "Unknown error";
        }

        this.apply?.();
      });
  }

  getAllergies(item: any): string[] {
    if (!item) return [];
    return Object.keys(item)
      .filter(k => k.startsWith("allerg_") && item[k] !== 0 && item[k] !== undefined)
      .map(k => k.replace("allerg_", "").replace("_", " "));
  }

  // 🔹 New helper method
  private setupUaiDropdown() {
    if (this.schoolOptions.length > 1) {
      this.schoolOptions.unshift({ uai: '', name: 'Établissement' });
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
  .promise.then(() => {
    conf().Platform.idiom.addKeys(require("./i18n/fr.json"));
  });

export const odeModuleName = "odeCantineWidgetModule";
angular.module(odeModuleName, []).directive("odeCantineWidget", DirectiveFactory);
