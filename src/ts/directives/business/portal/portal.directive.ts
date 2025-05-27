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
		
		// Load the optional feature cantoo
        // Verification of the workflow rights
        if(scope.me?.hasWorkflow('org.entcore.portal.controllers.PortalController|optionalFeatureCantoo')) {
			
			// Get the scriptPath of the script to load
			http().get("/optionalFeature/cantoo").then((data) => {
				
				const script = document.createElement("script");
				script.src = data.scriptPath;
				script.async = true;
				
				// Load the script and append it to the body
				document.body.appendChild(script);
			});
		}

		// Add the Zendesk widget
		this.addZendeskGuideWedget(scope);
	}

	private addZendeskGuideWedget(scope: PortalScope) {
		http().get("/zendeskGuide/config?module=timeline").then((data) => {

			// Add the Zendesk widget script if the key is present
			if (data && data.key) {
				const scriptZendesk = document.createElement('script');
				scriptZendesk.id = 'ze-snippet';
				scriptZendesk.src = `https://static.zdassets.com/ekr/snippet.js?key=${data.key}`;

				document.body.appendChild(scriptZendesk).onload = () => {

					// Set the language of the widget
					if (session().currentLanguage === 'es') {
						(window as any).zE(function () {
							(window as any).zE.setLocale('es-419');
						});
					} else {
						(window as any).zE(function () {
							(window as any).zE.setLocale('fr');
						});
					}
					// Set the default label of the widget
					if (data.module.default) {
						(window as any).zE('webWidget', 'helpCenter:setSuggestions', { labels: [data.module.default] });
					}

					// Set the widget settings color, launcher visibility and support button visibility
					(window as any).zE('webWidget', 'updateSettings', {
						webWidget: {
							color: { theme: data.color || '#ffc400' },
							zIndex: 22,
							launcher: {
								mobile: {
									labelVisible: true
								}
							},
							contactForm: {
								suppress: !scope.me?.hasWorkflow('net.atos.entng.support.controllers.DisplayController|view')
							},
							helpCenter: {
								messageButton: {
									"*": "Assistance ENT",
									"es-419": "Asistencia ENT"
								},
								originalArticleButton: data.articleRedirectButton ?? true,
							}
						},
					});

					// Hide the launcher label when the user scrolls on the mobile
					window.addEventListener('scroll', () => {
						(window as any).zE('webWidget', 'updateSettings', {
							webWidget: {
								launcher: {
									mobile: {
										labelVisible: window.scrollY <= 5
									}
								},
							},
						});
					});

					// Redispatch the support button if the user has the right to access the support page
					(window as any).zE('webWidget:on', 'open', function () {
						if (scope.me?.hasWorkflow('net.atos.entng.support.controllers.DisplayController|view')) {
							(window as any).zE('webWidget', 'updateSettings', {
								webWidget: {
									contactForm: {
										suppress: false
									}
								}
							});
						}
					});

					// Redirect the user to the support page if he has the right to access it and suppress the contact form
					(window as any).zE('webWidget:on', 'userEvent', function (ref: { category: any; action: any; properties: any; }) {
						var category = ref.category;
						var action = ref.action;
						var properties = ref.properties;
						if (action === "Contact Form Shown" && category === "Zendesk Web Widget" && properties && properties.name === "contact-form" && scope.me?.hasWorkflow('net.atos.entng.support.controllers.DisplayController|view')) {
							(window as any).zE('webWidget', 'updateSettings', {
								webWidget: {
									contactForm: {
										suppress: true
									}
								}
							});
							(window as any).zE('webWidget', 'close');
							window.open("/support", "_blank");
						}
					});
				};
			}
		});

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
