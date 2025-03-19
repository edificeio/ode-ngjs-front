import angular, { IAttributes, IController, IDirective, IScope } from "angular";
import { conf, http, notif } from "../../utils";
import { notify } from "../../services";

interface Student {
	id: number,
	fullName: string
}

interface ObservationCategory {
	id: number,
	name: string
}

/* Controller for the directive */
class Controller implements IController {
	formData: { [key: string]: string } = {};
	public observationCategories: ObservationCategory[] = [];
	public studentsList: Student[] = [];
	public showLightbox = false;


	startObservation() {
		if (this.formData.student_id) {
			this.showLightbox = true;
		}
	}

	async handleObservationSubmit() {
		const body = {
			data: {
				type: "observations",
				attributes: {
					...this.formData,
					"teacher_id": 1, // TODO: change when respone updated from ptit observatoire
					"date": new Date().toISOString().substring(0, 10),
				}
			}
		}

		await this.saveObservation(body)
	}

	async saveObservation(body: any): Promise<void> {
		try {
			await http().postJson("/appregistry/ptitObservatoire/observations", body)
			notify.success("ptitObservatoire.notify.save.success")
		} catch (error) {
			console.error("Error saving observation:", error);
			notify.error("ptitObservatoire.notify.save.error")
		}
	}
}

/* Directive */
class Directive implements IDirective<IScope, JQLite, IAttributes, IController[]> {
	restrict = 'E';
	template = require('./ptit-observatoire-widget.widget.html').default;
	scope = {};
	bindToController = true;
	controller = [Controller];
	controllerAs = 'ctrl';
	require = ['odePtitObservatoireWidget'];

	async link(scope: IScope, elem: JQLite, attrs: IAttributes, controllers?: IController[]) {
		const ctrl: Controller | null = controllers
			? (controllers[0] as Controller)
			: null;
		if (!ctrl) {
			return;
		}

		[ctrl.observationCategories, ctrl.studentsList] = await Promise.all([
			this.getObservationCategories(),
			this.getStudentsList(),
		]);

		scope.$applyAsync();
	}

	async getStudentsList(): Promise<Student[]> {
		try {
			const res = await http().get("/appregistry/ptitObservatoire/students");

			return res.map((
				student: { id: number, attributes: { full_name: string } }
			) => ({
				id: student.id,
				fullName: student.attributes.full_name
			}));
		} catch (e) {
			console.error("Error fetching students:", e);
			return [];
		}
	}

	async getObservationCategories(): Promise<ObservationCategory[]> {
		try {
			const res = await http().get("/appregistry/ptitObservatoire/observations/categories");
			return res.map((category: { id: number; attributes: { name: string } }) => ({
				id: category.id,
				name: category.attributes.name,
			}));
		} catch (e) {
			console.error("Error fetching categories:", e);
			return [];
		}
	}
}

/** The P'tit observatoire widget. */
function DirectiveFactory() {
	return new Directive();
}

// Preload translations
notif()
	.onLangReady()
	.promise.then((lang) => {
		switch (lang) {
			default:
				conf().Platform.idiom.addKeys(require("./i18n/fr.json"));
				break;
		}
	});

// THIS ANGULAR MODULE WILL BE DYNAMICALLY ADDED TO THE APPLICATION.
// RESPECT THE NAMING CONVENTION BY EXPORTING THE MODULE NAME :
export const odeModuleName = "odePtitObservatoireWidgetModule";
angular
	.module(odeModuleName, [])
	.directive("odePtitObservatoireWidget", DirectiveFactory);
