import React, { createContext, useContext, useState, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { doc, setDoc, onSnapshot, updateDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import {
  MediaStream,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from '../services/webrtc-shim';

// Redirect console.error in this file to console.warn to prevent Expo LogBox from showing red screen popups
const console = {
  log: (...args: any[]) => globalThis.console.log(...args),
  warn: (...args: any[]) => globalThis.console.warn(...args),
  error: (...args: any[]) => globalThis.console.warn(...args),
};
import { auth, db } from '../lib/firebase';
import { configuration, fetchIceServers } from '../services/webrtc';

interface CallContextType {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
  connectionState: string;
  mediaError: string | null;
  createCall: (roomId: string) => Promise<void>;
  joinCall: (roomId: string) => Promise<void>;
  toggleMic: () => void;
  toggleCamera: () => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [mediaError, setMediaError] = useState<string | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      return (
        granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn('Error requesting permissions:', err);
      return false;
    }
  };

  const getUserMediaWithTimeout = async (constraints: any, timeoutMs = 4000): Promise<any> => {
    return Promise.race([
      mediaDevices.getUserMedia(constraints),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout acquiring media')), timeoutMs)
      ),
    ]);
  };

  const setupMedia = async () => {
    setMediaError(null);
    if (Platform.OS === 'android') {
      const hasPermission = await requestAndroidPermissions();
      if (!hasPermission) {
        setMediaError('Camera or Microphone permission denied');
        throw new Error('Camera or Microphone permission denied');
      }
    }
    try {
      const stream = await getUserMediaWithTimeout({
        audio: true,
        video: true,
      }, 4000);
      setLocalStream(stream);
      return stream;
    } catch (err: any) {
      console.warn('Failed to get both audio and video, trying audio only:', err);
      try {
        const stream = await getUserMediaWithTimeout({
          audio: true,
          video: false,
        }, 3000);
        setLocalStream(stream);
        setMediaError('Camera busy/blocked. Audio only.');
        return stream;
      } catch (err2: any) {
        console.warn('Failed to get audio only, returning empty stream:', err2);
        const stream = new MediaStream();
        setLocalStream(stream);
        setMediaError('Camera/Mic blocked or in use.');
        return stream;
      }
    }
  };

  const setupPeerConnection = (stream: MediaStream, roomId?: string, iceServers?: any[]) => {
    const pcConfig = iceServers ? { iceServers } : configuration;
    const peer = new RTCPeerConnection(pcConfig);
    peerRef.current = peer;

    // Log connection states in Firestore call room document
    const updateCallStatus = (extraFields: any) => {
      if (roomId && db) {
        updateDoc(doc(db, 'calls', roomId), extraFields).catch(console.error);
      }
    };

    (peer as any).onconnectionstatechange = () => {
      const state = peer.connectionState || 'unknown';
      setConnectionState(state);
      updateCallStatus({ connectionState: state });
    };

    (peer as any).oniceconnectionstatechange = () => {
      const iceState = peer.iceConnectionState || 'unknown';
      updateCallStatus({ iceConnectionState: iceState });
    };

    const handleRemoteStream = (eventStream?: any) => {
      if (eventStream) {
        setRemoteStream(eventStream);
        return;
      }
      // Try getting stream from peer connection (safest native fallback)
      const remoteStreams = (peer as any).getRemoteStreams ? (peer as any).getRemoteStreams() : [];
      if (remoteStreams && remoteStreams[0]) {
        setRemoteStream(remoteStreams[0]);
      }
    };

    // Handle incoming stream tracks (Modern API)
    (peer as any).ontrack = (event: any) => {
      const evStream = event.streams && event.streams[0] ? event.streams[0] : undefined;
      handleRemoteStream(evStream);
      
      if (roomId && db) {
        updateDoc(doc(db, 'calls', roomId), { status: 'connected' }).catch(console.error);
      }
    };

    // Handle legacy/alternate stream addition for some native WebRTC engine wrappers
    (peer as any).onaddstream = (event: any) => {
      handleRemoteStream(event.stream);
      if (roomId && db) {
        updateDoc(doc(db, 'calls', roomId), { status: 'connected' }).catch(console.error);
      }
    };

    const hasAudio = stream.getAudioTracks().length > 0;
    const hasVideo = stream.getVideoTracks().length > 0;

    // Add audio track if available, else recvonly transceiver to guarantee SDP section exists
    if (hasAudio) {
      stream.getAudioTracks().forEach((track: any) => {
        peer.addTrack(track, stream);
      });
    } else {
      try {
        if ((peer as any).addTransceiver) {
          (peer as any).addTransceiver('audio', { direction: 'recvonly' });
        }
      } catch (e) {
        console.warn('Error adding recvonly audio transceiver:', e);
      }
    }

    // Add video track if available, else recvonly transceiver to guarantee SDP section exists
    if (hasVideo) {
      stream.getVideoTracks().forEach((track: any) => {
        peer.addTrack(track, stream);
      });
    } else {
      try {
        if ((peer as any).addTransceiver) {
          (peer as any).addTransceiver('video', { direction: 'recvonly' });
        }
      } catch (e) {
        console.warn('Error adding recvonly video transceiver:', e);
      }
    }

    return peer;
  };

  const createCall = async (roomId: string) => {
    try {
      if (!db) return;
      currentRoomIdRef.current = roomId;
      
      const roomRef = doc(db, 'calls', roomId);
      const sessionId = Math.random().toString(36).substring(2);
      
      // Immediately clear any old offer/answer to prevent the callee from connecting to stale data
      await setDoc(roomRef, {
        status: 'initializing',
        sessionId: sessionId,
        createdAt: Date.now(),
      });

      // Clean up any old candidates from a previous call in parallel
      const offerCollection = collection(roomRef, 'offerCandidates');
      const answerCollection = collection(roomRef, 'answerCandidates');
      try {
        const offerDocs = await getDocs(offerCollection);
        const offerDeletes = offerDocs.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(offerDeletes);

        const answerDocs = await getDocs(answerCollection);
        const answerDeletes = answerDocs.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(answerDeletes);
      } catch (err) {
        console.error('Error cleaning up old candidates:', err);
      }

      const stream = await setupMedia();
      const iceServers = await fetchIceServers();
      const peer = setupPeerConnection(stream, roomId, iceServers);
      
      const callerCandidatesCollection = collection(roomRef, 'offerCandidates');

      (peer as any).onicecandidate = (event: any) => {
        if (event.candidate) {
          const candidateObj = typeof event.candidate.toJSON === 'function'
            ? event.candidate.toJSON()
            : {
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
              };
          addDoc(callerCandidatesCollection, {
            ...candidateObj,
            sessionId: sessionId,
            createdAt: Date.now(),
          }).catch(console.error);
        }
      };

      const offer = await peer.createOffer({});
      await peer.setLocalDescription(offer);

      await setDoc(roomRef, {
        createdBy: auth?.currentUser?.uid || 'patient_uid',
        status: 'waiting',
        sessionId: sessionId,
        createdAt: Date.now(),
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
      });

      let isRemoteDescSet = false;

      onSnapshot(roomRef, async (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && data.sessionId === sessionId && !isRemoteDescSet) {
          isRemoteDescSet = true; // Set synchronously to prevent concurrent execution race condition
          try {
            const rtcSessionDescription = new RTCSessionDescription(data.answer);
            await peer.setRemoteDescription(rtcSessionDescription);
            
            // Now subscribe to callee candidates after remote description is set
            const calleeCandidatesCollection = collection(roomRef, 'answerCandidates');
            onSnapshot(calleeCandidatesCollection, (candidateSnapshot) => {
              candidateSnapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                  const candidateData = change.doc.data();
                  if (candidateData.sessionId === sessionId) {
                    const candidate = new RTCIceCandidate(candidateData);
                    peer.addIceCandidate(candidate).catch((err: any) => {
                      console.warn('Error adding answer candidate:', err);
                    });
                  }
                }
              });
            }, (err: any) => console.warn('calleeCandidates snapshot error:', err));
          } catch (e) {
            console.error('Error setting remote description in createCall:', e);
            isRemoteDescSet = false; // Revert on failure
          }
        }
      }, (err: any) => console.warn('roomRef snapshot error:', err));
    } catch (error) {
      console.log('Error creating call:', error);
    }
  };

  const joinCall = async (roomId: string) => {
    try {
      if (!db) return;
      currentRoomIdRef.current = roomId;
      const stream = await setupMedia();
      const iceServers = await fetchIceServers();
      const peer = setupPeerConnection(stream, roomId, iceServers);

      const roomRef = doc(db, 'calls', roomId);
      
      await setDoc(roomRef, { status: 'ringing' }, { merge: true });

      const calleeCandidatesCollection = collection(roomRef, 'answerCandidates');
      let currentSessionId: string | null = null;
      
      (peer as any).onicecandidate = (event: any) => {
        if (event.candidate && currentSessionId) {
          const candidateObj = typeof event.candidate.toJSON === 'function'
            ? event.candidate.toJSON()
            : {
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
              };
          addDoc(calleeCandidatesCollection, {
            ...candidateObj,
            sessionId: currentSessionId,
            createdAt: Date.now(),
          }).catch(console.error);
        }
      };

      let isRemoteDescSet = false;

      onSnapshot(roomRef, async (snapshot) => {
        const data = snapshot.data();
        if (data?.offer && (data.status === 'waiting' || data.status === 'ringing') && !isRemoteDescSet) {
          isRemoteDescSet = true; // Set synchronously to prevent concurrent execution race condition
          try {
            currentSessionId = data.sessionId || null;
            const rtcSessionDescription = new RTCSessionDescription(data.offer);
            await peer.setRemoteDescription(rtcSessionDescription);
            
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            await updateDoc(roomRef, {
              answer: {
                type: answer.type,
                sdp: answer.sdp,
              },
            });

            // Now subscribe to caller candidates after remote description is set
            if (currentSessionId) {
              const callerCandidatesCollection = collection(roomRef, 'offerCandidates');
              const targetSessionId = currentSessionId; // Capture for closure safety
              onSnapshot(callerCandidatesCollection, (candidateSnapshot) => {
                candidateSnapshot.docChanges().forEach((change) => {
                  if (change.type === 'added') {
                    const candidateData = change.doc.data();
                    if (candidateData.sessionId === targetSessionId) {
                      const candidate = new RTCIceCandidate(candidateData);
                      peer.addIceCandidate(candidate).catch((err: any) => {
                        console.warn('Error adding offer candidate:', err);
                      });
                    }
                  }
                });
              }, (err: any) => console.warn('callerCandidates snapshot error:', err));
            }
          } catch (e) {
            console.error('Error setting remote description / answer in joinCall:', e);
            isRemoteDescSet = false; // Revert on failure
          }
        }
      }, (err: any) => console.warn('roomRef snapshot error:', err));
    } catch (error) {
      console.log('Error joining call:', error);
    }
  };

  const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track: any) => {
      track.enabled = !track.enabled;
    });
    setMicEnabled((prev) => !prev);
  };

  const toggleCamera = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track: any) => {
      track.enabled = !track.enabled;
    });
    setCameraEnabled((prev) => !prev);
  };

  const endCall = () => {
    localStream?.getTracks().forEach((track: any) => track.stop());
    remoteStream?.getTracks().forEach((track: any) => track.stop());
    peerRef.current?.close();
    setLocalStream(null);
    setRemoteStream(null);
    setMicEnabled(true);
    setCameraEnabled(true);
    setConnectionState('disconnected');
    setMediaError(null);

    const roomId = currentRoomIdRef.current;
    if (roomId && db) {
      const roomRef = doc(db, 'calls', roomId);
      updateDoc(roomRef, { status: 'ended' }).catch(console.error);

      const cleanupCandidates = async () => {
        try {
          const offerCollection = collection(roomRef, 'offerCandidates');
          const offerDocs = await getDocs(offerCollection);
          offerDocs.forEach((d) => deleteDoc(d.ref));

          const answerCollection = collection(roomRef, 'answerCandidates');
          const answerDocs = await getDocs(answerCollection);
          answerDocs.forEach((d) => deleteDoc(d.ref));
        } catch (err) {
          console.error('Error cleaning up candidates:', err);
        }
      };

      cleanupCandidates();
    }
    currentRoomIdRef.current = null;
  };

  return (
    <CallContext.Provider
      value={{
        localStream,
        remoteStream,
        micEnabled,
        cameraEnabled,
        connectionState,
        mediaError,
        createCall,
        joinCall,
        toggleMic,
        toggleCamera,
        endCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}