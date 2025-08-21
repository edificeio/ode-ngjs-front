import angular, { auto, IModule } from "angular";
import MaxicoursWidget = require("../widgets/maxicours-widget/maxicours-widget.widget");
import CursusWidget = require("../widgets/cursus-widget/cursus-widget.widget");
import SchoolWidget = require("../widgets/school-widget/school-widget.widget");
import RecordMe = require("../widgets/record-me/record-me.widget");
import AgendaWidget = require("../widgets/agenda-widget/agenda-widget.widget");
import QwantWidget = require("../widgets/qwant-widget/qwant-widget.widget");
import BookmarkWidget = require("../widgets/bookmark-widget/bookmark-widget.widget");
import RssWidget = require("../widgets/rss-widget/rss-widget.widget");
import MyApps = require("../widgets/my-apps/my-apps.widget");
import CarnetDeBord = require("../widgets/carnet-de-bord/carnet-de-bord.widget");
import DicoDeLaZone = require("../widgets/dicodelazone-widget/dicodelazone-widget.widget");
import Calendar = require("../widgets/calendar-widget/calendar-widget.widget");
import Universalis = require("../widgets/universalis-widget/universalis-widget.widget");
import Briefme = require("../widgets/briefme-widget/briefme-widget.widget");
import LastInfos = require("../widgets/last-infos-widget/last-infos-widget.widget");
import Edumalin = require("../widgets/edumalin-widget/edumalin-widget.widget");
import Mediacentre = require("../widgets/mediacentre-widget/mediacentre-widget.widget");
import Cantine = require("../widgets/cantine-widget/cantine-widget.widget");
import ScreenTime= require("../widgets/screen-time-widget/screen-time-widget.widget");


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
export enum KnownWidget {
    maxicours       = "maxicours-widget",
    cursus          = "cursus-widget",
    school          = "school-widget",
    recordMe        = "record-me",
    agenda          = "agenda-widget",
    qwant           = "qwant",
    bookmark        = "bookmark-widget",
    rss             = "rss-widget",
    myApps          = "my-apps",
    carnetDeBord    = "carnet-de-bord",
    dicoDeLaZone    = "dicodelazone-widget",
    calendar        = "calendar-widget",
    universalis     = "universalis-widget",
    briefme         = "briefme-widget",
    lastInfos       = "last-infos-widget",
    edumalin        = "edumalin-widget",
    mediacentre     = "mediacentre-widget",
    cantine         = "cantine-widget",
    screenTime      = "screen-time-widget"

};
export type WidgetLoader = (widgetName:String)=>Promise<void>;

//------------------------------------------------ Create an angular module and an external loader.
const module = angular.module("odeWidgets", [])

.factory('odeWidgetLoader', ['$injector', function($injector:auto.IInjectorService) {
    return async (widgetName:KnownWidget) => {
        // Load the widget, if known.
        switch( widgetName ) {
            case KnownWidget.maxicours: await loadMaxicoursWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.cursus: await loadCursusWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.school: await loadSchoolWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.recordMe: await loadRecordMeWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.agenda: await loadAgendaWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.qwant: await loadQwantWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.bookmark: await loadBookmarkWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.rss: await loadRssWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.myApps: await loadMyAppsWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.carnetDeBord: await loadCarnetDeBordWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.dicoDeLaZone: await loadDicoDeLaZoneWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.calendar: await loadCalendarWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.universalis: await loadUniversalisWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.briefme: await loadBriefmeWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.lastInfos: await loadLastInfosWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.edumalin: await loadEdumalinWidgetModule().then( mod=>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.mediacentre: await loadMediacentreWidgetModule().then( mod =>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.cantine: await loadCantineWidgetModule().then( mod =>{ $injector.loadNewModules([mod]) }); break;
            case KnownWidget.screenTime: await loadScreenTimeWidgetModule().then( mod =>{ $injector.loadNewModules([mod]) }); break;
            default: throw `Unknown widget "${widgetName}"`;
        }
    };
}]);

/** Dynamically load the "maxicours-widget" widget, which is packaged as a separate entry thanks to require.ensure(). */
function loadMaxicoursWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/maxicours-widget/maxicours-widget.widget"],
            function(require) {
                var jsModule = <typeof MaxicoursWidget> require("../widgets/maxicours-widget/maxicours-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/maxicours-widget/maxicours-widget.widget"
        );
    });
}

/** Dynamically load the "cursus-widget" widget, which is packaged as a separate entry thanks to require.ensure(). */
function loadCursusWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/cursus-widget/cursus-widget.widget"],
            function(require) {
                var jsModule = <typeof CursusWidget> require("../widgets/cursus-widget/cursus-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/cursus-widget/cursus-widget.widget"
        );
    });
}

/** Dynamically load the "school-widget" widget, which is packaged as a separate entry thanks to require.ensure(). */
function loadSchoolWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/school-widget/school-widget.widget"],
            function(require) {
                var jsModule = <typeof SchoolWidget> require("../widgets/school-widget/school-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/school-widget/school-widget.widget"
        );
    });
}

/** Dynamically load the "record-me" widget, which is packaged as a separate entry thanks to require.ensure(). */
function loadRecordMeWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/record-me/record-me.widget"],
            function(require) {
                var jsModule = <typeof RecordMe> require("../widgets/record-me/record-me.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/record-me/record-me.widget"
        );
    });
}

/** Dynamically load the "agenda-widget" widget, which is packaged as a separate entry thanks to require.ensure(). */
function loadAgendaWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/agenda-widget/agenda-widget.widget"],
            function(require) {
                var jsModule = <typeof AgendaWidget> require("../widgets/agenda-widget/agenda-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/agenda-widget/agenda-widget.widget"
        );
    });
}

/** Dynamically load the "qwant-widget" widget, which is packaged as a separate entry thanks to require.ensure(). */
function loadQwantWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/qwant-widget/qwant-widget.widget"],
            function(require) {
                var jsModule = <typeof QwantWidget> require("../widgets/qwant-widget/qwant-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/qwant-widget/qwant-widget.widget"
        );
    });
}

/** Dynamically load the "bookmark-widget" widget, which is packaged as a separate entry thanks to require.ensure(). */
function loadBookmarkWidgetModule() {
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

/** Dynamically load the "rss-widget" widget, which is packaged as a separate entry thanks to require.ensure(). */
function loadRssWidgetModule() {
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

/** Dynamically load the "my-apps" widget, which is packaged as a separate entry thanks to require.ensure(). */
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

/** Dynamically load the "carnet-de-bord/carnet-de-bord" widget, which is packaged as a separate entry thanks to require.ensure(). */
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

/** Dynamically load the "last-infos" widget, which is packaged as a separate entry thanks to require.ensure(). */
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

/** Dynamically load the "calendar" widget, which is packaged as a separate entry thanks to require.ensure(). */
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

/** Dynamically load the "dicodelazone" widget, which is packaged as a separate entry thanks to require.ensure(). */
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

/** Dynamically load the "universalis" widget, which is packaged as a separate entry thanks to require.ensure(). */
function loadUniversalisWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/universalis-widget/universalis-widget.widget"],
            function(require) {
                var jsModule = <typeof Universalis> require("../widgets/universalis-widget/universalis-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/universalis-widget/universalis-widget.widget"
        );
    });
}

/** Dynamically load the "briefme" widget, which is packaged as a separate entry thanks to require.ensure(). */
function loadBriefmeWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/briefme-widget/briefme-widget.widget"],
            function(require) {
                var jsModule = <typeof Briefme> require("../widgets/briefme-widget/briefme-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/briefme-widget/briefme-widget.widget"
        );
    });
}

/** Dynamically load the "edumalin" widget, which is packaged as a separate entry thanks to require.ensure(). */
function loadEdumalinWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/edumalin-widget/edumalin-widget.widget"],
            function(require) {
                var jsModule = <typeof Edumalin> require("../widgets/edumalin-widget/edumalin-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/edumalin-widget/edumalin-widget.widget"
        );
    });
}

/** Dynamically load the "mediacentre" widget, which is packaged as a separate entry thanks to require.ensure(). */
function loadMediacentreWidgetModule() {
    return new Promise<string>( (resolve, reject) => {
        // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
        require.ensure(
            ["../widgets/mediacentre-widget/mediacentre-widget.widget"],
            function(require) {
                var jsModule = <typeof Mediacentre> require("../widgets/mediacentre-widget/mediacentre-widget.widget");
                resolve( jsModule.odeModuleName );
            },
            function(error) {
                console.log(error);
                reject();
            },
            "widgets/mediacentre-widget/mediacentre-widget.widget"
        );
    });
}

    /** Dynamically load the "Cantine" widget, which is packaged as a separate entry thanks to require.ensure(). */
    function loadCantineWidgetModule() {
        return new Promise<string>( (resolve, reject) => {
            // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
            require.ensure(
                ["../widgets/cantine-widget/cantine-widget.widget"],
                function(require) {
                    var jsModule = <typeof Cantine> require("../widgets/cantine-widget/cantine-widget.widget");
                    resolve( jsModule.odeModuleName );
                },
                function(error) {
                    console.log(error);
                    reject();
                },
                "widgets/cantine-widget/cantine-widget.widget"
            );
        });
    }

    /** Dynamically load the "Cantine" widget, which is packaged as a separate entry thanks to require.ensure(). */
    function loadScreenTimeWidgetModule() {
        return new Promise<string>( (resolve, reject) => {
            // Note: the following "require.ensure" function acts as a compiling directive for webpack, and cannot be variabilized.
            require.ensure(
                ["../widgets/screen-time-widget/screen-time-widget.widget"],
                function(require) {
                    var jsModule = <typeof ScreenTime> require("../widgets/screen-time-widget/screen-time-widget.widget");
                    resolve( jsModule.odeModuleName );
                },
                function(error) {
                    console.log(error);
                    reject();
                },
                "widgets/screen-time-widget/screen-time-widget.widget"
            );
        });
    }

/**
 * The "odeWidgets" angularjs module is a placeholder for widgets directives.
 */
export function odeWidgetModule():IModule {
    return module;
}
