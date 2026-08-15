'use client';
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'in-call';

export interface Friend {
  id: string;
  name: string;
  avatar: string;   // initials fallback
  avatarColor: string;
  online: boolean;
}

export const MOCK_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Alex Rivera', avatar: 'AR', avatarColor: '#6366f1', online: true },
  { id: 'f2', name: 'Priya Sharma', avatar: 'PS', avatarColor: '#ec4899', online: true },
  { id: 'f3', name: 'Marcus Chen', avatar: 'MC', avatarColor: '#10b981', online: false },
  { id: 'f4', name: 'Sofia Torres', avatar: 'ST', avatarColor: '#f59e0b', online: true },
  { id: 'f5', name: 'Kai Nakamura', avatar: 'KN', avatarColor: '#3b82f6', online: false },
];

interface VoIPContextValue {
  callStatus: CallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isSharingScreen: boolean;
  isRecording: boolean;
  recordingSeconds: number;
  callerFriend: Friend | null;
  initiateCall: (friend: Friend) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  toggleRecording: () => void;
  showFriendList: boolean;
  setShowFriendList: (v: boolean) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const VoIPContext = createContext<VoIPContextValue | null>(null);

const CHANNEL_NAME = 'yt-clone-voip-signaling';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function VoIPProvider({ children }: { children: React.ReactNode }) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [callerFriend, setCallerFriend] = useState<Friend | null>(null);
  const [showFriendList, setShowFriendList] = useState(false);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── BroadcastChannel setup ─────────────────────────────────────────────────

  useEffect(() => {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = bc;

    bc.onmessage = async (ev) => {
      const { type, data } = ev.data as { type: string; data: unknown };

      if (type === 'call-offer') {
        // Incoming call from another tab
        const { friend, offer } = data as { friend: Friend; offer: RTCSessionDescriptionInit };
        setCallerFriend(friend);
        setCallStatus('ringing');
        // Store offer for later acceptance
        (bc as BroadcastChannel & { _pendingOffer?: RTCSessionDescriptionInit })._pendingOffer = offer;
      }

      if (type === 'call-answer') {
        const answer = data as RTCSessionDescriptionInit;
        if (peerRef.current) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      }

      if (type === 'ice-candidate') {
        const candidate = data as RTCIceCandidateInit;
        if (peerRef.current) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      if (type === 'call-declined') {
        cleanupCall();
      }

      if (type === 'call-ended') {
        cleanupCall();
      }
    };

    return () => {
      bc.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── RTCPeerConnection factory ──────────────────────────────────────────────

  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (ev) => {
      if (ev.candidate && channelRef.current) {
        channelRef.current.postMessage({
          type: 'ice-candidate',
          data: ev.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (ev) => {
      setRemoteStream(ev.streams[0]);
    };

    return pc;
  }, []);

  // ── Get local media ────────────────────────────────────────────────────────

  const getLocalMedia = useCallback(async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // ── Initiate call (caller) ─────────────────────────────────────────────────

  const initiateCall = useCallback(async (friend: Friend) => {
    setCallerFriend(friend);
    setCallStatus('calling');
    setShowFriendList(false);

    const stream = await getLocalMedia();
    const pc = createPeer();
    peerRef.current = pc;

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    channelRef.current?.postMessage({
      type: 'call-offer',
      data: { friend, offer },
    });
  }, [createPeer, getLocalMedia]);

  // ── Accept call (callee) ───────────────────────────────────────────────────

  const acceptCall = useCallback(async () => {
    const bc = channelRef.current as BroadcastChannel & { _pendingOffer?: RTCSessionDescriptionInit };
    const offer = bc?._pendingOffer;
    if (!offer) return;

    const stream = await getLocalMedia();
    const pc = createPeer();
    peerRef.current = pc;

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    channelRef.current?.postMessage({
      type: 'call-answer',
      data: answer,
    });

    setCallStatus('in-call');
  }, [createPeer, getLocalMedia]);

  // ── Decline call ──────────────────────────────────────────────────────────

  const declineCall = useCallback(() => {
    channelRef.current?.postMessage({ type: 'call-declined', data: null });
    cleanupCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── End call ──────────────────────────────────────────────────────────────

  const endCall = useCallback(() => {
    channelRef.current?.postMessage({ type: 'call-ended', data: null });
    cleanupCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────

  const cleanupCall = useCallback(() => {
    // Stop recording first
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (recTimerRef.current) clearInterval(recTimerRef.current);

    // Stop all tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());

    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current = null;
    screenStreamRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setCallerFriend(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsSharingScreen(false);
    setIsRecording(false);
    setRecordingSeconds(0);
    recChunksRef.current = [];
  }, []);

  // When caller gets answer, transition to in-call
  useEffect(() => {
    if (callStatus === 'calling' && remoteStream) {
      setCallStatus('in-call');
    }
  }, [callStatus, remoteStream]);

  // ── Toggle mute ───────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((v) => !v);
  }, []);

  // ── Toggle camera 

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOff((v) => !v);
  }, []);

  // ── Toggle screen share

  const toggleScreenShare = useCallback(async () => {
    const pc = peerRef.current;
    if (!pc) return;

    if (isSharingScreen) {
      // Restore camera track
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;

      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(cameraTrack);
      }
      setIsSharingScreen(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
         video: {
         // Prefer browser tab for YouTube sharing
            displaySurface: 'browser',
        },
          audio: true,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(screenTrack);

        // Revert when user stops via browser UI
        screenTrack.onended = () => {
          setIsSharingScreen(false);
          screenStreamRef.current = null;
          const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
          if (cameraTrack) {
            pc.getSenders().find((s) => s.track?.kind === 'video')?.replaceTrack(cameraTrack);
          }
        };

        setIsSharingScreen(true);
      } catch {
        // User cancelled picker or permission denied — silently ignore
      }
    }
  }, [isSharingScreen]);

  // ── Toggle recording ──────────────────────────────────────────────────────

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      // Stop and save
      recorderRef.current?.stop();
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      setIsRecording(false);
    } else {
      // Combine local + remote tracks for recording
      const combinedStream = new MediaStream();

      localStreamRef.current?.getTracks().forEach((t) => combinedStream.addTrack(t));

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      recorderRef.current = recorder;
      recChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `call-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecordingSeconds(0);
      };

      recorder.start(1000);
      setIsRecording(true);

      let secs = 0;
      recTimerRef.current = setInterval(() => {
        secs++;
        setRecordingSeconds(secs);
      }, 1000);
    }
  }, [isRecording]);

  return (
    <VoIPContext.Provider value={{
      callStatus, localStream, remoteStream,
      isMuted, isCameraOff, isSharingScreen, isRecording, recordingSeconds,
      callerFriend,
      initiateCall, acceptCall, declineCall, endCall,
      toggleMute, toggleCamera, toggleScreenShare, toggleRecording,
      showFriendList, setShowFriendList,
    }}>
      {children}
    </VoIPContext.Provider>
  );
}

export function useVoIP() {
  const ctx = useContext(VoIPContext);
  if (!ctx) throw new Error('useVoIP must be used within VoIPProvider');
  return ctx;
}
