import {Injectable} from "@angular/core";
import {IGameDoc, StoreService} from "@core/store/store.service";
import {JbProfileService} from "@core/common/jb-profile.service";
import {AngularFireAuth} from "@angular/fire/auth";
import {AngularFirestore} from "@angular/fire/firestore";
import {distinctUntilChanged, pluck} from "rxjs/operators";
import {JbConfirmService, JbGrowlService} from "jb-ui-lib";
import {BehaviorSubject} from "rxjs";

/*** Player 1 calls player 2:
 - Both are idle: video.status = '';
 - Player 1 makes a call changing the ----> video.status = 'A-> ';
 - Player 2 detects that 1 is calling, and starts ringing. It changes the ----> video.status = 'A->B';
 - Player 2 answers the call, changing the ----> video.status = 'A>>B'.
 - ICE Candidate gathering process happens for Player 1
 - Player 1 detects that and the WebRTC process starts -----> video.offerSDP = 'xxxx'
 - ICE Candidate gathering process happens for Player 2
 - Player 2 detects the offer SDP, and generates answer ----> video.answerSDP = 'xxxx'
 - Once the WebRTC is ready (ontrack) the remote stream is displayed on the html.
 Player 1 detects it and updates the status ----> video.status = 'A==B';
 - Player 1 stops the call updating ----> video.status = '    ';
 - Player 2 detects it and stops the call too.
 */

/*** Player 1 calls, but player 2 rejects:
 - Both are idle: video.status = '';
 - Player 1 makes a call changing the ----> video.status = 'A-> ';
 - Player 2 detects that 1 is calling, and starts ringing. It changes the ----> video.status = 'A->B';
 - Player 2 rejects the call, changing the ----> video.status = '    '.
 - Player 1 detects that and stops the call
 */


@Injectable({ providedIn: 'root', })
export class VideoService {
  sub1; sub2; sub3;
  CONSTRAINTS = {
    audio: true,
    video: true,
  };
  PEER_CONFIG = { iceServers: [
    { urls: 'stun:stun.l.google.com:19302'  },
    { urls: 'stun:stun1.1.google.com:19302' },
    { urls: 'stun:stun2.1.google.com:19302' },
  ]};
  OFFER_OPTIONS = {
    iceRestart: true,
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  };
  RTCPeerConnection = window['RTCPeerConnection'] || window['mozRTCPeerConnection'] || window['webkitRTCPeerConnection'];

  peer;          // local peer connection
  localStream;
  remoteStream;

  statusText = 'Off';
  videoStatus = ''; /***
    ''     No call
    'A-> ' A calling B              ' <-B' B calling A
    'A->B' A calling B (Ringing)    'A<-B' B calling A (Ringing)
    'A>>B' WebRTC connecting        'A<<B' WebRTC connecting
    'A==B' Connected   */


  gameDoc;        // Reference to the
  playerNum: number;  // 1=White(A), 2=Black(B)

  myICECandidates = [];
  sdpPromiseResolve;
  sdpPromise = new Promise(resolve => this.sdpPromiseResolve = resolve);

  MAX_TIMEOUT = 15*1000;      // If the connection process takes longer than this, just abort it
  MAX_ICE_TIMEOUT = 8*1000;   // If the ICE Gathering process takes longer than this, try with the current candidates
  connexionTimeout;
  iceTimeOut;

  tabChange$ = new BehaviorSubject('moves'); // To force the UI to change the video tab

  constructor(
    private profile: JbProfileService,
    private store: StoreService,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private growl: JbGrowlService,
    private confirm: JbConfirmService,
  ) {}

  initSignaling(gameId, yourColor) {
    this.playerNum = yourColor === 'WHITE' ? 1 : 2;
    this.gameDoc = this.afs.doc<IGameDoc>('games/' + gameId);
    const game$ = this.store.getGame$(gameId);

    if (!this.sub1) { this.sub1 = game$.pipe(pluck('videoStatus'), distinctUntilChanged()).subscribe(video => this.videoStatusChange(video)); }
    if (!this.sub2) { this.sub2 = game$.pipe(pluck('offerSDP'), distinctUntilChanged()).subscribe(offer => this.offerChanged(offer)); }
    if (!this.sub3) { this.sub3 = game$.pipe(pluck('answerSDP'), distinctUntilChanged()).subscribe(answer => this.answerChanged(answer)); }
  }


  endSignaling() {
    if (this.sub1) { this.sub1.unsubscribe(); }
    if (this.sub2) { this.sub2.unsubscribe(); }
    if (this.sub3) { this.sub3.unsubscribe(); }
  }

  async offerChanged(offerSDP) {
    if (offerSDP) {
      if (this.playerNum === 1 && this.videoStatus === 'A<<B') { await this.answerOffer(offerSDP); } // WebRTC: Player 2 is sending the offer, answer it
      if (this.playerNum === 2 && this.videoStatus === 'A>>B') { await this.answerOffer(offerSDP); } // WebRTC: Player 1 is sending the offer, answer it
    }
  }
  async answerChanged(answerSDP) {
    if (answerSDP) {
      if (this.playerNum === 1 && this.videoStatus === 'A>>B') { await this.acknowledgeAnswer(answerSDP); } // WebRTC: Player 2 answered the offer. Acknowledge it
      if (this.playerNum === 2 && this.videoStatus === 'A<<B') { await this.acknowledgeAnswer(answerSDP); } // WebRTC: Player 1 answered the offer. Acknowledge it
    }
  }

  async videoStatusChange(status) {
    const prevStatus = this.videoStatus;
    if (prevStatus !== status) { console.log(new Date(), `VIDEO status ${prevStatus} ===> '${status}'`); }
    this.statusText = status;

    // Player 1 --- calling ---> Player 2
    if (this.playerNum === 1) {
      if (status === 'A-> ') { this.statusText += ' - You are sending a call'; }
      if (status === 'A->B') { this.statusText += ' - The other end is RINGING'; }
      if (status === 'A>>B' && prevStatus === 'A->B') { await this.startOffer(); } // Signaling: Player 2 wants to join the call. Start WebRTC offer
    }
    if (this.playerNum === 2) {
      if (status === 'A-> ') { this.updateStatus('A->B'); this.statusText += ' - New Incoming Call'; } // Start ringing
      if (status === 'A->B') { this.statusText += ' - RING RING! You are receiving a call. Want to answer?'; this.showRingAlert(); }
    }

    // Player 2 --- calling ---> Player 1
    if (this.playerNum === 2) {
      if (status === ' <-B') { this.statusText += ' - You are sending a call'; }
      if (status === 'A<-B') { this.statusText += ' - The other end is RINGING'; }
      if (status === 'A<<B' && prevStatus === 'A<-B') { await this.startOffer(); }  // Signaling: Player 1 wants to join the call. Start WebRTC offer
    }
    if (this.playerNum === 1) {
      if (status === ' <-B') { this.updateStatus('A<-B'); this.statusText += ' - New Incoming Call'; } // Start ringing
      if (status === 'A<-B') { this.statusText += ' - RING RING! You are receiving a call. Want to answer?'; this.showRingAlert(); }
    }

    // Init the timeout when starting the webrtc connection
    if ((prevStatus === 'A->B' && status === 'A>>B') || (prevStatus === 'A<-B' && status === 'A<<B')) {
      this.connexionTimeout = setTimeout(() => {
        console.log('TIMEOUT: It was not possible to establish connection');
        this.growl.error('Something went wrong, please try again later');
        this.hangup();
      }, this.MAX_TIMEOUT);
    }

    if (status === 'A>>B') { this.statusText += ' - Connecting...'; }
    if (status === 'A<<B') { this.statusText += ' - Connecting...'; }
    if (status === 'A==B') {
      this.statusText += ' - On Call';
      this.clearTimeouts();
    }

    if (status === '') { this.statusText += 'Off'; }
    if (prevStatus !== '' && status === '') {
      this.statusText += ' - The call has been terminated';
      this.terminate();
    }
    this.videoStatus = status;
  }

  makeCall() {
    if (this.videoStatus !== '') { this.growl.error(`There is another ongoing call ${this.videoStatus}`); return }
    this.gameDoc.update({ videoStatus: (this.playerNum === 1 ? 'A-> ' : ' <-B'), offerSDP: null, answerSDP: null });
  }

  showRingAlert() {
    this.confirm.open({
      title: 'Incoming Call',
      text: 'Your opponent is sending you a video call. Do you want to answer it?',
      yesButtonText: 'Yes, answer the call',
      noButtonText: 'No, reject it',
      showNo: true,
    }).then(res => {
      if (res === 'yes') { this.answerCall(); this.tabChange$.next('video'); }
      if (res === 'no')  { this.hangup(); }
    });
  }

  answerCall() {
    if (this.videoStatus === 'A<-B' && this.playerNum === 1) { this.updateStatus('A<<B'); }
    if (this.videoStatus === 'A->B' && this.playerNum === 2) { this.updateStatus('A>>B'); }
  }

  hangup() {
    // if (this.videoStatus === '') { console.warn('No call to hang up'); return }
    this.terminate();
    this.myICECandidates = [];
    return this.gameDoc.update({ videoStatus: '', offerSDP: null, answerSDP: null });
  }

  private updateStatus(status) {
    return this.gameDoc.update({ videoStatus: status });
  }

  // ------------------ WebRTC -------------------

  async initMedia() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(this.CONSTRAINTS);
      const tracks = {
        video: this.localStream.getVideoTracks(),
        audio: this.localStream.getAudioTracks(),
      };
      if (tracks.video.length) { console.log('Using video', tracks.video[0].label); }
      if (tracks.audio.length) { console.log('Using audio', tracks.audio[0].label); }

    } catch (err) { console.error('Video - initMedia() error', err); }
  }

  private initPeer() {
    if (!this.localStream) { this.growl.error('There is a problem with your Camera / Microphone'); }
    this.peer = new this.RTCPeerConnection(this.PEER_CONFIG);
    this.remoteStream = new MediaStream();
    this.peer.onicecandidate = ev => this.gatherICECandidate(ev);
    this.peer.oniceconnectionstatechange = ev => this.ICEConnectionChange(ev);
    this.peer.ontrack = async (ev) => ev.streams[0].getTracks().forEach(track => this.remoteStream.addTrack(track));
    this.localStream.getTracks().forEach(track => this.peer.addTrack(track, this.localStream));
    this.sdpPromise = new Promise(resolve => this.sdpPromiseResolve = resolve);
  }

  private async startOffer() { // WebRTC offer
    try {
      if (!this.localStream) { await this.initMedia(); }
      if (!this.peer) { this.initPeer(); }
      const offer = await this.peer.createOffer(this.OFFER_OPTIONS);
      await this.peer.setLocalDescription(offer); // <-- after this, ICE candidate gathering starts
      this.initICEGathering();
      console.log('----------- startOffer - setLocalDescription');
    } catch (err) { console.error('Video - startOffer() error', err); }
  }

  private async answerOffer(offerSDP) {  // WebRTC answer (handleOffer)
    try {
      if (!this.localStream) { await this.initMedia(); }
      this.initPeer();
      await this.peer.setRemoteDescription({ type: 'offer', sdp: offerSDP });
      console.log('----------- answerOffer - setRemoteDescription');
      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(answer);
      this.initICEGathering();
      console.log('----------- answerOffer - setLocalDescription');
    } catch (err) { console.error('Video - answerOffer() error', err); }
  }


  private async acknowledgeAnswer(answerSDP) { // WebRTC offer response (handleAnswer)
    try {
      if (!this.peer) { console.error('no peerconnection'); return; }
      await this.peer.setRemoteDescription({ type: 'answer', sdp: answerSDP });
      console.log('----------- answerOffer - setRemoteDescription');
      this.sdpPromiseResolve();
    } catch (err) { console.error('Video - acknowledgeAnswer() error', err); }
  }

  // The ice gathering process starts automatically after peer.setLocalDescription()
  private initICEGathering() {
    this.iceTimeOut = setTimeout(() => {
      if (this.peer.iceGatheringState !== 'complete') {
        console.log('ICE Gathering: After 10 seconds, the ICE Gathering process is still not completed', this.myICECandidates);
        if (this.myICECandidates.length >= 4) {
          console.log('ICE Gathering: Still, you have ', this.myICECandidates.length, ' candidates ready. Trying anyway');
          this.ICEGatheringCompleted();
        }
      }
    }, this.MAX_ICE_TIMEOUT);
  }

  private gatherICECandidate(ev) {
    const newICE: any = {
      type: 'candidate',
      candidate: null,
    };
    if (ev.candidate) {
      newICE.candidate = ev.candidate.candidate;
      newICE.sdpMid = ev.candidate.sdpMid;
      newICE.sdpMLineIndex = ev.candidate.sdpMLineIndex;
    }
    console.log(new Date(), 'PLAYER', this.playerNum, ' HAS DISCOVER A NEW CANDIDATE!!!!');
    this.myICECandidates.push(newICE);

    console.log('RTCPeerConnection.iceGatheringState = ', this.peer.iceGatheringState);
    if (this.peer.iceGatheringState === 'complete') { this.ICEGatheringCompleted(); }
  }

  private ICEGatheringCompleted() {
    console.log('ICE GATHERING COMPLETE!! sending SDP to the remote', !!this.iceTimeOut);
    if (this.iceTimeOut) {
      if (this.iceTimeOut) { clearInterval(this.iceTimeOut); this.iceTimeOut = null; }
      if (this.videoStatus === 'A>>B') {
        if (this.playerNum === 1) { this.gameDoc.update({ offerSDP: this.peer.localDescription.sdp }); }
        if (this.playerNum === 2) { this.gameDoc.update({ answerSDP: this.peer.localDescription.sdp }); this.sdpPromiseResolve(); }
      }
      if (this.videoStatus === 'A<<B') {
        if (this.playerNum === 2) { this.gameDoc.update({ offerSDP: this.peer.localDescription.sdp }); }
        if (this.playerNum === 1) { this.gameDoc.update({ answerSDP: this.peer.localDescription.sdp }); this.sdpPromiseResolve(); }
      }
    }
  }

  private ICEConnectionChange(ev) { // iceConnectionState: new -> checking -> connected
    console.log('RTCPeerConnection.iceConnectionState = ', this.peer.iceConnectionState);
    if (this.peer.iceConnectionState === 'connected') {
      this.sdpPromise.then(() => {
        console.log('WebRTC Connected !');
        this.updateStatus('A==B');
        this.tabChange$.next('video');
        if (this.iceTimeOut) { clearInterval(this.iceTimeOut); this.iceTimeOut = null; }
      });
    }
  }

  private clearTimeouts() {
    if (this.connexionTimeout) { clearInterval(this.connexionTimeout); this.connexionTimeout = null; }
    if (this.iceTimeOut) { clearInterval(this.iceTimeOut); this.iceTimeOut = null; }
  }

  private terminate() {
    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    this.sdpPromise = new Promise(resolve => this.sdpPromiseResolve = resolve);
    this.clearTimeouts();
  };


}
