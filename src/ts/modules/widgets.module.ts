import angular, { auto, IModule } from "angular";
import BookmarkWidget = require("../widgets/bookmark-widget/bookmark-widget.widget");
import RssWidget = require("../widgets/rss-widget/rss-widget.widget");
import MyApps = require("../widgets/my-apps/my-apps.widget");
import CarnetDeBord = require("../widgets/carnet-de-bord/carnet-de-bord.widget");
import DicoDeLaZone = require("../widgets/dicodelazone-widget/dicodelazone-widget.widget");
import Calendar = require("../widgets/calendar-widget/calendar-widget.widget");
import LastInfos = require("../widgets/last-infos-widget/last-infos-widget.widget");

// ============ /!\ IMPORTANT /!\ ============
//
// By using require.ensure() to async load them, the ts-loader plugin will not bundle the widgets in the ode-ngjs-front package.
// See https://github.com/TypeStrong/ts-loader#code-splitting-and-loading-other-resources
// and the examples : 
// https://github.com/TypeStrong/ts-loader/blob/main/test/comparison-tests/codeSplitting
// https://github.com/TypeStrong/ts-loader/blob/main/test/comparison-tests/es6codeSplitting
//
// ===========================================
declare var require: {
    <T>(path: string): T;
    (paths: string[], callback: (...modules: any[]) => void): void;
    ensure: (
        dependencies: string[],
        callback: (require: <T>(path: string) => T) => void,
        errorCallback: (error:any) => void,
        chunkName: string
    ) => void;
};

//------------------------------------------------ Types
type KnownWidget = "bookmark-widget"|"rss-widget"|"my-apps"|"carnet-de-bord"|"dicodelazone-widget"|"calendar-widget"|"last-infos-widget";
export type WidgetLoader = (widgetName:String)=>Promise<void>;

//------------------------------------------------ Create an angular module and an external loader.
const module = angular.module("odeWidgets", [])

.factory('odeWidgetLoader', ['$injector', function($injector:auto.IInjectorService) {
    return async (widgetName:KnownWidget) => {
        // Load the widget, if known.
        switch( widgetName ) {
            case "bookmark-widget": await loadBookmarkWidgetWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case "rss-widget": await loadRssWidgetWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case "my-apps": await loadMyAppsWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case "carnet-de-bord": await loadCarnetDeBordWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case "dicodelazone-widget": await loadDicoDeLaZoneWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case "calendar-widget": await loadCalendarWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case "last-infos-widget": await loadLastInfosWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            default: throw `Unknown widget "${widgetName}"`;
        }
    };
}]);

/** Dynamically load the "bookmark-widget" widget, which is packaged as a separate entries thanks to require.ensure(). */
function loadBookmarkWidgetWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/bookmark-widget/bookmark-widget.widget"],
            function(require) {
                var jsModule = <typeof BookmarkWidget> require("../widgets/bookmark-widget/bookmark-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/bookmark-widget/bookmark-widget.widget"
        );
    });
}

/** Dynamically load the "rss-widget" widget, which is packaged as a separate entries thanks to require.ensure(). */
function loadRssWidgetWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/rss-widget/rss-widget.widget"],
            function(require) {
                var jsModule = <typeof RssWidget> require("../widgets/rss-widget/rss-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/rss-widget/rss-widget.widget"
        );
    });
}

/** Dynamically load the "my-apps" widget, which is packaged as a separate entries thanks to require.ensure(). */
function loadMyAppsWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/my-apps/my-apps.widget"],
            function(require) {
                var jsModule = <typeof MyApps> require("../widgets/my-apps/my-apps.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/my-apps/my-apps.widget"
        );
    });
}

/** Dynamically load the "carnet-de-bord/carnet-de-bord" widget, which is packaged as a separate entries thanks to require.ensure(). */
function loadCarnetDeBordWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/carnet-de-bord/carnet-de-bord.widget"],
            function(require) {
                var jsModule = <typeof CarnetDeBord> require("../widgets/carnet-de-bord/carnet-de-bord.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/carnet-de-bord/carnet-de-bord.widget"
        );
    });
}

/** Dynamically load the "last-infos" widget, which is packaged as a separate entries thanks to require.ensure(). */
function loadLastInfosWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/last-infos-widget/last-infos-widget.widget"],
            function(require) {
                var jsModule = <typeof LastInfos> require("../widgets/last-infos-widget/last-infos-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/last-infos-widget/last-infos-widget.widget"
        );
    });
}

/** Dynamically load the "calendar" widget, which is packaged as a separate entries thanks to require.ensure(). */
function loadCalendarWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/calendar-widget/calendar-widget.widget"],
            function(require) {
                var jsModule = <typeof Calendar> require("../widgets/calendar-widget/calendar-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/calendar-widget/calendar-widget.widget"
        );
    });
}

/** Dynamically load the "dicodelazone" widget, which is packaged as a separate entries thanks to require.ensure(). */
function loadDicoDeLaZoneWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/dicodelazone-widget/dicodelazone-widget.widget"],
            function(require) {
                var jsModule = <typeof DicoDeLaZone> require("../widgets/dicodelazone-widget/dicodelazone-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/dicodelazone-widget/dicodelazone-widget.widget"
        );
    });
}

/**
 * The "odeWidgets" angularjs module is a placeholder for widgets directives.
 */
export function odeWidgetModule():IModule {
    return module;
}
