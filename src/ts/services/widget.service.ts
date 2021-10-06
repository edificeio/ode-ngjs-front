import { EventName, EVENT_NAME, IWidget, LayerName, LAYER_NAME, NotifyFrameworkFactory, TransportFrameworkFactory, WidgetFrameworkFactory, RxJS } from "ode-ts-client";

const http = TransportFrameworkFactory.instance().http;

/** The widget loader service. */
export class WidgetService {

    public initialize():Promise<void> {
        return WidgetFrameworkFactory.instance().initialize(null, null);
    }

    public list():IWidget[] {
        return WidgetFrameworkFactory.instance().list;
    }

    public onChange():RxJS.Observable<{name:EventName, layer:LayerName|string, data?: any}> {
        return NotifyFrameworkFactory.instance().events().pipe(
            RxJS.filter( e => e.layer===LAYER_NAME.WIDGETS && e.name===EVENT_NAME.USERPREF_CHANGED )
        );
    }
}
