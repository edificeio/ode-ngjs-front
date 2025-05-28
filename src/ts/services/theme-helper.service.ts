import angular from "angular";
import { IThemeDesc, IWebApp, IWidget, WidgetName } from "ode-ts-client";
import { NgHelperService } from "./ng-helper.service";
import { conf } from "../utils";
import $ from 'jquery';

/**
 * Helper service providing theme-related common tasks.
 */
export class ThemeHelperService {
    static $inject =["odeNgHelperService"];

    private iconOfWidget:{[name in WidgetName]:string} = {
        "last-infos-widget":    "ic-widget-actualites",
        "birthday":             "ic-star",        // FIXME obviously wrong => create missing icon in CSS
        "calendar-widget":      "ic-widget-calendar",
        "carnet-de-bord":       "ic-widget-carnet-de-bord",
        "record-me":            "ic-widget-microphone",
        "mood":                 "ic-star",        // FIXME obviously wrong => create missing icon in CSS
        "my-apps":              "ic-widget-apps",
        "notes":                "ic-widget-notes",
        "rss-widget":           "ic-widget-rss",
        "bookmark-widget":      "ic-widget-signets",
        "qwant":                "ic-widget-qwant",
        "qwant-junior":         "ic-widget-qwant",
        "agenda-widget":        "ic-widget-agenda",
        "cursus-widget":        "ic-widget-aide-devoirs",
        "maxicours-widget":     "ic-widget-maxicours",
        "school-widget":        "ic-widget-schoolbook",
        "universalis-widget":   "ic-widget-universalis",
        "briefme-widget":       "ic-widget-briefme big",
        "edumalin-widget":      "ic-widget-edumalin",
        "mediacentre-widget":   "ic-widget-mediacentre",
        "cantine-widget":       "ic-widget-cantine",
        "screen-time-widget":   "ic-widget-screen"
    }

    constructor( 
        private ngHelperSvc:NgHelperService
    ) {
    }

    private get platform() {
        return conf().Platform;
    }

    /** Get the configured CDN URL root. */
    get CDN() {
        return this.platform.cdnDomain;
    }

    /** Return the path URL to the active theme, for example : /assets/themes/ode-bootstrap-neo */
    async getBootstrapThemePath():Promise<string> {
        const theme = this.platform.theme.themeName;
        const conf = await this.platform.theme.getConf();
        for( let override of conf.overriding ) {
            if( override.child === theme ) {
                return `${this.CDN}/assets/themes/${override.bootstrapVersion}`;
            }
        }
        return `${this.CDN}/assets/themes/${theme}`;
    }

    /** Return the path URL to the active skin, for example : /assets/themes/ode-bootstrap-neo/skins/dyslexic */
    async getBootstrapSkinPath():Promise<string> {
        let stylePath = await this.getBootstrapThemePath();
        return `${stylePath}/skins/${this.platform.theme.skinName}`;
    }

    /* Extracted from an old code base. */
    toSkinUrl( url:string ):string {
        const theme = angular.element(document.querySelectorAll("#theme"));
        if(!theme.attr('href')) {
            return "";
        }
        const path = this.platform.theme.basePath;
        if(url.indexOf('http://') === -1 && url.indexOf('https://') === -1 && url.indexOf('/workspace/') === -1){
            return path + url;
        } else {
            return url;
        }
    }
    
    /** 
     * Remove current theme and load and apply a new one.
     * THIS IS A LEGACY FEATURE and should not be used anymore.
     */
    loadOldWrappedTheme( oldTheme:string, skinName:string ) {
        $("#themeOld").remove();
        const style = angular.element(
            `<link rel="stylesheet" 
                type="text/css" 
                href="${this.platform.cdnDomain}/assets/themes/${oldTheme}/skins/${skinName}/wrapped.theme.css?version=${this.platform.deploymentTag}"
                id="themeOld"
                crossorigin="anonymous" />`
        );
        $('head').append( style );
    }

    /** Load the JS of a derived theme (skin) */
    loadThemeJs( theme:string ) {
        $("#themeJS").remove();
        const style = angular.element(
            `<script
                type="text/javascript"
                src="${this.platform.cdnDomain}/assets/themes/${theme}/js/theme.js?version=${this.platform.deploymentTag}"
                id="themeJS" />`
        );
        $('body').append(style);
    }

    /** Apply a theme from its URL */
    async applyStyle( stylePath:string ) {
        if( stylePath && stylePath.length > 0 && stylePath.lastIndexOf('/', stylePath.length-1) !== stylePath.length-1 ) 
            stylePath += "/";
        stylePath = `${stylePath}theme.css?version=${this.platform.deploymentTag}`;
        if($('#theme').length === 0) {
            const style = angular.element(
                `<link rel="stylesheet" 
                    type="text/css" 
                    href="${stylePath}"
                    id="theme"
                    crossorigin="anonymous" />`
            );
            var favicon = angular.element(
                `<link rel="icon" href="${this.platform.theme.basePath}img/illustrations/favicon.ico" />`
            );
            style.on('load', e => {
                $('body').show();
            });
            $('head')
                .append(style)
                .append(favicon);
            setTimeout(function () {
                $('body').show();
            }, 300);
        }
        else {
            $('#theme').attr('href', stylePath);
        }
    }

    /** @return list of available derived themes (skins) for the user. */
    listThemes():Promise<IThemeDesc[]> {
        return this.platform.theme.listThemes();
    }

    /** Apply a derived theme (skin) and save it as prefered, then update the data in cache. */
    async setTheme( theme:IThemeDesc ) {
        let stylePath = await this.getBootstrapThemePath();
        this.applyStyle( `${stylePath}/skins/${theme._id}` );
        this.platform.theme.setDefaultTheme( theme );
    }

    /** 
     * Map between apps and their CSS code.
     */
     getIconCode( app:IWebApp ):string {
        let appCode = app.icon.trim().toLowerCase() || "";
        if( appCode && appCode.length > 0 ) {
            if(appCode.endsWith("-large"))  appCode = appCode.replace("-large", "");
        } else {
            appCode = app.displayName.trim().toLowerCase();
        }
        appCode = conf().Platform.idiom.removeAccents(appCode);
		// @see distinct values for app's displayName is in query /auth/oauth2/userinfo
		switch( appCode ) {
			case "admin.title": 	    appCode = "admin"; break;
            case "banques des savoirs": appCode = "banquesavoir"; break;
            case "collaborativewall":   appCode = "collaborative-wall"; break;
            case "communautés":         appCode = "community"; break;
			case "directory.user":	    appCode = "userbook"; break;
            case "emploi du temps":     appCode = "edt"; break;
			case "messagerie": 		    appCode = "conversation"; break;
            case "news":                appCode = "actualites"; break;
            case "homeworks":
            case "cahier de texte":     appCode = "cahier-de-texte"; break;
            case "diary":
            case "cahier de texte 2d":  appCode = "cahier-textes"; break;
			default: break;
		}
		return appCode;
	}

    /** @return the CSS class of a widget */
    getWidgetIconClass( widget:IWidget ):string {
        return this.iconOfWidget[widget.platformConf.name];
    }
}

/*
// Depuis theme.ts

declare var jQuery:any;

export const themeService = {
    loadOldWrappedTheme(oldTheme:string, skinName:string){
        let version = 'dev';
        if((window as any).springboardBuildDate){
            version = (window as any).springboardBuildDate;
        }
        jQuery("#themeOld").remove();
        const style = jQuery('<link>', {
            rel: 'stylesheet',
            type: 'text/css',
            href: (window as any).CDN_DOMAIN+`/assets/themes/${oldTheme}/skins/${skinName}/wrapped.theme.css?version=${version}`,
            id: 'themeOld'
        }).attr("crossorigin", "anonymous");
        jQuery('head').append(style);
    },
    loadThemeJs(theme:string){
        let version = 'dev';
        if((window as any).springboardBuildDate){
            version = (window as any).springboardBuildDate;
        }
        jQuery("#themeJS").remove();
        const style = jQuery('<script>', {
            type: 'text/javascript',
            src: (window as any).CDN_DOMAIN+`/assets/themes/${theme}/js/theme.js?version=${version}`,
            id: 'themeJS'
        });
        jQuery('body').append(style);
    }
}

// Depuis ui.ts :
setStyle: function (stylePath:string) {
    if(stylePath && stylePath.startsWith("/")){
        stylePath = (window as any).CDN_DOMAIN + stylePath;
    }
    if ($('#theme').length === 0) {
        let version = 'dev';
        if((window as any).springboardBuildDate){
            version = (window as any).springboardBuildDate;
            console.log('Springboard built on ' + version);
        }

        var style = $('<link>', {
            rel: 'stylesheet',
            type: 'text/css',
            href: stylePath + 'theme.css?version=' + version,
            id: 'theme'
        }).attr("crossorigin", "anonymous");
        var favicon = $('<link>', {
            rel: 'icon',
            href: skin.basePath + 'img/illustrations/favicon.ico'
        });
        style.on('load', function () {
            $('body').show();
        });
        $('head')
            .append(style)
            .append(favicon);
        setTimeout(function () {
            $('body').show();
        }, 300);
    }
    else {
        $('#theme').attr('href', stylePath + 'theme.css');
    }
},  

*/
