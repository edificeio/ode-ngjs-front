import angular, { IAttributes, IController, IDirective, IScope } from "angular";
import { conf, notif } from "../../utils";

class Controller implements IController {}

class Directive implements IDirective<IScope, JQLite, IAttributes, IController[]> {
	restrict = 'E';
	template = require('./bibliocollege-widget.widget.html').default;
	scope = {};
	bindToController = true;
	controller = [Controller];
	controllerAs = 'ctrl';
	require = ['odeBibliocollegeWidget'];

	link(scope: IScope, elem: JQLite, attrs: IAttributes, controllers?: IController[]) {}
}

function DirectiveFactory() {
	return new Directive();
}

notif().onLangReady().promise.then(lang => {
	switch (lang) {
		case 'en': conf().Platform.idiom.addKeys(require('./i18n/en.json')); break;
		default:   conf().Platform.idiom.addKeys(require('./i18n/fr.json')); break;
	}
});

export const odeModuleName = "odeBibliocollegeWidgetModule";
angular.module(odeModuleName, []).directive("odeBibliocollegeWidget", DirectiveFactory);
