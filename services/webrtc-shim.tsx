import { Platform, StyleSheet, View, Text } from 'react-native';
import React, { useEffect, useRef } from 'react';

const streamMap = new Map<string, any>();

// Interfaces for TypeScript type safety
export interface IMediaStream {
  id: string;
  active: boolean;
  getTracks(): any[];
  getAudioTracks(): any[];
  getVideoTracks(): any[];
  toURL(): string;
}

export interface IRTCPeerConnection {
  localDescription: any;
  remoteDescription: any;
  onicecandidate: any;
  ontrack: any;
  addTrack(track: any, stream: any): any;
  createOffer(options?: any): Promise<any>;
  createAnswer(options?: any): Promise<any>;
  setLocalDescription(desc: any): Promise<void>;
  setRemoteDescription(desc: any): Promise<void>;
  addIceCandidate(candidate: any): Promise<void>;
  close(): void;
}

export interface IRTCSessionDescription {
  type: string;
  sdp: string;
  toJSON(): any;
}

export interface IRTCIceCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  toJSON(): any;
}

// Export type aliases matching the class names
export type MediaStream = IMediaStream;
export type RTCPeerConnection = IRTCPeerConnection;
export type RTCSessionDescription = IRTCSessionDescription;
export type RTCIceCandidate = IRTCIceCandidate;

let WebRTC: any = null;
if (Platform.OS !== 'web') {
  try {
    WebRTC = require('react-native-webrtc');
  } catch (e) {
    // react-native-webrtc native module is missing. Using fallback mocks.
  }
}

// Declare variables to hold the active implementations
let Exported_MediaStream: any;
let Exported_RTCPeerConnection: any;
let Exported_RTCSessionDescription: any;
let Exported_RTCIceCandidate: any;
let Exported_mediaDevices: any;
let Exported_RTCView: any;

if (Platform.OS === 'web') {
  // Web Fallbacks
  Exported_MediaStream = typeof window !== 'undefined' ? (window as any).MediaStream : class {};
  Exported_RTCPeerConnection = typeof window !== 'undefined' ? (window as any).RTCPeerConnection : class {};
  Exported_RTCSessionDescription = typeof window !== 'undefined' ? (window as any).RTCSessionDescription : class {};
  Exported_RTCIceCandidate = typeof window !== 'undefined' ? (window as any).RTCIceCandidate : class {};
  Exported_mediaDevices = typeof window !== 'undefined' ? (window.navigator as any).mediaDevices : {
    getUserMedia: () => Promise.reject(new Error('mediaDevices not available on web')),
  };

  if (typeof window !== 'undefined' && (window as any).MediaStream) {
    const proto = (window as any).MediaStream.prototype;
    if (!proto.toURL) {
      proto.toURL = function() {
        const id = this.id || Math.random().toString(36).substr(2, 9);
        streamMap.set(id, this);
        return id;
      };
    }
  }

  Exported_RTCView = ({ stream, streamURL, style, mirror, objectFit, ...props }: any) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const flatStyle = StyleSheet.flatten(style);

    useEffect(() => {
      let activeStream = stream;
      if (!activeStream && streamURL) {
        activeStream = streamMap.get(streamURL);
      }
      if (videoRef.current && activeStream) {
        videoRef.current.srcObject = activeStream;
      }
    }, [stream, streamURL]);

    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={props.muted}
        style={{
          ...flatStyle,
          objectFit: objectFit || 'cover',
          transform: mirror ? 'scaleX(-1)' : 'none',
        } as any}
      />
    );
  };
} else if (WebRTC) {
  // Use React Native WebRTC directly
  Exported_MediaStream = WebRTC.MediaStream;
  Exported_RTCPeerConnection = WebRTC.RTCPeerConnection;
  Exported_RTCSessionDescription = WebRTC.RTCSessionDescription;
  Exported_RTCIceCandidate = WebRTC.RTCIceCandidate;
  Exported_mediaDevices = WebRTC.mediaDevices;
  Exported_RTCView = WebRTC.RTCView;
} else {
  // Native Fallbacks when module is missing (e.g. Expo Go)
  class MockMediaStream {
    id = 'mock-stream-' + Math.random().toString(36).substr(2, 9);
    active = true;
    getTracks() { return []; }
    getAudioTracks() { return []; }
    getVideoTracks() { return []; }
    toURL() {
      streamMap.set(this.id, this);
      return this.id;
    }
  }

  class MockRTCPeerConnection {
    localDescription = null;
    remoteDescription = null;
    onicecandidate = null;
    ontrack = null;
    addTrack(track: any, stream: any) {}
    async createOffer(options?: any) {
      return { type: 'offer', sdp: 'mock-sdp' };
    }
    async createAnswer(options?: any) {
      return { type: 'answer', sdp: 'mock-sdp' };
    }
    async setLocalDescription(desc: any) {
      (this as any).localDescription = desc;
    }
    async setRemoteDescription(desc: any) {
      (this as any).remoteDescription = desc;
    }
    async addIceCandidate(candidate: any) {}
    close() {}
  }

  class MockRTCSessionDescription {
    type: string;
    sdp: string;
    constructor(init?: any) {
      this.type = init?.type || '';
      this.sdp = init?.sdp || '';
    }
    toJSON() { return { type: this.type, sdp: this.sdp }; }
  }

  class MockRTCIceCandidate {
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
    constructor(init?: any) {
      this.candidate = init?.candidate || '';
      this.sdpMid = init?.sdpMid || null;
      this.sdpMLineIndex = init?.sdpMLineIndex || null;
    }
    toJSON() { return { candidate: this.candidate, sdpMid: this.sdpMid, sdpMLineIndex: this.sdpMLineIndex }; }
  }

  Exported_MediaStream = MockMediaStream;
  Exported_RTCPeerConnection = MockRTCPeerConnection;
  Exported_RTCSessionDescription = MockRTCSessionDescription;
  Exported_RTCIceCandidate = MockRTCIceCandidate;
  Exported_mediaDevices = {
    getUserMedia: async (constraints?: any) => {
      return new MockMediaStream();
    }
  };

  Exported_RTCView = ({ stream, streamURL, style, mirror, objectFit, ...props }: any) => {
    const flatStyle = StyleSheet.flatten(style);
    return (
      <View style={[{
        backgroundColor: '#1E2736',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
      }, flatStyle]}>
        <Text style={{ color: '#699CE8', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>
          Camera Preview
        </Text>
        <Text style={{ color: '#DCE4F2', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
          (Native WebRTC module missing)
        </Text>
      </View>
    );
  };
}

export {
  Exported_MediaStream as MediaStream,
  Exported_RTCPeerConnection as RTCPeerConnection,
  Exported_RTCSessionDescription as RTCSessionDescription,
  Exported_RTCIceCandidate as RTCIceCandidate,
  Exported_mediaDevices as mediaDevices,
  Exported_RTCView as RTCView,
};
