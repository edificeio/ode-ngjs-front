import { IAttributes, ICompileService, IController, IDirective, IScope } from "angular";
import { App, NotifyFrameworkFactory } from "ode-ts-client";
import moment from 'moment'; // FIXME : should we use moment anymore ?
import { TrackingService } from "../../../services";

interface PortalScope extends IScope {
	app?:App;
	name:string;
}

/* Directive */
class Directive implements IDirective<PortalScope,JQLite,IAttributes,IController[]> {
    restrict = 'E';
	transclude = true;
	templateUrl(element:JQLite, attrs:IAttributes) {
		// Load the specified template-url, or the default implementation.
		return attrs.templateUrl ? attrs.templateUrl : require('./portal.directive.lazy.html').default;
	};
	scope = {
		app:"@?",
		name:"@",
	};

	link(scope:PortalScope, elem:JQLite, attrs:IAttributes) {
		NotifyFrameworkFactory.instance().onLangReady().promise.then( lang => {
			if( lang === 'fr' ) {
				moment.updateLocale(lang, {
					calendar: {
						lastDay: '[Hier à] HH[h]mm',
						sameDay: '[Aujourd\'hui à] HH[h]mm',
						nextDay: '[Demain à] HH[h]mm',
						lastWeek: 'dddd [dernier à] HH[h]mm',
						nextWeek: 'dddd [prochain à] HH[h]mm',
						sameElse: 'dddd LL'
					}
				});
			}
			else {
				moment.lang( lang );
			}
		});

		// Tracking
		if( scope.app ) {
			this.tracking.trackApp( scope.app );
		}
	}

/*TODO finir le portage de la directive portal (RGPD)

	compile(element:JQLite, attributes:IAttributes, transclude){
		// Initialize any configured tracker
		tracker.init();
	
		$("html").addClass("portal-container")
		element.find('[logout]').attr('href', '/auth/logout?callback=' + skin.logoutCallback);
		
		if (!attributes.templateUrl) {
			ui.setStyle(skin.theme);
		}
		
		Http.prototype.bind('disconnected', function(){
			window.location.href = '/';
		})
		
		return function postLink( scope, element, attributes, controller, transcludeFn ) {
			scope.template = template;
			// Create the banner to display
			scope.isTrackerInitialized = function() {
				return tracker.isInitialized;
			}
			var bannerCode = ' \
				<infotip name="rgpd-cookies-banner" class="info modal" style="position:fixed; bottom:0; right:20px;" \
						save-preference-under="tracking" \
						show-once="true" \
						ng-show="isTrackerInitialized()" > \
					<p><i18n>rgpd.cookies.banner.text1</i18n> &nbsp; <a href="/userbook/mon-compte?show=rgpd_cookies"><strong><i18n>rgpd.cookies.banner.link</i18n></strong></a>.</p> \
				</infotip> \
			';
			element.prepend( $compile(bannerCode)(scope) );
		};
	}
*/

	constructor( 
		private $compile:ICompileService, 
		private tracking:TrackingService 
		) {}

}

/** The portal directive.
 *
 * Usage:
 *      &lt;ode-portal app="myappkey" name="My app"></ode-portal&gt;
 * or
 *      &lt;ode-portal template-url="/platform/assets/themes/...."></ode-portal&gt;
 */
export function DirectiveFactory($compile:ICompileService, tracking:TrackingService) {
	return new Directive($compile,tracking);
}
DirectiveFactory.$inject=["$compile","odeTracking"];
