import angular from "angular";
import { SessionFrameworkFactory } from "ode-ts-client";
import { conf } from ".";
import { setDeviceCookies } from "./deviceDetection";

/* 
 * This code bootstraps angular on the current web page.
 * >>>> Your page must declare an angularJS module named "app" <<<<<
 * @see ../modules/index 
 */
(()=>{
    document.addEventListener("DOMContentLoaded", () => {
        // detect device and set cookies
        setDeviceCookies();
        SessionFrameworkFactory.instance().initialize()
            .then( () => conf().initialize((window as any).entcore?.deploymentTag, null) )
            .then( () => {
                // Bootstrap angularJS on the <html> tag, requiring the "app" module.
                angular.bootstrap( document.querySelector('html') as HTMLHtmlElement, ["app"] );
            });
        }, { once:true }
    );
})();

/*
//TODO que reprendre du code ci-dessous ?
// Interpolate est dans base.module.ts

var module = angular.module('app', ['ngSanitize', 'ngRoute'], ['$interpolateProvider', function($interpolateProvider) {
		$interpolateProvider.startSymbol('[[');
		$interpolateProvider.endSymbol(']]');
	}]).config(['$sceDelegateProvider',function($sceDelegateProvider) {
		$sceDelegateProvider.resourceUrlWhitelist([
			// Allow same origin resource loads.
			'self',
			// Allow loading from our assets domain. **.
			(window as any).CDN_DOMAIN + '/**'
		  ]);
	}])

...

module.config(['$locationProvider', function($locationProvider) {
	$locationProvider.hashPrefix('');
}]);

...

    if(window.notLoggedIn){
         Behaviours.loadBehaviours(appPrefix, async function(){
             await skin.loadDisconnected();
             func();
         })
         .error(async function(){
             await skin.loadDisconnected();
             func();
         });
         return;
     }
     try{
         let request = obj => {
         return new Promise((resolve, reject) => {
             let xhr = new XMLHttpRequest();
             xhr.open(obj.method || "GET", obj.url);
             if (obj.headers) {
                 Object.keys(obj.headers).forEach(key => {
                     xhr.setRequestHeader(key, obj.headers[key]);
                 });
             }
             xhr.onload = () => {
                 if (xhr.status >= 200 && xhr.status < 300) {
                     resolve(JSON.parse(xhr.response));
                 } else {
                     reject(xhr.statusText);
                 }
             };
             xhr.onerror = () => reject(xhr.statusText);
             xhr.send(obj.body);
         });
     };
         const res = await request({url:'/auth/oauth2/userinfo', method: 'get'})
         const data = res;
         await skin.loadConnected();
         model.me = data;
         model.me.preferences = {
             save: function(pref, data){
                 if(data !== undefined){
                     this[pref] = data;
                 }
 
                 model.trigger('preferences-updated');
             }
         };
 
         if (isLocalStorage()) {
             localStorage.setItem('login-event', model.me.login);
         }
         
         model.trigger("userinfo-loaded")
         model.trigger('preferences-updated');
         //
         request({url:'/conf/public', method: 'get'}).then(res=>{
             Me.keepOpenOnLogout = !!(res as any).keepOpenOnLogout;
         });
         //
         model.me.hasWorkflow = function(workflow){
             return _.find(model.me.authorizedActions, function(workflowRight){
                 return workflowRight.name === workflow;
             }) !== undefined || workflow === undefined;
         };
 
         model.me.hasRight = function(resource, right){
             if(right === 'owner'){
                 return resource.owner && resource.owner.userId === model.me.userId;
             }
             let rightName = right.right || right;
 
             var currentSharedRights = _.filter(resource.shared, function(sharedRight){
                 return (model.me.groupsIds || []).indexOf(sharedRight.groupId) !== -1
                     || sharedRight.userId === model.me.userId;
             });
 
             var resourceRight = _.find(currentSharedRights, function(resourceRight){
                 return resourceRight[rightName] || resourceRight.manager;
             }) !== undefined;
 
             var workflowRight = true;
             if(right.workflow){
                 workflowRight = this.hasWorkflow(right.workflow);
             }
 
             return resourceRight && workflowRight;
         };
 
         model.me.workflow = {
             load: async function(services): Promise<void>{
                 for(let service of services){
                     try{
                         let workflows = await Behaviours.findWorkflow(service);
                         console.log('Workflows loaded from ' + service);
                         console.log(workflows);
                         this[service] = workflows;
                     }
                     catch(e){
                         console.log(service + " doesn't have a behaviours file.");
                     }
                 }
             }
         };
 
         if(appPrefix !== '.'){
             await model.me.workflow.load(['workspace', appPrefix]);
         }
         else{
             await model.me.workflow.load(['workspace']);
         }
         
         model.trigger('me.change');
 
         calendar.init();
         await skin.loadBookmarks();
         func();
     }catch(e){
         func();
     }
 }
 
$(document).ready(function(){
	setTimeout(function(){
		//routing
		if(routes.routing){
			module.config(routes.routing);
		}
		bootstrap(function(){
		    RTE.addDirectives(module);
            if (window.entcore.ng.init) {
				window.entcore.ng.controllers.push(VideoController);

				window.entcore.ng.services.push( ng.service("VideoUploadService", [VideoUploadService]) );
				window.entcore.ng.services.push( ng.service("VideoEventTracker", [VideoEventTrackerService]) );
                window.entcore.ng.init(module);
		    }
			model.build();

			lang.addDirectives(module);


			function start(){
				lang.addBundle('/i18n', function(){
					lang.addBundle('/' + appPrefix + '/i18n', function(){
						 if (currentLanguage === 'fr') {
							moment.locale(currentLanguage);
							moment.updateLocale(currentLanguage, frLocales);
						}
						else {
							moment.locale(currentLanguage);
						}
                        angular.bootstrap($('html'), ['app']);
                        model.trigger('bootstrap');
						model.bootstrapped = true;
						model.sync();
					});
				});
			}

            http().get(skin.basePath + 'js/directives.js').done((d) => {
                eval(d);

                if(typeof skin.addDirectives === 'function'){
                    skin.addDirectives(module, start);
                }
                else{
                    start();
                }
            })
            .error(() => {
                start();
            });
		});
	}, 10);
});
*/