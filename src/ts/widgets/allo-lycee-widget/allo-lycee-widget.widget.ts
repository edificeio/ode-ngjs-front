import angular, { IAttributes, IController, IDirective, IScope } from "angular";
import { conf, notif } from "../../utils";

class Controller implements IController {
  // Inlined by webpack: this widget has no assets folder on the platform.
  illustration: string = require("./illu-allo-lycee.png");
}

/* Directive */
class Directive
  implements IDirective<IScope, JQLite, IAttributes, IController[]>
{
  restrict = "E";
  template = require("./allo-lycee-widget.widget.html").default;
  scope = {};
  bindToController = true;
  controller = [Controller];
  controllerAs = "ctrl";
}

/** The Allô Lycée widget. */
function DirectiveFactory() {
  return new Directive();
}

// Preload translations
notif()
  .onLangReady()
  .promise.then(() => {
    conf().Platform.idiom.addKeys(require("./i18n/fr.json"));
  });

// THIS ANGULAR MODULE WILL BE DYNAMICALLY ADDED TO THE APPLICATION.
// RESPECT THE NAMING CONVENTION BY EXPORTING THE MODULE NAME :
export const odeModuleName = "odeAlloLyceeWidgetModule";
angular
  .module(odeModuleName, [])
  .directive("odeAlloLyceeWidget", DirectiveFactory);
