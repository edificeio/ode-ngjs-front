import angular, { IAttributes, IController, IDirective } from "angular";
import { L10n, conf, notif, TrackedAction, TrackedScope, TrackedActionFromWidget } from "../../utils";
import { ILastInfosModel, LastInfosWidget } from "ode-ts-client";

interface IExtendedLastInfosModel extends ILastInfosModel {
	relativeDate: string;
	tooltip: string;
}

/* Controller for the directive */
class Controller implements IController {
	public widget = new LastInfosWidget();
	private lang = conf().Platform.idiom;

	public infos:IExtendedLastInfosModel[] = [];
	public resultSizeValues = [1,2,3,4,5,6,7,8,9,10];
	public resultSize = 4;
	public display = {
		edition: false
	};

	load():Promise<void> {
		return this.widget.loadInfos( this.resultSize ).then( infos => {
			this.infos = infos.map( info => {
				(info as IExtendedLastInfosModel).relativeDate = L10n.moment(info.modifiedDate).fromNow();
				(info as IExtendedLastInfosModel).tooltip = this.lang.translate('last-infos-widget.widget.thread') + ' : ' + info.thread.title +
					' | ' + this.lang.translate('last-infos-widget.widget.author') + ' : ' + info.username;
				return info as IExtendedLastInfosModel;
			});
		});
	};
	
	openConfig(){
		this.display.edition = true;
	};
	
	closeConfig(){
		this.display.edition = false;
	};
	
	saveConfig(){
		return this.widget.setMaxResults( this.resultSize );
	};
}

/* Directive */
class Directive implements IDirective<TrackedScope,JQLite,IAttributes,IController[]> {
    restrict = 'E';
	template = require('./last-infos-widget.widget.html').default;
	controller = [Controller];
	controllerAs = 'ctrl';
    require = ['odeLastInfosWidget'];

    link(scope:TrackedScope, elem:JQLite, attrs:IAttributes, controllers?:IController[]): void {
        const ctrl:Controller|null = controllers ? controllers[0] as Controller : null;
		if( ! ctrl ) return;

		// Give an opportunity to track some events from outside of this widget.
		scope.trackEvent = (e:Event, p:CustomEventInit<TrackedAction>) => {
			// Allow events to bubble up.
			if(typeof p.bubbles === "undefined") p.bubbles = true;

			let event = null;
			if( p && p.detail?.open==='app' ) {
				event = new CustomEvent( TrackedActionFromWidget.lastInfos, p );
			} else if( p && p.detail?.open==='info' ) {
				event = new CustomEvent( TrackedActionFromWidget.lastInfos, p );
			}
			if( event && e.currentTarget ) {
				e.currentTarget.dispatchEvent(event);
			}
		}

		ctrl.widget.getMaxResults().then( num => {
			ctrl.resultSize = num;
			ctrl.load().then( () => {
				scope.$apply();
			});
		});
	}
}

/** The last-infos widget.
 *
 * Usage:
 *      &lt;ode-last-infos></ode-last-infos&gt;
 */
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
export const odeModuleName = "odeLastInfosWidgetModule";
angular.module( odeModuleName, []).directive( "odeLastInfosWidget", DirectiveFactory );
