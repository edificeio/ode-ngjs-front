import angular, { IAttributes, IController, IDirective, IScope } from "angular";
import { conf, notif, http } from "../../utils";

/* Controller for the directive */
class Controller implements IController {
	lexicon:any = {};
	suggestions:string[] = [];
	selectedWord:string = "";

	openDefinition(){	
		window.open('https://www.dictionnairedelazone.fr/dictionary/lexical/' + this.lexicon[this.selectedWord], '_blank');
	}
}

/* Directive */
class Directive implements IDirective<IScope,JQLite,IAttributes,IController[]> {
    restrict = 'E';
	template = require('./dicodelazone-widget.widget.html').default;
	scope = {};
	bindToController = true;
	controller = [Controller];
	controllerAs = 'ctrl';
	require = ['odeDicodelazoneWidget'];

    link(scope:IScope, elem:JQLite, attrs:IAttributes, controllers?:IController[]): void {
        const ctrl:Controller|null = controllers ? controllers[0] as Controller : null;
        if( !ctrl ) {
            return;
		}
		http().get('/assets/widgets/dicodelazone-widget/lexicon.json')
		.then( data => {
			ctrl.lexicon = data;
			ctrl.suggestions = Object.keys(data);
			scope.$apply();
		})
	}
}

/** The dicodelazone widget. */
function DirectiveFactory() {
	return new Directive();
}

// Preload translations
notif().onLangReady().promise.then( lang => {
	switch( lang ) {
		case "en":	conf().Platform.idiom.addKeys( require('./i18n/en.json') ); break;
		default:	conf().Platform.idiom.addKeys( require('./i18n/fr.json') ); break;
	}
});

// THIS ANGULAR MODULE WILL BE DYNAMICALLY ADDED TO THE APPLICATION.
// RESPECT THE NAMING CONVENTION BY EXPORTING THE MODULE NAME :
export const odeModuleName = "odeDicodelazoneWidgetModule";
angular.module( odeModuleName, []).directive( "odeDicodelazoneWidget", DirectiveFactory );
