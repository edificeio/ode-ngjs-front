import angular, { IAttributes, IController, IDirective, IScope } from "angular";
import { conf, notif, http, session, Base64 } from "../../utils";
import moment from "moment";

class Controller implements IController {
  data: any = {};
  error: any = null;

  // Function to get allergies from an item
  getAllergies(item: any): string[] {
    // Check if item is defined
    if (!item) {
      return [];
    }

    const allergyKeys = [
      "allerg_anhydride",
      "allerg_arachide",
      "allerg_celeri",
      "allerg_crustace",
      "allerg_fruit_coque",
      "allerg_gluten",
      "allerg_lait",
      "allerg_lupin",
      "allerg_mollusque",
      "allerg_moutarde",
      "allerg_oeuf",
      "allerg_poisson",
      "allerg_sesame",
      "allerg_soja",
    ];

    return allergyKeys
      .filter((key) => item[key] !== 0 && item[key] !== undefined) // Avoid undefined and 0
      .map((key) => key.replace("allerg_", "").replace("_", " ")); // Format for display
  }

  // Function to format names
  formatName(name: string): string {
    return name
      .toLowerCase() // Convert the entire string to lowercase
      .replace(/(^\w|\s\w)/g, (match) => match.toUpperCase()); // Capitalize first letter of each word
  }
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
    }

    await http()
      .get("/appregistry/0770000X/cantine/menu")
      .then((response) => {
        if (response.menu) {
          const menu = response.menu;

          // Group items by type
          ctrl.data = {
            entrees: menu.filter((item: any) => item.type === "entree"),
            plats: menu.filter((item: any) => item.type === "plat"),
            accompagnements: menu.filter((item: any) => item.type === "accompagnement"),
            desserts: menu.filter((item: any) => item.type === "dessert"),
          };

          // Dynamically group items by type (optional)
          // ctrl.data = menu.reduce((acc: Record<string, any[]>, item: any) => {
          //   if (!acc[item.type]) {
          //     acc[item.type] = []; // Create array if type doesn't exist
          //   }
          //   acc[item.type].push(item); // Add item to its category
          //   return acc;
          // }, {});

          // Ensure ctrl.data.entrees is properly populated
          if (ctrl.data.entrees && ctrl.data.entrees.length > 0) {
            const firstEntree = angular.copy(ctrl.data.entrees[0]); // Ensure we are working with a new object
            firstEntree.allerg_lupin = 1; // Simulate lupin allergy
            firstEntree.allerg_arachide = 1; // Simulate lupin allergy

            // Replace the old entree with the modified one
            ctrl.data.entrees[0] = firstEntree;


            // Ensure Angular detects the change
            scope.$apply(); // Trigger Angular's change detection
          }
        } else {
          ctrl.error = response.error;
        }
      })
      .catch((error) => {
        console.error("Error fetching menu:", error);
        ctrl.error = "An error occurred while fetching the menu.";
      });
  }
}

/** The cantine widget. */
function DirectiveFactory() {
  return new Directive();
}

// Preload translations
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
