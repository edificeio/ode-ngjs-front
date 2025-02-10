import { IAnyRecorder, RecorderPermission, RecorderState } from "./interfaces";
import { conf, session } from "./shorts";
import { L10n } from "./localization";
import { notify, VideoEventTrackerService, VideoUploadService } from "../services";
import { devices } from "./browser-info";

//declare var navigator:Navigator;

type MediaRecorderImpl = {
    start(time: number): void;
    stop(): void;
    pause(): void;
    onstop(): void;
    ondataavailable(event: any): void;
    resume(): void;
    requestData(): void;
    readonly state: string;
}
declare var MediaRecorder: {
    new(stream: MediaStream, options: { mimeType: string }): MediaRecorderImpl
    isTypeSupported: (mime: string) => boolean
};
type FacingMode = 'user' | 'environment';

export class VideoRecorder implements IAnyRecorder {
    private stream?: MediaStream;
    private gumVideo?: HTMLMediaElement;
    private mediaRecorder?: MediaRecorderImpl;
    private recordMimeType?: string;
    private recorded?: Blob[];
    private _status: RecorderState = 'preparing';
    public constraints: MediaStreamConstraints = {
        audio: true,
        video: {
            width: 640,
            height: 360,
            facingMode: 'environment'
        }
    };
    title: string = "";
    get permission():RecorderPermission {
        return session().hasWorkflow("com.opendigitaleducation.video.controllers.VideoController|capture") ? 'granted' : 'denied';
    }
    elapsedTime:number = 0; // in ms
    followers:Array<(state:RecorderState)=>void> = [];

    constructor(
        private videoFactory: () => HTMLMediaElement, 
        private handleDuration: (event: Event) => void,
        private uploader: VideoUploadService,
        private tracker: VideoEventTrackerService,
        private defaultDevice?: MediaDeviceInfo
    ) {
        defaultDevice && this.setCamera( defaultDevice.deviceId );
    }

    public get state() {
        return this._status;
    }

    status( callback:(state:RecorderState)=>void ):void {
        this.followers.push(callback);
    }

    private updateStatus(status:RecorderState, data?:any) {
        this._status = status;
		try {
			this.followers.forEach( follower => {
				if (typeof follower === 'function') {
					follower(status);
				}
			});
		} catch {
			// void: just don't stop the recorder process when a follower throws an error.
		}
	}

    public static isCompatible() {
        if( typeof navigator.mediaDevices?.getSupportedConstraints==='function' ) {
            const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
            return (supportedConstraints['deviceId'] && !(VideoRecorder.isIncompatibleDevice() || VideoRecorder.isIncompatibleBrowser())) || false; // At least 1 device should exist.
        }
        return false;
    }

    public static isIncompatibleDevice() {
        const os = devices.getOSInfo();
        /*
        console.log( "Actual OS="+ os.name +" version "+ os.version );
        let ios1 = devices.getOSInfo("Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Mobile/15E148 Safari/604.1");
        console.log( "iOS1 OS="+ ios1.name +" version "+ ios1.version );
        let ios2 = devices.getOSInfo("Mozilla/5.0 (iPad; CPU OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Mobile/15E148 Safari/604.1");
        console.log( "iOS2 OS="+ ios2.name +" version "+ ios2.version );
        let ios3 = devices.getOSInfo("Mozilla/5.0 (iPad; CPU OS 14_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1");
        console.log( "iOS3 OS="+ ios3.name +" version "+ ios3.version );
        */
        // iOS 14.3+ has built-in MediaRecorder capabilities.
        if( os && os.name==="iOS" && os.version && os.version>="14.3" )
            return false;

        return devices.isIphone() || devices.isIpad() || devices.isIpod();
    }

    public static isIncompatibleBrowser() {
        if(!(window as any).MediaRecorder){
            return true;
        }
        // Check against supported browsers.
        const browser = devices.getBrowserInfo();
        return ['Firefox', 'Chrome', 'Edge', 'Opera', 'Safari', 'CriOS', 'FxiOS'].findIndex( (item) => browser.name==item ) === -1;
    }

    suspend():Promise<void> {
        return this.stopRecording( true );
    }

    flush():void {
        this.stopStreaming();
        this.title = "";
    }

    save():void {
        if (!this.title) {
            this.title = "video-" + this.generateVideoId();
        }
        this.updateStatus( 'encoding' );
        // Use IVideoUploader to manage video uploading and encoding.
        this.uploader.upload( this.getBuffer(), this.title, true, Math.round(this.elapsedTime) )
        .then( response => {
            if( response.state==="succeed" ) {
                this.tracker.generateSaveEvent( this.elapsedTime, response );
                this.updateStatus( 'saved' );
                this.updateStatus( 'suspended' );
            } else if( response.state==="error" ) {
                this.updateStatus( 'suspended' );
                response.code && notify.error( response.code );
            }
        })
        .catch( e => {
            this.updateStatus( 'suspended' );
            notify.error( "video.file.error" );
        });
    }

    private bindPlayEvents() {
        if (!this.gumVideo) return;
        this.unbindPlayEvents();
        this.gumVideo.addEventListener('ended', this.videoEndedHandler, false);
    }
    private unbindPlayEvents() {
        if (!this.gumVideo) return;
        this.gumVideo.removeEventListener('ended', this.videoEndedHandler, false);
    }
    private videoEndedHandler = (e: Event) => {
        if (!this.gumVideo) return;
        this.pause();
        this.gumVideo.currentTime = 0; // rewind to start !
    }
    private unbindRecordEvent(){
        if (!this.gumVideo) return;
        this.gumVideo.removeEventListener('timeupdate', this.handleDuration);
    }
    private bindRecordEvent(){
        if (!this.gumVideo) return;
        this.unbindRecordEvent();
        this.gumVideo.addEventListener('timeupdate', this.handleDuration);
    }

    private setCamera( id:FacingMode|ConstrainDOMString ) {
        if( id==='environment' || id==='user' ) {
            delete (this.constraints.video as MediaTrackConstraints).deviceId;
            (this.constraints.video as MediaTrackConstraints).facingMode = id;
        } else if( id ) {
            delete (this.constraints.video as MediaTrackConstraints).facingMode;
            (this.constraints.video as MediaTrackConstraints).deviceId = id;
        }
    }

    switchCamera( id:FacingMode|ConstrainDOMString ) {
        this.setCamera( id );
        if (this.stream) {
            if( this.mediaRecorder?.state==="active" ) {
                this.mediaRecorder?.requestData(); // get last recorded data slice
                this.mediaRecorder?.stop();
            }
            this.turnOffCamera();
            delete this.stream;
        }
        return this.startStreaming();
    }

    play() {
        if (!this.gumVideo) {
            console.warn('[VideoRecorder.play] stream not init');
            return;
        }
        this.preparePlay();
        this.gumVideo.play();
        this.updateStatus( 'playing' );
    }

    private preparePlay() {
        if (this._status != 'paused') {
            this.unbindRecordEvent();
            this.bindPlayEvents();
            let buffer = this.getBuffer();
            //console.log('[VideoRecorder.preparePlay] buffer size: ', buffer.size)
            if( this.gumVideo ) {
                this.gumVideo.muted = false;
                this.gumVideo.srcObject = null;
                this.gumVideo.autoplay = false;
                this.gumVideo.src = window.URL.createObjectURL(buffer);
                //this.gumVideo.controls = true;
            }
            this.updateStatus( 'paused' );
        }
    }

    pause() {
        if (!this.gumVideo) {
            console.warn('[VideoRecorder.play] stream not init');
            return;
        }
        this.gumVideo.pause();
        this.updateStatus( 'paused' );
    }

    private prepareRecord() {
        if (!this.stream) {
            console.warn('[VideoRecorder.prepareRecord] stream not init')
            return;
        }
        if (this._status != 'recording') {
            if( this.gumVideo ) {
                this.gumVideo.muted = true;
                this.gumVideo.volume = 1;
                this.gumVideo.autoplay = true;
                if( this.gumVideo.src ) {
                    window.URL.revokeObjectURL( this.gumVideo.src );
                }
                this.gumVideo.srcObject = this.stream;
                this.gumVideo.controls = false;
            }
            this.unbindPlayEvents();
            this.bindRecordEvent();
            this.updateStatus( 'recording' );
        }
    }
    
    private stopStreaming() {
        if (this.gumVideo) {
            this.unbindPlayEvents();
            this.unbindRecordEvent();
        }
        if (this.stream) {
            try {
                this.stopRecording(false);
            } catch (e) { }
            this.turnOffCamera();
            delete this.stream;
        }
        if(this.gumVideo) delete this.gumVideo;
        this.updateStatus( 'idle' );
    }

    async startStreaming(notAllowedCb?: () => void) {
        try {
            if (this.stream) return;
            if (!this.gumVideo) {
                this.gumVideo = this.videoFactory();
            }
            const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
            this.stream = stream;
            this.prepareRecord();
            //console.log('[VideoRecorder.startStreaming] VIDEO STREAM STARTED', this.gumVideo);
        } catch (e:any) {
            if( e ) {
                // Case when a cam is not authorized/found/matching/available
                // See https://developer.mozilla.org/fr/docs/Web/API/MediaDevices/getUserMedia#erreurs
                if ( e.name == 'NotAllowedError' 
//                    || e.name == 'NotFoundError'
//                    || e.name == 'OverConstrainedError'
//                    || e.name == 'TypeError'
                    ) {
                    if (notAllowedCb) {
                        return notAllowedCb();
                    }
                } else if (e.name == 'NotReadableError') {
                    try{
                        //try without constraint
                        const stream = await navigator.mediaDevices.getUserMedia({});
                        if (!this.gumVideo) {
                            this.gumVideo = this.videoFactory();
                        }
                        this.stream = stream;
                        this.prepareRecord();
                    }catch(e){
                        alert(e);
                    }
                    return;
                }
                alert(e);
            }
        }
    }
    public generateVideoId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // private handleDataAvailable(event) {
    //     if (event.data && event.data.size > 0) {
    //         this.recorded.push(event.data);
    //     }
    // }
    public resume() {
        this.prepareRecord();
        this.mediaRecorder?.resume();
    }
    public async canStartRecording() {
        const space = await session().latestQuotaAndUsage;
        return space.quota > space.storage;
    }
    private findBestSupportedMimeType():string {
        if (MediaRecorder.isTypeSupported) { // SAFARI TEST
            return [
                 'video/webm;codecs=vp9'
                ,'video/mp4; codecs="avc1.424028, mp4a.40.2"'
                ,'video/webm;codecs=vp8,opus'
                ,'video/webm'
            ].find( type => {
                if (!MediaRecorder.isTypeSupported(type)) {
                    console.error(`[VideoRecorder.startRecording] ${type} is not Supported`);
                    return false;
                }
                return true;
            }) || 'video/ogg';
        } else {
            return 'video/webm;codecs=vp8,opus';
        }
    }
    async prepare() {
        if (!this.gumVideo) {
            this.gumVideo = this.videoFactory();
        }
        const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
        this.stream = stream;
        if (!this.stream) {
            console.warn('[VideoRecorder.prepareRecord] stream not init')
            return;
        }
        if (this._status !== 'recording') {
            if( this.gumVideo ) {
                this.gumVideo.muted = true;
                this.gumVideo.volume = 1;
                this.gumVideo.autoplay = true;
                if( this.gumVideo.src ) {
                    window.URL.revokeObjectURL( this.gumVideo.src );
                }
                this.gumVideo.srcObject = this.stream;
                this.gumVideo.controls = false;
            }
        }
    }
    async record() {
        await this.startStreaming();
        if (!this.stream) return;
        const lang = conf().Platform.idiom;
        if(!this.title){
            this.title = L10n.moment().format("YYYY-MM-DD HH[h]mm") + " " +
            lang.translate("recorder.filename.video");
        }
        this.prepareRecord();
        this.recorded = new Array();
        const options = { mimeType: this.findBestSupportedMimeType() };
        try {
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            // Memorize which MIME type is being recorded.
            this.recordMimeType = options.mimeType;
        } catch (e) {
            console.error('[VideoRecorder.startRecording] Exception while creating MediaRecorder:', e);
            return;
        }

        //console.log('[VideoRecorder.startRecording] Created MediaRecorder', this.mediaRecorder, 'with options', options);
        this.mediaRecorder.onstop = () => {
            //console.log('[VideoRecorder.onstop] Recorder stopped: ', event);
        };
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                this.recorded?.push(event.data);
            }
        };
        this.mediaRecorder.start(1000); // collect 1000ms of data
    }

    public stopRecording(preparePlay: boolean):Promise<void> {
        if( this.mediaRecorder?.state==="recording" ) {
            this.mediaRecorder?.requestData(); // get last recorded data slice
            this.mediaRecorder?.stop();
        }
        return new Promise( (resolve) => {
            if (preparePlay) {
                setTimeout(() => {this.preparePlay(); resolve()}, 0);
            } else {
                this.updateStatus( 'stopped' );
                resolve();
            }
        });
    }

    public turnOffCamera() {
        if (!this.stream) return;
        const tracks = this.stream.getTracks();
        for (const track of tracks) {
            try {
                track.stop();
            } catch (e) { }
        }
    }

    public getBuffer() {
        return new Blob(this.recorded, { type: this.recordMimeType /*'video/webm'*/ });
    }

    public clearBuffer(prepareRecord: boolean) {
        delete this.recorded;
        prepareRecord && this.prepareRecord();
    }
}
