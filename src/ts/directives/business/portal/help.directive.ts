import { IAttributes, IDirective, IScope } from "angular";
import { ITheme } from "ode-ts-client";
import { conf, session, http } from "../../../utils";

/* The Help directive is tied to the old infra-front architecture, and relies on having data stored in the scope. */

interface Scope extends IScope {
    display:{read?:boolean};
    helpPath:string;
    onHelp:()=>void;
}

export class Directive implements IDirective<Scope,JQLite,IAttributes> {
    restrict = 'E';
    template = require('./help.directive.html').default;
    scope = {};

    async link(scope:Scope, element:JQLite, attributes:IAttributes) {
        const skin:ITheme = conf().Platform.theme;
        const appPrefix:string|null = session().currentApp;
        if( appPrefix===null ) {
            return;
        } 
        let helpPath = await skin.getHelpPath();
        let helpText:string;
        let helpErrorTitle:string;
        let helpErrorText:string;

        const lang = conf().Platform.idiom;
        const modalElement = $('ode-modal');

        scope.onHelp = function() {
            if (helpText) {
                setHtml(helpText);
            }
            else {
                http().get<string>(
                    scope.helpPath,
                    {queryParams:{"index.html": conf().Platform.deploymentTag}}
                ).then( content => {
                    if( http().latestResponse.status === 404 ) {
                        helpErrorTitle = lang.translate('help.notfound.title');
                        helpErrorText = '<p>' + lang.translate('help.notfound.text') + '</p>';
                        setErrorHTML(helpErrorTitle, helpErrorText);
                    } else {
                        helpText = content;
                        setHtml(helpText);
                    }
                    scope.$apply();
                })
            }
        };

        // FIXME old code with jquery starts here, i won't rewrite it now.
        scope.display = {};
        scope.helpPath = helpPath + '/application/' + appPrefix + '/';
        if(appPrefix === '.' && window.location.pathname !== '/adapter') {
            scope.helpPath = helpPath + '/application/portal/';
        }
        else if(window.location.pathname === '/adapter'){
            scope.helpPath = helpPath + '/application/' + window.location.search.split('eliot=')[1].split('&')[0] + '/'
        }
        else if (window.location.pathname.includes("/directory/class-admin")){
            scope.helpPath = helpPath + '/application/parametrage-de-la-classe/';
        }

        let helpContent, burgerMenuElement:JQuery<HTMLElement>, burgerButtonElement;

        const setErrorHTML = function(title:string, text:string) {
            modalElement.find('.modal-title').html(title);
            modalElement.find('.modal-body').html(text);
            scope.display.read = true;
            scope.$apply('display');
        }

        const setHtml = function(content:string){
            helpContent = $('<div>' + content + '</div>');
            // Swap ToC and introduction paragraphs
            helpContent.find('> p').prev().insertAfter(helpContent.find('> p'));
            helpContent.find('img').each(function(index, item){
                $(item).attr('src', scope.helpPath + "../.." + $(item).attr('src'));
            });
            modalElement.find('ode-modal-body > div').html(helpContent.html());
            modalElement.find('li a').on('click', function(e){
                modalElement.find('.section').slideUp();
                $('div#' + $(e.target).attr('href')?.split('#')[1]).slideDown();
            });
            modalElement.find('div.paragraph a').on('click', function(e){
                window.open($(e.target).closest('a').attr('href'), "_newtab" ); 
            });
            modalElement.find('li a').first().click();

            // Activate hamburger menu on responsive
            modalElement.find('#TOC').wrap('<div id="burger-menu" class="burger-menu"></div>');
            burgerMenuElement = modalElement.find('#burger-menu');
            burgerMenuElement.prepend('<button id="burger-button" class="burger-button"><i class="burger-icon"></i></button>');
            burgerButtonElement = modalElement.find('#burger-button');
            burgerButtonElement.on('click', function(e) {
                burgerMenuElement.toggleClass('active');
            }); 
            modalElement.find('#TOC > ul li a').on('click', function (e) {
                burgerMenuElement.removeClass('active');
            });
            
            let bodyClick = function (event:any) {
                if (modalElement.find('#TOC > ul').find(event.target).length == 0 
                    && burgerMenuElement.find(event.target).length == 0) {
                    burgerMenuElement.removeClass('active');
                }
            }
            $('body').on('click', bodyClick);
            scope.$on('$destroy', function () {
                $('body').off('click', bodyClick);
            });
            // end of hamburger

            scope.display.read = true;
            scope.$apply('display');
        };
    }
}

export function DirectiveFactory() {
	return new Directive();
}
