import { IAttributes, IController, IDirective, IScope } from "angular";
import { NgHelperService, TrackedAction } from "../../..";
import { VideoEventTrackerService, VideoUploadService } from "../../../services";
import { conf, deviceType, IAnyRecorder, RecorderState, session } from "../../../utils";
import { IObjectGuardDelegate } from "../../../utils/navigation-guard";
import { audio_recorder } from "../../../utils/recorder-audio";
import { VideoRecorder } from "../../../utils/recorder-video";

type RecorderType = "audio" | "video" | "none";

class VideoRecordGuardModel implements IObjectGuardDelegate{
    hasRecorded = false;
    guardObjectIsDirty(): boolean{
        return this.hasRecorded;
    }
    guardObjectReset(): void{
        this.hasRecorded = false;
    }
}

/* Controller for the directive */
export class Controller implements IController {
    private _recorder:IAnyRecorder = this.setRecorder( "audio" );    // Defaults to audio recorder
    public isAudioCompatible:boolean = audio_recorder.isCompatible();
    public isVideoCompatible:boolean = VideoRecorder.isCompatible() && session().hasWorkflow("com.opendigitaleducation.video.controllers.VideoController|capture");

    // @ts-ignore the following is set in the AngularJS link method
    public videoFactory: ()=>HTMLMediaElement;
    // @ts-ignore the following is set in the AngularJS link method
    public videoDurationHandler: (event: Event)=>void;
    // @ts-ignore the following is set in the AngularJS link method
    public recorderStatus: (status:RecorderState)=>void;

    setRecorder( type:RecorderType ):IAnyRecorder {
        if( type==="audio" ) {
            this._recorder = audio_recorder;
        } else {
            this._recorder = new VideoRecorder( 
                this.videoFactory, 
                this.videoDurationHandler,
                this.videoUploadService,
                this.videoEventTrackerService,
                this.selectedVid
            );
        }
        this._recorder.status( this.recorderStatus );
        return this._recorder;
    }

    // Utility accessors for simpler template reading.
    get recorder():IAnyRecorder {
        return this._recorder;
    }
    get hasPermission()     { return this.recorder.permission === 'granted' };

    get isIdle()            { return !this.recorder || this.recorder.state === 'idle'; }
    get isPreparing()       { return this.recorder.state === 'preparing'; }
    get isRecording()       { return this.recorder.state === 'recording'; }
    get isSuspended()       { return this.recorder.state === 'suspended'; }
    get isPaused()          { return this.recorder.state === 'paused'; }
    get isPlaying()         { return this.recorder.state === 'playing'; }
    get isStopped()         { return this.recorder.state === 'stopped'; }
    get isEncoding()        { return this.recorder.state === 'encoding'; }
    get isUploading()       { return this.recorder.state === 'uploading'; }

    get showMenu()          { return this.isIdle || this.isStopped || !this.hasPermission; }
    get showRecorder()      { return this.hasPermission }

    get showActionButtons() { return this.recorder && this.recorder.elapsedTime > 0 && !this.isStopped; }

    get isAudio():boolean   { return this._recorder === audio_recorder; }
    get isVideo():boolean   { return this._recorder !== audio_recorder; }

    // Video-specific members
    videoInputDevices?: MediaDeviceInfo[];
    selectedVid?: MediaDeviceInfo;

    // Disabled State
    disabledButtons:boolean = true;
    displaySavedMessage:boolean = false;
    selectedRecorder:string = "none";
    recordIsSaved:boolean = false;



    /** Max video recording duration, in ms. */
    get recordMaxTime():number {
        return this.videoUploadService.maxDuration * 60 * 1000;
    }

    switchRecorder(type: string) {
        if (type === "audio") {
            this.selectedRecorder = "audio";
            this.setRecorder( "audio" );
        } else {
            this.selectedRecorder = "video";
            this.msToTime( 0 );
            this.setRecorder( "video" );
            this.recorder?.prepare?.();
        }
    }

    switchAudioRecord() {
        this.setRecorder( "audio" );
        if( this.isRecording ) {
            this.disabledButtons = false;
            this.recordIsSaved= false;
            this.recorder?.suspend();
        } else {
            this.recorder?.record();
            
            // Track this event.
            const btn = document.getElementById("btnAudioRecorder");
            if( btn ) {
                this.trackEvent(btn, { detail:{'open':'audio'} });
            }
        }
    }

    switchVideoRecord() {
        if( this.isRecording ) {
            this.disabledButtons = false;
            this.recorder?.suspend();
        } else {
            this.recorder?.record();
    
            // Track this event.
            const btn = document.getElementById("btnVideoRecorder");
            if( btn ) {
                this.trackEvent(btn, { detail:{'open':'video'} });
            }
        }

        if (this.isPaused) {
            this.restart();
        }
    }

    // Give an opportunity to track some events from outside of this component.
    private trackEvent(e:HTMLElement, p:CustomEventInit<TrackedAction>) {
        // Allow events to bubble up.
        if(typeof p.bubbles === "undefined") p.bubbles = true;

        let event = null;
        if( p && (p.detail?.open==='audio' || p.detail?.open==='video') ) {
            event = new CustomEvent( 'ode-recorder', p );
        }
        if( event && e ) {
            e.dispatchEvent(event);
        }
    }
    
    /** Format a duration in milliseconds as a human-readable string. */
    msToTime = (s: number): string => {
        s /= 1000;
        let minutes = parseInt(''+(s / 60));
        let seconds = parseInt(''+(s % 60));
        return minutes +':'+ this.pad2(seconds);
    }

    private pad2(val:number):string {
        return ((val < 10) ? '0':'') + val;
    }

    /** Format elapsedTime (in seconds) to a human-readable string. */
    time() {
        if( !this.recorder ) return "";
        return this.msToTime( this.recorder.elapsedTime*1000 );
    }

    switchPlay() {
        if( this.recorder ) {
            if( this.isPlaying ) {
                this.recorder.pause();
            } else {
                this.recorder.play();
            }
        }
    }

    async switchVideo(id:string) {
        const rec = this.recorder as VideoRecorder;
        await rec.switchCamera(id);
        await rec.record();
    }

    saveRecord() {
        this.recorder?.save();
        this.recordIsSaved= true;
    };

    redo() {
        this.recorder?.flush();
        this.recorder?.record();
    }

    restart() {
        const videoPlayer = document.getElementById("recorderWidgetVideoPlayer");
        videoPlayer?.removeChild(videoPlayer.firstElementChild as HTMLElement)

        this.recorder?.flush();
        this.switchRecorder("video");
        
        setTimeout( () => {
            this.recorder?.record();
        }, 100 );
    }

    getSaveBtnClass() {
        if( this.isEncoding || this.isUploading ) {
            return 'fas fa-spinner fa-spin';
        } else {
            return 'fas fa-save';
        }
    }

    getSavedStatus(status:string):boolean {
        if (status === 'saved') {
            this.displaySavedMessage = true;
            return true;
        } else {
            this.displaySavedMessage = false;
            return false;
        }
    }
    
    clean() {
        this.displaySavedMessage = false;
        this.recordIsSaved= false;
        this.disabledButtons = true;
        this.recorder?.flush(); // Revert to idle state
        this.selectedRecorder = "none";
    }

    constructor(
        public videoUploadService: VideoUploadService,
        public videoEventTrackerService: VideoEventTrackerService
    ){}
}

interface Scope extends IScope {
    format?:string;
    onUpload?:Function;
    recordGuard?: VideoRecordGuardModel;
}

/* Directive */
class Directive implements IDirective<Scope,JQLite,IAttributes,IController[]> {
    constructor(
        private helperSvc:NgHelperService
    ) {}
    restrict = 'EA';
	template = require("./recorder.directive.html").default;
    scope = {
        format: '@?',
        onUpload: '&?'
    };
	controller = ["odeVideoUploadService", "odeVideoEventTrackerService", Controller];
	controllerAs = 'ctrl';
	require = ['odeRecorder'];

    /**
     * Link method for the directive.
     * @see https://code.angularjs.org/1.7.9/docs/api/ng/service/$compile
     * @param $scope scope
     * @param $elem jqLite-wrapped element that this directive matches.
     * @param $attr hash object with key-value pairs of normalized attribute names and their corresponding attribute values.
     * @param controllers Array of "require"d controllers : [ngModelCtrl]
     */
    link(scope:Scope, elem:JQLite, attr:IAttributes, controllers?:IController[]): void {
        const ctrl:Controller|null = controllers ? controllers[0] as Controller : null;
        if( !ctrl || ! ctrl.recorder ) {
            return;
        }

        scope.recordGuard = new VideoRecordGuardModel();

        // If video is available, initialize it.
        if( ctrl.isVideoCompatible ) {
            // Detect available video capture devices
            const lang = conf().Platform.idiom;
            const backCameraChoice = {deviceId:"environment", label: lang.translate("video.back.camera"), groupId:'', kind:'videoinput'} as MediaDeviceInfo;
            const frontCameraChoice = {deviceId:"user", label: lang.translate("video.front.camera"), groupId:'', kind:'videoinput'} as MediaDeviceInfo;

            ctrl.videoUploadService.initialize()
            // First call to the API, so that the operating system ask for user's consent if needed, then enumerate video stream devices,
            .then( () => {
                return navigator.mediaDevices.enumerateDevices();
            })
            // ...Filter on video inputs only,
            .then( devices => { 
                return devices.filter( device => { 
                    //console.debug( JSON.stringify(device) );
                    return device.kind === "videoinput";
                })
            })
            // ...Assemble the final cameras list,
            .then( videoinputs => {
                switch( deviceType ) {
                    case "Mobile":
                    case "Tablet":
                        if( videoinputs && videoinputs.length>1 ) {
                            // This mobile/tablet has more than 1 camera 
                            // => we assume at least one is on the front (user) and one is on the back (environment),
                            //    and let the system choose the best for us.
                            ctrl.videoInputDevices = [backCameraChoice, frontCameraChoice];
                        } else {
                            // Else we let the system use the only one that exists (or none)
                            ctrl.videoInputDevices = [backCameraChoice];
                        }
                        break;
                    default: // "Desktop" or other future types => list all cameras without distinction.
                        ctrl.videoInputDevices = videoinputs;
                        break;
                }
            })
            .catch( () => {
                console.error('[VideoController.videoInputDevices] An error occured while detecting cameras.');
                ctrl.videoInputDevices = [backCameraChoice];
            })
            .finally( () => {
                if( ctrl.videoInputDevices )
                    ctrl.selectedVid = ctrl.videoInputDevices[0];
                this.helperSvc.safeApply( scope );
            });
        }

        ctrl.videoFactory = () => {
            const videoElem = document.createElement("video");
            videoElem.setAttribute( "style", "max-width:100%" );
            videoElem.setAttribute( "playsinline", "true" );
            videoElem.setAttribute( "autoplay", "" );
            videoElem.setAttribute( "muted", "" );
            // Wait before inserting this new element in the DOM tree.
            setTimeout( () => {
                document.getElementById("recorderWidgetVideoPlayer")?.appendChild( videoElem );
            }, 100 );

            return videoElem;
        }

        const timestamps = {
            startedAt: 0,
            endedAt: 0
        }

        // Video duration is measured in milliseconds
        ctrl.videoDurationHandler = (event:Event) => {
            if( timestamps.startedAt===0 ) {
                timestamps.startedAt = event.timeStamp;
            }
            if( ctrl.isRecording ) {
                timestamps.endedAt = event.timeStamp;
                ctrl.recorder.elapsedTime = timestamps.endedAt - timestamps.startedAt;

                if( ctrl.recorder.elapsedTime >= ctrl.recordMaxTime ) {
                    //ctrl.switchVideoRecord();
                    ctrl.disabledButtons = false;
                    ctrl.recorder?.suspend();
                }
            }
            this.helperSvc.safeApply( scope );
        }

        ctrl.recorderStatus = (status:RecorderState|'saved') => {
            switch( status ) {
                case 'recording' : {
                    timestamps.endedAt = timestamps.startedAt = 0;

                    if( scope.recordGuard )
                        scope.recordGuard.hasRecorded = true;
                }
                break;
                case 'saved' : {
                    if( scope.recordGuard )
                        scope.recordGuard.guardObjectReset();
                        
                    scope.onUpload && scope.onUpload();
                    ctrl.getSavedStatus(status);
                    // ctrl.recorder.flush();
                    // ctrl.setRecorder( "audio" ); // Set audio recorder so that video recorder will create its video tag again
                }
                case 'idle' : {
                    if( scope.recordGuard )
                        scope.recordGuard.guardObjectReset();
                }
                default: 
                    break;
            }
            this.helperSvc.safeApply( scope );   // Force reevaluation of the recorder's status
        }
    }
}

/**
 * The ode-recorder directive.
 *
 * Usage:
 *   &lt;ode-recorder ></ode-recorder&gt;
 */
export function DirectiveFactory(helperSvc:NgHelperService) {
	return new Directive(helperSvc);
}
DirectiveFactory.$inject = ["odeNgHelperService"];