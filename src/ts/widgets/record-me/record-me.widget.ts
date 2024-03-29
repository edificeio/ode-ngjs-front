import angular, { IAttributes, IController, IDirective, IScope } from "angular";
import { conf, notif } from "../../utils";

/* Directive */
class Directive implements IDirective<IScope,JQLite,IAttributes,IController[]> {
    restrict = 'E';
	template = require('./record-me.widget.html').default;
}

/** The my-apps widget. */
function DirectiveFactory() {
	return new Directive();
}

// Preload translations
notif().onLangReady().promise.then( lang => {
	switch( lang ) {
		default:	conf().Platform.idiom.addKeys( require('./i18n/fr.json') ); break;
	}
});

// THIS ANGULAR MODULE WILL BE DYNAMICALLY ADDED TO THE APPLICATION.
// RESPECT THE NAMING CONVENTION BY EXPORTING THE MODULE NAME :
export const odeModuleName = "odeRecordMeModule";
angular.module( odeModuleName, []).directive( "odeRecordMe", DirectiveFactory );
