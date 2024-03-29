import { IAttributes, IController, IDirective, IScope } from "angular";
import { APP, IWebApp, RxJS } from "ode-ts-client";
import { XitiService } from "../../..";
import { conf } from "../../../utils";

type AppEvent = {
    app:IWebApp,
    element:Element,
    $mutex?:boolean,
    ctrlKey:boolean,   // Was CTRL key pressed ?
    metaKey: boolean   // Was Command key pressed? (Apple keyboard)
}

interface ITriggerScope extends IScope {
    connectorLightboxTrigger: IWebApp;
}

/** Global AppEvent stream, shared by every connector-lightbox[-trigger] */
const _onTriggerApp = new RxJS.Subject<AppEvent>();

//--------------------------------------------------------------------------------
class TriggerDirective implements IDirective<ITriggerScope,JQLite,IAttributes> {
//--------------------------------------------------------------------------------
    restrict= 'A';
    scope= {
        connectorLightboxTrigger: "=",
    };

    link(scope:ITriggerScope, elem:JQLite, attrs:IAttributes): void {
        elem.on('click', (event: JQuery.ClickEvent) => {
            const appEvent = {
                app: scope.connectorLightboxTrigger,
                element: elem[0],
                $mutex: false,
                ctrlKey: !!event.ctrlKey,
                metaKey: !!event.metaKey
            } as AppEvent;
            event.preventDefault();
            _onTriggerApp.next( appEvent );
            return false;
        });
        scope.$on('$destroy', () => {
            elem.off('click');
        });
    }
}

/** The connector-lightbox controller. */
//--------------------------------------------------------------------------------
export class Controller {
//--------------------------------------------------------------------------------
    // Shortcut for refreshing the view.
	public apply?:()=>void;

    // Set to true if check can be skipped
    skipCheck?:boolean;

    // Show / hide the lightbox
    display = {
        showAuthenticatedConnectorLightbox: false
    };

    private _currentAppEvent?:AppEvent;
    authenticatedConnectorsAccessed?:string[];

    onClose() {
        this.display.showAuthenticatedConnectorLightbox = false;
    }

    onConfirm() {
        if( ! this._currentAppEvent ) {
            return;
        }

        const _app = this._currentAppEvent.app;
        this.onClose();
        if (this.authenticatedConnectorsAccessed) {
            this.authenticatedConnectorsAccessed.push(_app.name);
        } else {
            this.authenticatedConnectorsAccessed = [_app.name];
        }

        const target = this._currentAppEvent.ctrlKey || this._currentAppEvent.metaKey ? '_blank' : !!_app.target ? _app.target : '_self';

        if (target !== '_self') {
            conf().User.preferences
              .update('authenticatedConnectorsAccessed', this.authenticatedConnectorsAccessed)
              .save('authenticatedConnectorsAccessed');
            this.windowOpen(_app.address, target);
        } else {
            (async () => {
                await conf().User.preferences
                 .update('authenticatedConnectorsAccessed', this.authenticatedConnectorsAccessed)
                 .save('authenticatedConnectorsAccessed');
                this.windowOpen(_app.address, target);
            })();
        }
    }

    isAuthenticatedConnector(app: IWebApp): boolean {
        return !!app.casType || (app.scope && app.scope.length > 0 && !!app.scope[0]);
    }

    isAuthenticatedConnectorFirstAccess(app: IWebApp): boolean {
        return !this.authenticatedConnectorsAccessed
            || (this.authenticatedConnectorsAccessed && !this.authenticatedConnectorsAccessed.includes(app.name));
    }

    openAppWithCheck(appEvent: AppEvent): void {
        this._currentAppEvent = appEvent;
        if(appEvent.$mutex){
            return;
        }
        appEvent.$mutex = true;

        // Sanity check
        const app = appEvent.app;
        if( typeof app === "undefined" )
            throw "ConnectorLightbox, Controller.openAppWithCheck failed : target app is undefined";
        
        const target = appEvent.ctrlKey || appEvent.metaKey ? '_blank' : !!app.target ? app.target : '_self';

        if (!this.skipCheck && this.isAuthenticatedConnector(app) && this.isAuthenticatedConnectorFirstAccess(app)) {
            //this.authenticatedConnectorClicked = app;
            this.display.showAuthenticatedConnectorLightbox = true;
            this.apply && this.apply();
        } else {
            this.windowOpen(app.address, target);
        }
    }

    private windowOpen(address:string, target:string) {
        if( this._currentAppEvent && this._currentAppEvent.app.isExternal ) {
            if (target == '_self') {
                /* If target is the same page, we must ensure 'window.xiti.click' method has terminated
                    before opening the connector
                */
                this.xitiSvc.trackClick(this._currentAppEvent.app.name, this._currentAppEvent.element)
                .finally(() => { window.open(address, target); });
            } else {
                /* If target is a new page, Firefox would block the connector as a popup, hence we don't
                    wait for 'window.xiti.click' response, which is ok because its execution cannot be
                    interrupted as the connector opens in a new page
                */
               this.xitiSvc.trackClick(this._currentAppEvent.app.name, this._currentAppEvent.element)
               .finally(() => { /* the 'finally' block is necessary in order to ensure the Promise is run */});
               window.open(address, target);
            }
        } else {
            window.open(address, target);
        }
    }

    constructor( 
        private xitiSvc:XitiService
    ) {
    }
}

/** The connector-lightbox directive. */
//--------------------------------------------------------------------------------
class Directive implements IDirective<IScope,JQLite,IAttributes,IController[]> { 
//--------------------------------------------------------------------------------
    restrict= 'E';
    template = require('./connector-lightbox.directive.html').default;
    scope= {};
	controller = ['odeXiti', Controller];
	controllerAs = 'ctrl';
    require = ['connectorLightbox'];

    async link(scope:IScope, elem:JQLite, attrs:IAttributes, controllers?:IController[]) {
        const ctrl:Controller|null = controllers ? controllers[0] as Controller : null;
        if( !ctrl ) {
            return;
        }

		ctrl.apply = () => {
			scope.$apply();
		};

        const sub = _onTriggerApp.subscribe((event) => {
            ctrl.openAppWithCheck(event);
        });
        scope.$on('$destroy', () => {
            sub.unsubscribe();
        });

        ctrl.authenticatedConnectorsAccessed = await conf().User.preferences.load('authenticatedConnectorsAccessed');
        try {
            const cf = await conf().Platform.apps.getPublicConf( APP.CAS );
            ctrl.skipCheck = !!cf.skip;
        } catch(e){
            console.warn("Failed to get public conf: ", e)
        }
    }
}

/** The connector-lightbox-trigger directive factory. */
export function TriggerDirectiveFactory() {
	return new TriggerDirective();
}

/** The connector-lightbox directive factory. */
export function DirectiveFactory() {
	return new Directive();
}
