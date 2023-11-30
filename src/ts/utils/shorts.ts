import { ConfigurationFrameworkFactory, NotifyFrameworkFactory, SessionFrameworkFactory, TransportFrameworkFactory } from "ode-ts-client";

/** Short for accessing to the global ConfigurationFramework.  */
export function conf() {
    return ConfigurationFrameworkFactory.instance();
}
/** Short for accessing to the global NotifyFramework.  */
export function notif() {
    return NotifyFrameworkFactory.instance();
}
/** Short for accessing to the global http client.  */
export function http() {
    return TransportFrameworkFactory.instance().http;
}
/** Short for accessing to the global session.  */
export function session() {
    return SessionFrameworkFactory.instance().session;
}
