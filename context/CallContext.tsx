import React, { createContext, useContext, useState, useRef } from 'react';
import { doc, setDoc, onSnapshot, updateDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import {
  MediaStream,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from '../services/webrtc-shim';
import { auth, db } from '../lib/firebase';
import { configuration } from '../services/webrtc';

interface CallContextType {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
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

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);

  const setupMedia = async () => {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setLocalStream(stream);
    return stream;
  };

  const setupPeerConnection = (stream: MediaStream, roomId?: string) => {
    const peer = new RTCPeerConnection(configuration);
    peerRef.current = peer;

    (peer as any).ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (roomId && db) {
          updateDoc(doc(db, 'calls', roomId), { status: 'connected' }).catch(console.error);
        }
      }
    };

    stream.getTracks().forEach((track: any) => {
      peer.addTrack(track, stream);
    });

    return peer;
  };

  const createCall = async (roomId: string) => {
    try {
      if (!db) return;
      currentRoomIdRef.current = roomId;
      const stream = await setupMedia();
      const peer = setupPeerConnection(stream, roomId);
      
      const roomRef = doc(db, 'calls', roomId);
      const callerCandidatesCollection = collection(roomRef, 'offerCandidates');

      (peer as any).onicecandidate = (event: any) => {
        if (event.candidate) {
          addDoc(callerCandidatesCollection, event.candidate.toJSON());
        }
      };

      const offer = await peer.createOffer({});
      await peer.setLocalDescription(offer);

      await setDoc(roomRef, {
        createdBy: auth?.currentUser?.uid || 'patient_uid',
        status: 'waiting',
        createdAt: Date.now(),
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
      });

      onSnapshot(roomRef, async (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && !peer.remoteDescription) {
          const rtcSessionDescription = new RTCSessionDescription(data.answer);
          await peer.setRemoteDescription(rtcSessionDescription);
        }
      });

      const calleeCandidatesCollection = collection(roomRef, 'answerCandidates');
      onSnapshot(calleeCandidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            peer?.addIceCandidate(candidate);
          }
        });
      });
    } catch (error) {
      console.log('Error creating call:', error);
    }
  };

  const joinCall = async (roomId: string) => {
    try {
      if (!db) return;
      currentRoomIdRef.current = roomId;
      const stream = await setupMedia();
      const peer = setupPeerConnection(stream, roomId);

      const roomRef = doc(db, 'calls', roomId);
      
      await updateDoc(roomRef, { status: 'ringing' });

      const calleeCandidatesCollection = collection(roomRef, 'answerCandidates');
      
      (peer as any).onicecandidate = (event: any) => {
        if (event.candidate) {
          addDoc(calleeCandidatesCollection, event.candidate.toJSON());
        }
      };

      const callerCandidatesCollection = collection(roomRef, 'offerCandidates');
      onSnapshot(callerCandidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            peer?.addIceCandidate(candidate);
          }
        });
      });

      onSnapshot(roomRef, async (snapshot) => {
        const data = snapshot.data();
        if (data?.offer && !peer.remoteDescription) {
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
        }
      });
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