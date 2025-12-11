import angular, { IAttributes, IController, IDirective, IScope } from "angular";
import { L10n, conf, notif, session, http, TrackedAction, TrackedActionFromWidget } from "../../utils";
import { IUserDescription, IUserInfo } from "ode-ts-client";
import { ThemeHelperService } from "../../services";

type ContentType = {
	title: string;	//"lateness",
	icon: string;	//"timer-off";
	compact: string|boolean;	//"",
	full: any[]|boolean;
	lightboxTitle: string;	//"carnet-de-bord.widget.lateness.all"
}

/* Controller for the directive */
class Controller implements IController {
	constructor( 
		private themeHelperSvc:ThemeHelperService
	) {}
	private me:IUserInfo = session().user;
	private description:IUserDescription = session().description;

	public structures:any[] = [];
	public eleves:any[] = [];
	
	
	public showLightbox = false;
	public currentContentType: any;
	public currentEleve: any;
	public contentTypes:ContentType[] = [{
		title: "lateness",
		icon: "ic-timer-off",
		compact: "",
		full: [],
		lightboxTitle: "carnet-de-bord.widget.lateness.all"
	},{
		title: "absences",
		icon: "ic-nobody",
		compact: "",
		full: [],
		lightboxTitle: "carnet-de-bord.widget.absences.all"
	},{
		title: "grades",
		icon: "ic-grades",
		compact: "",
		full: [],
		lightboxTitle: "carnet-de-bord.widget.grades.all"
	},{
		title: "diary",
		icon: "ic-homeworks",
		compact: "",
		full: [],
		lightboxTitle: "carnet-de-bord.widget.diary.all"
	},{
		title: "skills",
		icon: "ic-trending-up",
		compact: "",
		full: [],
		lightboxTitle: "carnet-de-bord.widget.skills.all"
	}];
    public structureAddress:string = "";
    public structureId:string = "";
    public parentTag?:JQuery<HTMLElement>;
    public errorMsg:any;
	
	getAvatar(index:number):string {
		if (index < this.eleves.length) {
			return `/userbook/avatar/${this.getChildId(index)}?thumbnail=100x100`;
		} else {
			return this.themeHelperSvc.toSkinUrl("/img/illustrations/no-avatar.svg?thumbnail=100x100");
		}
	}

	getEleve(index:number){
		if (index < this.eleves.length) {
			this.currentEleve = this.eleves[index];
			this.contentTypes.forEach( (type:ContentType) => {
				this.getContent( type, this.currentEleve );
			});
		}
	}

	getTag(tagName:string, index:number){
		if (index < this.eleves.length) {
			return $(this.eleves[index]).find(tagName).text();
		}
		return "";
	}

	getCurrentTag(tagName:string){
		if (this.currentEleve) {
			return $(this.currentEleve).find(tagName).text();
		}
		return "";
	}

    userStatus(){
        if (this.me.type === 'PERSRELELEVE') {
            return 'parent';
        } else if (this.me.type === 'ELEVE') {
            return 'eleve';
        } else {
            return '';
        }
    }
	
	getChildId( index:number ){
		const xmlFirstName = this.getTag('Prenom', index).toLowerCase();
		const xmlLastName = this.getTag('Nom', index).toLowerCase();
		for( let id in this.me.children ){
			const modelFname = this.me.children[id].firstName.toLowerCase();
			const modelLname = this.me.children[id].lastName.toLowerCase();
	
		   if(modelFname === xmlFirstName && modelLname === xmlLastName){
			   return id;
		   }
		}
	}

	openLightBox(contentType:any, e:Event){
		this.currentContentType = contentType;
		this.showLightbox = true;

        // Track this event.
        if( e.currentTarget ) {
            this.trackEvent(e, { detail:{'properties':'any'} });
        }
	}

    // Give an opportunity to track some events from outside of this component.
    protected trackEvent(e:Event, p:CustomEventInit<TrackedAction>) {
        // Allow events to bubble up.
        if(typeof p.bubbles === "undefined") p.bubbles = true;

        let event = null;
        if( p && (typeof p.detail?.open==='string'||typeof p.detail?.properties==='string') ) {
            event = new CustomEvent( TrackedActionFromWidget.carnetDeBord, p );
        }
        if( event && e.currentTarget ) {
            e.currentTarget.dispatchEvent(event);
        }
    }

	private getContent( contentType:ContentType, eleve:any ) {
		const lang = conf().Platform.idiom;
		if( contentType.title === 'lateness' ) {
			let delays = $(eleve).find('Retard Justifie');
			let latedate:any = false;
			const allDelays = [] as any[];
			contentType.compact = false;
			contentType.full = false;

			if (delays) {
				delays.each( (i, delay) => {
					if($(delay).text() === 'false'){
						var pageUrl = $(delay).parent().attr('page');
						latedate = $(delay).parent().find('Date').text();
						latedate = L10n.moment(latedate);
						latedate = lang.translate('carnet-de-bord.widget.the')+" "+latedate.format('DD/MM/YYYY - HH:mm');
						allDelays.push({
							value : latedate,
							pageUrl : pageUrl
						});
						contentType.compact = allDelays[0].value;
					}
				})
				contentType.full = allDelays;
			}
		} else if( contentType.title === 'absences' ) {
            var allAbsences:any[] = [];
            contentType.compact = false;
            contentType.full = false;

            var absences = $(eleve).find('Absence Justifie')

            if(absences){
                absences.each(function(i, absence){

                    if($(absence).text() === 'false'){

                        var pageUrl = $(absence).parent().attr('page');

						let absDate:any;

                        if($(absence).parent().find('EstOuverte').text()==="false"){
                            // du... au...
                            let startdate:any = $(absence).parent().find('DateDebut').text();
                            let enddate:any = $(absence).parent().find('DateFin').text();
                            startdate = L10n.moment(startdate);
                            enddate = L10n.moment(enddate);
                            startdate = startdate.format('DD/MM/YYYY HH:mm');
                            enddate = enddate.format('DD/MM/YYYY HH:mm');

                            absDate = lang.translate('carnet-de-bord.widget.from')+" "+startdate +" "+lang.translate('carnet-de-bord.widget.to')+" "+enddate;
                        }else {
                            absDate = $(absence).parent().find('DateDebut').text();
                            absDate = L10n.moment(absDate);
                            absDate = absDate.format('DD/MM/YYYY HH:mm');
                            absDate = lang.translate('carnet-de-bord.widget.the')+" "+  absDate;
                        }
                        allAbsences.push({
                            value : absDate,
                            pageUrl : pageUrl
                        });
                        contentType.compact = allAbsences[0].value
                    }
                })
                contentType.full = allAbsences;
            }
		} else if( contentType.title === 'grades' ) {
            var allGrades:any[] = [];
            contentType.compact = false;
            contentType.full = false;

            var isnote = $(eleve).find('PageReleveDeNotes Devoir Note').text();
            if(isnote){
                var lastNotes = $(eleve).find('PageReleveDeNotes Devoir')

                lastNotes.each(function(i, result){
                    var pageUrl = $(result).attr('page');
                    var note = $(result).find('Note').text();
                    var bareme = $(result).find('Bareme').text();
                    var matiere = $(result).find('Matiere').text();
                    var notedate:any = L10n.moment($(result).find('Date').text());
                    notedate = notedate.format('DD/MM/YYYY');
                    var grade = note+"/"+bareme+" "+lang.translate('carnet-de-bord.widget.in')+" "+matiere+" "+lang.translate('carnet-de-bord.widget.the')+" "+notedate;

                    allGrades.push({
                        value : grade,
                        pageUrl : pageUrl
                    });
                    contentType.compact = allGrades[0].value

                })
                contentType.full = allGrades
            }

        } else if( contentType.title === 'diary' ) {
            var allWorks:any[] = [];
            contentType.compact = false;
            contentType.full = false;

            var iswork = $(eleve).find('PageCahierDeTextes CahierDeTextes TravailAFaire Descriptif').text();
            if (iswork) {
                const parser = new DOMParser();
                var diaries = $(eleve).find('PageCahierDeTextes CahierDeTextes');
                $(diaries).each(function(i, diary){
                    if ($(diary).find('TravailAFaire Descriptif').text()) {

                        let matiere = lang.translate('carnet-de-bord.widget.new.homework')+" "+$(diary).find('Matiere').text()
                        let works = $(diary).find('TravailAFaire');
                        let subsections:any[] = [];

                        $(works).each(function(i, work){
                            let pageUrl = $(work).attr('page');
                            let matiereFirst = $(work).parent().find('Matiere').text()
                            let delivdate:any = L10n.moment($(work).find('PourLe').text())
                            delivdate = delivdate.format('DD/MM/YYYY');
                            delivdate = lang.translate('carnet-de-bord.widget.for')+" "+delivdate
                            let descr:any = $(work).find('Descriptif');
                            //can throw a DOMException
                            //descr = descr.html(descr.text()).text();
                            const doc = parser.parseFromString(descr.text(), 'text/html');
                            descr = doc.documentElement.textContent;

                            subsections.push({
                                header: delivdate,
                                content: descr,
                                pageUrl: pageUrl
                            })
                        })

                        allWorks.push({
                            value: matiere,
                            subsections: subsections
                        });
                        contentType.compact = allWorks[0].value+" "+allWorks[0].subsections[0].header
                    }
                })

                contentType.full = allWorks
            }
        } else if( contentType.title === 'skills' ) {
            let allSkills:any[] = [];
            let subsections:any[] = [];
            contentType.compact = false;
            contentType.full = false;

            var isSkill = $(eleve).find('PageCompetences Competence').text();

            if (isSkill) {
                var skills = $(eleve).find('PageCompetences Competence').parent()
                skills.each(function(i, skill){
                    if ($(skill).find('Libelle').text()==="Acquis") {
                        var pageUrl = $(skill).attr('page');
                        var title = $(skill).find('Intitule').text();
                        var competence = $(skill).find('Competence').text()+" ";
                        var item = $(skill).find('Item').text()+" ";

                        var matiere = $(skill).find('Matiere').text();
                        var skillDate:any = L10n.moment($(skill).find('Date').text());
                        skillDate = skillDate.format('DD/MM/YYYY');

                        var headskill = lang.translate('carnet-de-bord.widget.skills')+" ";
                        var headitem = lang.translate('carnet-de-bord.widget.skills.item')+" ";

                        var fullTitle = title +" "+lang.translate('carnet-de-bord.widget.the')+" "+skillDate;

                        if(matiere){
                            fullTitle = fullTitle+" "+lang.translate('carnet-de-bord.widget.in')+" "+matiere;
                        }

                        var subsections = [{
                            header: headskill,
                            content: competence
                        }];

                        if($(skill).find('Item').text()){
                            subsections.push({
                                header: headitem,
                                content: item
                            })
                        }
                        allSkills.push({
                            value: fullTitle,
                            subsections: subsections,
                            pageUrl: pageUrl
                        });
                        contentType.compact = allSkills[0].value;
                    }
                })
                contentType.full = allSkills;
            }
        }
	}
}

/* Directive */
class Directive implements IDirective<IScope,JQLite,IAttributes,IController[]> {
    restrict = 'E';
	template = require('./carnet-de-bord.widget.html').default;
	controller = ["odeThemeHelperService", Controller];
	controllerAs = 'ctrl';
    require = ['odeCarnetDeBord'];

    link(scope:IScope, elem:JQLite, attrs:IAttributes, controllers?:IController[]): void {
        const ctrl:Controller|null = controllers ? controllers[0] as Controller : null;
		if( ! ctrl ) return;

		http().get('/sso/pronote')
		.then( (structures:any[]) => {
            if( http().latestResponse.status !== 200 ) {
                /* Mocked data for testing during development.
                structures = [{
                    "structureId" : null,
                    "xmlResponse" : "<?xml version=\"1.0\"?>\r\n<Parent xmlns=\"http://www.index-education.com/accueilENT\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.index-education.com/accueilENT Parent.xsd\" version=\"1.03\"><Eleve><Nom>BESNIER</Nom><Prenom>Amelie</Prenom><IdentifiantPronote>74CPUWN8RAJQVM5K</IdentifiantPronote><PageReleveDeNotes><Titre>Relevé de notes<\/Titre><Message>Publication du bulletin le 20\/02<\/Message><Devoir page=\"da89cbc9e593f9c4273356659410b0780a616fc5b398d64ba174e138ae0fd5adb4c4b787aa38a237966c8478db61faea\"><Note>15,00<\/Note><Bareme>20.00<\/Bareme><Matiere>TECHNOLOGIE<\/Matiere><Date>2012-03-26<\/Date><\/Devoir><Devoir><Note>17,00<\/Note><Bareme>20.00<\/Bareme><Matiere>NOTE DE VIE SCOLAIRE<\/Matiere><Date>2012-03-26<\/Date><\/Devoir><Devoir><Note>14,00<\/Note><Bareme>20.00<\/Bareme><Matiere>ALLEMAND LV2<\/Matiere><Date>2012-03-25<\/Date><\/Devoir><\/PageReleveDeNotes><PageCahierDeTextes><Titre>Travaux \u00E0 faire<\/Titre><CahierDeTextes><Matiere>MATHEMATIQUE<\/Matiere><Date>2012-03-24<\/Date><TravailAFaire><Descriptif>Lire et apprendre<\/Descriptif><PourLe>2012-03-25<\/PourLe><PieceJointe>2 géométrie, fonctions.doc?sessionENT=20200<\/PieceJointe><SiteInternet>http:\/\/www.google.com<\/SiteInternet><\/TravailAFaire><\/CahierDeTextes><\/PageCahierDeTextes><PageVieScolaire><Titre>Vie scolaire</Titre><Absence page=\"72DF243042E894648C14FB0D5D1EE3081D1E004C8F652CBDA731EEB8BD00ED2DAFCDB4EF61078786E411BFD357C4E35922C97134B3A119EB2F49DCE79E38168F\"><DateDebut>2016-09-20T08:00:00</DateDebut><DateFin>2016-09-20T09:00:00</DateFin><EstOuverte>false</EstOuverte><Justifie>false</Justifie><Motif></Motif></Absence></PageVieScolaire></Eleve><Eleve><Nom>BESNIER</Nom><Prenom>Marie</Prenom><IdentifiantPronote>X5VKRNQ9W7MHA4SU</IdentifiantPronote><PageReleveDeNotes><Titre>Relevé de notes<\/Titre><Message>Publication du bulletin le 20\/02<\/Message><Devoir page=\"da89cbc9e593f9c4273356659410b0780a616fc5b398d64ba174e138ae0fd5adb4c4b787aa38a237966c8478db61faea\"><Note>15,00<\/Note><Bareme>20.00<\/Bareme><Matiere>TECHNOLOGIE<\/Matiere><Date>2012-03-26<\/Date><\/Devoir><Devoir><Note>17,00<\/Note><Bareme>20.00<\/Bareme><Matiere>NOTE DE VIE SCOLAIRE<\/Matiere><Date>2012-03-26<\/Date><\/Devoir><Devoir><Note>14,00<\/Note><Bareme>20.00<\/Bareme><Matiere>ALLEMAND LV2<\/Matiere><Date>2012-03-25<\/Date><\/Devoir><\/PageReleveDeNotes><PageCompetences><Titre>Compétences</Titre><Item page=\"FC560506B53C466323C3BB6495BA0C3DD788475225004AE89B4B662475B2F533614EF0A1574E1DA7DFA4FCF0A893C7C9DC5ADABABB04084A0504CED0FE06CF25B8C36ADDC1F5451527B117A97425276A\"><Competence>Langue française à l'oral et à l'écrit</Competence><Intitule>Résumer un texte</Intitule><NiveauDAcquisition><Genre>2</Genre><Libelle>Acquis</Libelle></NiveauDAcquisition><Date>2016-09-21</Date></Item><Item page=\"FC560506B53C466323C3BB6495BA0C3DD788475225004AE89B4B662475B2F533614EF0A1574E1DA7DFA4FCF0A893C7C9DC5ADABABB04084A0504CED0FE06CF25B8C36ADDC1F5451527B117A97425276A\"><Competence>Langue française à l'oral et à l'écrit</Competence><Intitule>Adapter le propos au destinataire et à l’effet recherché</Intitule><NiveauDAcquisition><Genre>2</Genre><Libelle>Acquis</Libelle></NiveauDAcquisition><Date>2016-09-21</Date></Item><Item page=\"FC560506B53C466323C3BB6495BA0C3DD788475225004AE89B4B662475B2F533614EF0A1574E1DA7DFA4FCF0A893C7C9DC5ADABABB04084A0504CED0FE06CF25B8C36ADDC1F5451527B117A97425276A\"><Competence>Langue française à l'oral et à l'écrit</Competence><Intitule>Utiliser les principales règles d’orthographe lexicale et grammaticale</Intitule><NiveauDAcquisition><Genre>2</Genre><Libelle>Acquis</Libelle></NiveauDAcquisition><Date>2016-09-21</Date></Item><Item page=\"FC560506B53C466323C3BB6495BA0C3DD788475225004AE89B4B662475B2F533614EF0A1574E1DA7DFA4FCF0A893C7C9DC5ADABABB04084A0504CED0FE06CF25B8C36ADDC1F5451527B117A97425276A\"><Competence>Langue française à l'oral et à l'écrit</Competence><Intitule>Rédiger un texte bref, cohérent, construit en paragraphes, correctement ponctué, en respectant des consignes imposées : récit, description, explication, texte argumentatif, compte rendu, écrits courants (lettres, …)</Intitule><NiveauDAcquisition><Genre>2</Genre><Libelle>Acquis</Libelle></NiveauDAcquisition><Date>2016-09-21</Date></Item><Item page=\"FC560506B53C466323C3BB6495BA0C3DD788475225004AE89B4B662475B2F533614EF0A1574E1DA7DFA4FCF0A893C7C9DC5ADABABB04084A0504CED0FE06CF25B8C36ADDC1F5451527B117A97425276A\"><Competence>Langue française à l'oral et à l'écrit</Competence><Intitule>Répondre à une question par une phrase complète</Intitule><NiveauDAcquisition><Genre>2</Genre><Libelle>Acquis</Libelle></NiveauDAcquisition><Date>2016-09-21</Date></Item></PageCompetences><PageCahierDeTextes><Titre>Cahier de textes</Titre></PageCahierDeTextes><PageVieScolaire><Titre>Vie scolaire</Titre><Absence page=\"914686157E0EC40CF0E0E5F762886F121D1E004C8F652CBDA731EEB8BD00ED2D73787C8D4D7E599A35A8B1A97BFE8E51587812524363C51E86538C2E7DB934C6\"><DateDebut>2016-09-21T08:00:00</DateDebut><DateFin>2016-09-21T09:00:00</DateFin><EstOuverte>false</EstOuverte><Justifie>false</Justifie><Motif></Motif></Absence><Absence page=\"914686157E0EC40CF0E0E5F762886F121D1E004C8F652CBDA731EEB8BD00ED2D73787C8D4D7E599A35A8B1A97BFE8E51587812524363C51E86538C2E7DB934C6\"><DateDebut>2016-09-21T08:00:00</DateDebut><DateFin>2016-09-21T09:00:00</DateFin><EstOuverte>false</EstOuverte><Justifie>true</Justifie><Motif></Motif></Absence><Absence page=\"914686157E0EC40CF0E0E5F762886F121D1E004C8F652CBDA731EEB8BD00ED2D73787C8D4D7E599A35A8B1A97BFE8E51587812524363C51E86538C2E7DB934C6\"><DateDebut>2016-09-22T08:00:00</DateDebut><DateFin></DateFin><EstOuverte>true</EstOuverte><Justifie>false</Justifie><Motif></Motif></Absence><Retard page=\"914686157E0EC40CF0E0E5F762886F121D1E004C8F652CBDA731EEB8BD00ED2D73787C8D4D7E599A35A8B1A97BFE8E51587812524363C51E86538C2E7DB934C6\"><Date>2016-09-23T08:00:00</Date><Justifie>true</Justifie><Motif></Motif></Retard><Retard page=\"914686157E0EC40CF0E0E5F762886F121D1E004C8F652CBDA731EEB8BD00ED2D73787C8D4D7E599A35A8B1A97BFE8E51587812524363C51E86538C2E7DB934C6\"><Date>2016-09-24T08:00:00</Date><Justifie>false</Justifie><Motif></Motif></Retard></PageVieScolaire></Eleve><PageMessagerie><Titre>Messagerie</Titre><Discussions page=\"81C70AC5418CE75797C2C7B44181715FA2CA23E7B1634350133911009499746D\"><NombreMessagesNonLus>0</NombreMessagesNonLus></Discussions><Informations page=\"62962842B1203FD963629E4DC8294206CFC0BCED2CDD00E466FC2436F64DBC81\"><NombreInformationsNonLus>0</NombreInformationsNonLus></Informations></PageMessagerie></Parent>\r\n",
                    "address" : "https://WSEducation.index-education.net/pronote"                    
                }];
                */
                throw "carnet-de-bord.widget.pronote.access.error";
            }
            if( !angular.isArray(structures) ) {
                throw "carnet-de-bord.widget.nodata";
            }
			ctrl.structures = structures;
			ctrl.eleves = [];
            let firstEleve:boolean = true;
			structures.forEach( structure => {
				ctrl.structureAddress = structure.address;
				ctrl.structureId = structure.structureId;
				var xmlDocument = $.parseXML(structure.xmlResponse);
				var $xml = $(xmlDocument);
				ctrl.parentTag = $xml.find('Parent');
				ctrl.eleves = ctrl.eleves.concat($.makeArray($xml.find('Eleve')));
				//console.log(widget.eleves);
				if( firstEleve && ctrl.eleves.length > 0 ){
					ctrl.getEleve(0);
                    firstEleve = false;
				}
			});
            scope.$apply();
		})
		.catch( (e) => {
            // FIXME : format of error messages ?
            if( typeof e === "string" ) {
                ctrl.errorMsg = {error:e};
            } else {
                ctrl.errorMsg = JSON.parse(http().latestResponse.statusText);
            }
		});		
	}
}

/** The carnet-de-bord widget.
 *
 * Usage:
 *      &lt;ode-carnet-de-bord></ode-carnet-de-bord&gt;
 */
function DirectiveFactory() {
	return new Directive();
}

// Preload translations
notif().onLangReady().promise.then( lang => {
	switch( lang ) {
		default:	conf().Platform.idiom.addKeys( require('./i18n/fr.json') ); break;
	}
});

// THIS ANGULAR MODULE WILL BE DYNAMICALLY ADDED TO THE APPLICATION.
// RESPECT THE NAMING CONVENTION BY EXPORTING THE MODULE NAME :
export const odeModuleName = "odeCarnetDeBordModule";
angular.module( odeModuleName, []).directive( "odeCarnetDeBord", DirectiveFactory );
