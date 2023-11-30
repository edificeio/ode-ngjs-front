import { IAttributes, IController, IDirective, IScope } from "angular";
import { App, USER_PREFS } from "ode-ts-client";
import {L10n, conf, notif, http, session} from "../../../utils";
import { TrackingService } from "../../../services";

interface PortalScope extends IScope {
	app?:App;
	name:string;

	goToMyAccount: () => void;
	closeBanner: () => void;
	showRgpd?: Boolean;
	me?:{
		hasWorkflow(right:string):boolean;
	};
}

/* Directive */
class Directive implements IDirective<PortalScope,JQLite,IAttributes,IController[]> {
    restrict = 'E';
	transclude = {
        infotips:   "odeInfotips"
    };
	templateUrl(element:JQLite, attrs:IAttributes) {
		// Load the specified template-url, or the default implementation.
		return attrs.templateUrl ? attrs.templateUrl : require('./portal.directive.lazy.html').default;
	};
	scope = {
		app:"@?",
		name:"@",
	};

	link(scope:PortalScope, elem:JQLite, attrs:IAttributes) {
		const preferences = conf().User.preferences;

		notif().onLangReady().promise.then( lang => {
			L10n.initialize( lang );
		});

		scope.goToMyAccount = () => {
			document.location.href = '/userbook/mon-compte';
			preferences.get(USER_PREFS.RGPD_COOKIES)['showInfoTip'] = false;
			preferences.save(USER_PREFS.RGPD_COOKIES);
		}

		scope.me = {
			hasWorkflow(right:string):boolean {
				return session().hasWorkflow(right);
			}
		};

		scope.closeBanner = () => {
			scope.showRgpd = false;
			preferences.get(USER_PREFS.RGPD_COOKIES)['showInfoTip'] = false;
			preferences.save(USER_PREFS.RGPD_COOKIES);
		}

		// Tracking
		if( scope.app ) {
			this.tracking.trackApp( scope.app );
		}


		if (scope.me?.hasWorkflow('fr.openent.chatbot.controller.ChatbotController|view')) {
			$.ajax('/chatbot/public/js/chatbot.js', {dataType: 'script',});
		}


	}
	constructor(private tracking:TrackingService) {}

}

/** The portal directive.
 *
 * Usage:
 *      &lt;ode-portal app="myappkey" name="My app"></ode-portal&gt;
 * or
 *      &lt;ode-portal template-url="/platform/assets/themes/...."></ode-portal&gt;
 */
export function DirectiveFactory(tracking:TrackingService) {
	return new Directive(tracking);
}
DirectiveFactory.$inject=["odeTracking"];
