import { IAttributes, ICompileService, IController, IDirective, IScope } from "angular";
import { I18nBase } from "./I18nBase";

/* Directive */
class Directive extends I18nBase implements IDirective<IScope,JQLite,IAttributes,IController[]> {
    restrict = 'A';
    replace = true;

    link(scope:IScope, elem:JQLite, attrs:IAttributes, controllers?:IController[]): void {
        attrs.$observe('content', val => {
            if(!attrs.content){
                return;
            }
            // Set the inner HTML of elem with compiled html() code, not compiled text().
            // The html code may contain other angular directives, or HTML tags.
            elem.html( this.$compile('<span class="no-style">' + this.idiom.translate(attrs.content) + '</span>')(scope).html() );
        });

        attrs.$observe('attr', val => {
            if(!attrs.attr){
                return;
            }
            var compiled = this.$compile('<span>' + this.idiom.translate(attrs[attrs.attr]) + '</span>')(scope);
            setTimeout(function(){
                elem.attr(attrs.attr, compiled.text()); // Use compiled text(), not html() because attributes should not contain html tags
            }, 10);
        });

        attrs.$observe('attrs', val => {
            if(!attrs.attrs){
                return;
            }
            var attrObj = scope.$eval(attrs.attrs);
            for(var prop in attrObj){
                const compiled = this.$compile('<span>'+ this.idiom.translate(attrObj[prop]) +'</span>')(scope);
                setTimeout(function(){
                    elem.attr(prop, compiled.text()); // Use compiled text(), not html() because attributes should not contain html tags
                }, 0);
            }
        })

        attrs.$observe('key', val => {
            if(!attrs.key){
                return;
            }
            // Set the inner HTML of elem with compiled html() code, not compiled text().
            // The html code may contain other angular directives, or HTML tags.
            elem.html( this.$compile('<span class="no-style">'+ this.idiom.translate(attrs.key) +'</span>')(scope).html() );
        });
    }
}

/** The translate directive.
 *
 * Usage:
 *      &lt;div translate key="your.i18n.key"></div&gt;
 * or
 *      &lt;label translate content="your.i18n.key"></label&gt;
 * or
 *      &lt;input placeholder="your.placeholder.key" translate attr="placeholder"></input&gt;
 * or
 *      &lt;input translate attrs="{placeholder:'your.placeholder.key', value:'another.i18n.key'}"></input&gt;
 */
export function DirectiveFactory($compile:ICompileService) {
	return new Directive($compile);
}
DirectiveFactory.$inject = ["$compile"];