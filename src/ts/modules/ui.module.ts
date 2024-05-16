import angular, { IModule } from "angular";
import { Portal, Navbar, WithTheme, Popover, PopoverContent, PopoverOpener, Logout, WidgetContainer, Widget, AppTitle, Pulsar, Assistant, Lightbox, SmartBanner, Modal, ModalContainer, Infotip, Autocomplete, Recorder, SkinSrc, ConnectorLightbox, BindHtml, Xiti, NavigationTrigger, GuardRoot, InputGuard, DirtyGuard, DocumentGuard, CustomGuard, ResetGuard } from "../directives";
import { QuickstartService, ThemeHelperService, WidgetService, RichContentService, VideoUploadService, VideoEventTrackerService } from "../services";

const dndLists = require('angular-drag-and-drop-lists');

const module = angular.module("odeUi", ['dndLists']);

/**
 * The "odeUi" angularjs module provides many UX components (directives) and useful services.
 */
 export function odeUiModule():IModule {
    return module
    .directive("odePortal", Portal.DirectiveFactory)
    .directive("odeNavbar", Navbar.DirectiveFactory)
    .directive("withTheme", WithTheme.DirectiveFactory)
    .directive("odeModal", Modal.DirectiveFactory)
    .directive("odeModalContainer", ModalContainer.DirectiveFactory)
    .directive("odeInfotip", Infotip.DirectiveFactory)

    .directive("navigationTrigger", NavigationTrigger.DirectiveFactory)
    .directive("guardRoot", GuardRoot.DirectiveFactory)
    .directive("inputGuard", InputGuard.DirectiveFactory)
    .directive("dirtyGuard", DirtyGuard.DirectiveFactory)
    .directive("documentGuard", DocumentGuard.DirectiveFactory)
    .directive("customGuard", CustomGuard.DirectiveFactory)
    .directive("resetGuard", ResetGuard.DirectiveFactory)

    .directive("appTitle", AppTitle.DirectiveFactory)
    .directive("logout", Logout.DirectiveFactory)
    .directive("popover", Popover.DirectiveFactory)
    .directive("popoverContent", PopoverContent.DirectiveFactory)
    .directive("popoverOpener", PopoverOpener.DirectiveFactory)
    .directive("assistant", Assistant.DirectiveFactory)
    .directive("pulsar", Pulsar.DirectiveFactory)
    .directive("lightbox", Lightbox.DirectiveFactory)
    .directive("connectorLightbox", ConnectorLightbox.DirectiveFactory)
    .directive("connectorLightboxTrigger", ConnectorLightbox.TriggerDirectiveFactory)
    .directive("smartBanner", SmartBanner.DirectiveFactory)
    .directive("bindHtml", BindHtml.DirectiveFactory)
    .directive("xiti", Xiti.DirectiveFactory)

    .directive("autocomplete", Autocomplete.DirectiveFactory)
    .directive("skinSrc", SkinSrc.DirectiveFactory)

    .directive("odeRecorder", Recorder.DirectiveFactory)

    .directive("odeWidgetContainer", WidgetContainer.DirectiveFactory)
    .directive("odeWidget", Widget.DirectiveFactory)

    .service("odeThemeHelperService", ThemeHelperService )
    .service("odeQuickstartService", QuickstartService )
    .service("odeWidgetService", WidgetService )
    .service("odeRichContentService", RichContentService )
    .service("odeVideoUploadService", VideoUploadService )
    .service("odeVideoEventTrackerService", VideoEventTrackerService )
    ;
 }