import { L10n, conf } from ".";
import { notify } from "../services/notify.service";
import $ from "jquery"; // FIXME : remove jQuery dependency
import { RecorderPermission, RecorderState } from "./interfaces";

declare const Zlib: any;

let _zlib: any = null;
async function getZlib() {
  if (!_zlib) {
    _zlib = await $.ajax("/infra/public/js/zlib.min.js", {
      dataType: "script",
    });
    //_zlib = await http().getScript('/infra/public/js/zlib.min.js');
    //console.log(Zlib);
  }
  return _zlib;
}

// console.log("Use new recorder module");

const resolvedNavigatorModules = {
  getUserMediaLegacy:
    (navigator as any).getUserMedia ||
    (navigator as any).webkitGetUserMedia ||
    (navigator as any).mozGetUserMedia ||
    (navigator as any).msGetUserMedia,
  getUserMedia: navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
  AudioContext:
    (window as any).AudioContext || (window as any).webkitAudioContext,
};

/**
 * Utility class to record audio files, with no dependencies on angularJS.
 */
export var audio_recorder = (function () {
  var lang = conf().Platform.idiom;
  var context: AudioContext,
    ws: WebSocket | null = null,
    gainNode: any,
    recorder,
    compress = true,
    player = new Audio();
  var leftChannel: any[] = [],
    rightChannel: any[] = [];

  var bufferSize = 4096,
    loaded = false,
    recordingLength = 0,
    lastIndex = 0,
    encoder = new Worker("/infra/public/js/audioEncoder.js"),
    followers: Function[] = [];

  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  function getUrl(sampleRate: number) {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    let host: string = window.location.host;
    if (window.location.host === "localhost:8090") {
      host = "localhost:6502";
    }
    const base = protocol + "://" + host;
    return `${base}/audio/${uuid()}?sampleRate=${sampleRate}`;
  }

  function sendWavChunk() {
    var index = rightChannel.length;
    if (!(index > lastIndex)) return;
    encoder.postMessage(["init", context.sampleRate]);
    encoder.postMessage([
      "chunk",
      leftChannel.slice(lastIndex, index),
      rightChannel.slice(lastIndex, index),
      (index - lastIndex) * bufferSize,
    ]);
    encoder.onmessage = function (e) {
      if (!compress) {
        ws && ws.send(e.data);
        return;
      }
      const initialTime = parseInt("" + performance.now());
      var deflate = new Zlib.Deflate(e.data);
      ws && ws.send(deflate.compress());
      const endTime = parseInt("" + performance.now());
      if (endTime - initialTime > 50) {
        compress = false;
        ws && ws.send("rawdata");
      }
    };
    lastIndex = index;
  }

  function closeWs() {
    if (ws) {
      if (ws.readyState === 1) {
        ws.close();
      }
    }
    clearWs();
  }

  function clearWs() {
    ws = null;
    leftChannel = [];
    rightChannel = [];
    lastIndex = 0;
  }

  function notifyFollowers(status: any, data?: any) {
    try {
      followers.forEach(function (follower) {
        if (typeof follower === "function") {
          follower(status, data);
        }
      });
    } catch {
      // void: just don't stop the recorder process when a follower throws an error.
    }
  }

  return {
    elapsedTime: 0,
    loadComponents: function () {
      if (!this.title) {
        this.title =
          L10n.moment().format("YYYY-MM-DD HH[h]mm") + " " +
          lang.translate("recorder.filename.audio");
      }
      loaded = true;
      
      const handleMediaStream = (mediaStream: MediaStream) => {
        this.permission = "granted";
        context = new resolvedNavigatorModules.AudioContext();
        encoder.postMessage(["init", context.sampleRate]);
        var audioInput = context.createMediaStreamSource(mediaStream);
        gainNode = context.createGain();
        audioInput.connect(gainNode);

        recorder = context.createScriptProcessor(bufferSize, 2, 2);
        recorder.onaudioprocess = (e: AudioProcessingEvent) => {
          if (this.state !== "recording") {
            return;
          }
          var left = new Float32Array(e.inputBuffer.getChannelData(0));
          leftChannel.push(left);
          var right = new Float32Array(e.inputBuffer.getChannelData(1));
          rightChannel.push(right);

          recordingLength += bufferSize;

          this.elapsedTime += e.inputBuffer.duration;

          sendWavChunk();

          notifyFollowers(this.state);
        };

        gainNode.connect(recorder);
        recorder.connect(context.destination);
      };

      if (resolvedNavigatorModules.getUserMedia !== undefined) {
        resolvedNavigatorModules.getUserMedia
          .call(navigator.mediaDevices, { audio: true })
          .then(handleMediaStream)
          .catch((err) => {
            if (err) {
              this.permission = "denied";
              console.log("err:", err);
            }
          });
      } else if (resolvedNavigatorModules.getUserMediaLegacy !== undefined) {
        // Legacy. Prevent crash in that motherfu**ing IE 💩
        resolvedNavigatorModules.getUserMediaLegacy(
          { audio: true },
          handleMediaStream,
          function (err: any) {
            console.log("err:", err);
          }
        );
      }
    },
    isCompatible: function () {
      return (
        resolvedNavigatorModules.AudioContext !== undefined &&
        (resolvedNavigatorModules.getUserMedia !== undefined ||
          resolvedNavigatorModules.getUserMediaLegacy !== undefined)
      );
    },
    stop: function () {
      if (ws) {
        ws.send("cancel");
      }
      this.state = "idle";
      player.pause();
      if (player.currentTime > 0) {
        player.currentTime = 0;
      }
      leftChannel = [];
      rightChannel = [];
      notifyFollowers(this.state);
    },
    flush: function () {
      this.title = "";
      this.stop();
      this.elapsedTime = 0;
      leftChannel = [];
      rightChannel = [];
      notifyFollowers(this.state);
    },
    record: async function () {
      player.pause();
      var that = this;
      if (that.state == "preparing") return;
      that.state = "preparing";
      await getZlib();
      if (ws) {
        that.state = "recording";
        notifyFollowers(that.state);
        if (!loaded) {
          that.loadComponents();
        }
      } else {
        ws = new WebSocket(
          getUrl(new resolvedNavigatorModules.AudioContext().sampleRate)
        );
        ws.onopen = function () {
          if (player.currentTime > 0) {
            player.currentTime = 0;
          }

          that.state = "recording";
          notifyFollowers(that.state);
          if (!compress) {
            ws && ws.send("rawdata");
          }
          if (!loaded) {
            that.loadComponents();
          }
        };
        ws.onerror = function (event: Event) {
          console.log(event);
          that.state = "stopped";
          notifyFollowers(that.state);
          closeWs();
          notify.error((event as ErrorEvent).error);
        };
        ws.onmessage = async (event) => {
					if (event.data && event.data.indexOf && typeof event.data.indexOf === 'function' && event.data.indexOf("error") !== -1) {
            console.log(event.data);
            closeWs();
            notify.error(event.data);
					} 
            else if (event.data && event.data.text && typeof event.data.text === 'function' && this.state === "encoding")
          {
            let data = JSON.parse(await event.data.text());
            if (data.status === "ok") {
							closeWs();
							// let docId = data.docId;
							notifyFollowers(`saved`);
							this.elapsedTime = 0;
						} else {
							console.log(event.data);
							closeWs();
							notify.error(event.data);
						}
          }
        };
        ws.onclose = function (event) {
          that.state = "stopped";
          that.elapsedTime = 0;
          notifyFollowers(that.state);
          clearWs();
        };
      }
    },
    suspend: function () {
      this.state = "suspended";
      player.pause();
      notifyFollowers(this.state);
      return Promise.resolve();
    },
    pause: function () {
      this.state = "paused";
      player.pause();
      notifyFollowers(this.state);
    },
    play: function () {
      this.pause();
      this.state = "playing";
      var encoder = new Worker("/infra/public/js/audioEncoder.js");
      encoder.postMessage(["init", context.sampleRate]);
      encoder.postMessage(["wav", rightChannel, leftChannel, recordingLength]);
      encoder.onmessage = function (e) {
        player.src = window.URL.createObjectURL(e.data);
        player.play();
      };
      notifyFollowers(this.state);
    },
    status: function (callback: Function) {
      followers.push(callback);
    },
    title: "",
    state: "idle" as RecorderState,
    permission: "idle" as RecorderPermission,
    save: function () {
      sendWavChunk();
      ws && ws.send("save-" + this.title);
      this.state = "encoding";
      notifyFollowers(this.state);
    },
    mute: function (mute: boolean) {
      if (mute) {
        gainNode.gain.value = 0;
      } else {
        gainNode.gain.value = 1;
      }
    },
  };
})();
