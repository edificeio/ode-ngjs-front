/* The folder-explorer directive.
 *
 * Usage:
 * 1) import your directive's factory,
 *      import { FolderExplorer } from 'ode-ngjs-front';
 * 2) Add it to your angular module,
 *      ng.directives.push( ng.directive("FolderExplorer", FolderExplorer.DirectiveFactory) );
 * 3) Use it,
 *      <folder-explorer app="blog"></folder-explorer>
 * 
 * 4) TODO unit-testing : https://docs.angularjs.org/guide/unit-testing#testing-a-controller
 */
import { IAttributes, ICompileService, IController, IDirective, IHttpService, IScope } from "angular";

/* Controller for the directive */
export class Controller implements IController {
    constructor($http:IHttpService) {
        this.$http = $http;
    }
    
    $http:IHttpService;
    userName: any;

    sayHello():string {
        return `Hello, ${this.userName} !`
    }
}

/* Directive */
export class Directive implements IDirective<IScope,JQLite,IAttributes,IController[]> {
    restrict = 'E';
	template = `<span>{{ctrl.sayHello()}}</span>`;
//or
//  templateUrl = '';

    /* Scope isolation, @see https://code.angularjs.org/1.7.9/docs/guide/directive#isolating-the-scope-of-a-directive */
	scope = {};

    /* 
     * Binding the scope to the controller makes the controller cleaner.
     * @see why at https://ultimatecourses.com/blog/no-scope-soup-bind-to-controller-angularjs
     */
	bindToController = {
        userName: '=ngModel'
	};

	controller = ["$http", Controller];
	controllerAs = 'ctrl';

    /** @see the link method below. */
	require = ['saySomething','ngModel'];

    /**
     * Link method for the directive.
     * @see https://code.angularjs.org/1.7.9/docs/api/ng/service/$compile
     * @param $scope scope
     * @param $elem jqLite-wrapped element that this directive matches.
     * @param $attr hash object with key-value pairs of normalized attribute names and their corresponding attribute values.
     * @param controllers Array of "require"d controllers : [ngModelCtrl]
     */
    link(scope:IScope, elem:JQLite, attr:IAttributes, controllers:IController[]|undefined): void {
        let ctrl:Controller|null = controllers ? controllers[0] as Controller : null;
        let ngModelCtrl:IController|null = controllers ? controllers[1] as IController : null;

        // TODO Manipulate the DOM here.

        console.log( ctrl?.userName );
        console.log( ngModelCtrl );
    }

    $compile:ICompileService;

    /* Dependency Injection */
    static $inject = ["$compile"];
    constructor($compile:ICompileService) {
        this.$compile = $compile;
    }
}

/** Directive factory, with dependencies injected as required by $inject above. */
export function DirectiveFactory($compile:ICompileService) {
	return new Directive($compile);
}
