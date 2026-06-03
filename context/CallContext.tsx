import React, {
  createContext,
  useContext,
  useState,
} from 'react';

const CallContext = createContext<any>(null);

export function CallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [localStream, setLocalStream] =
    useState<any>(null);

  const [remoteStream, setRemoteStream] =
    useState<any>(null);

  const createCall = async (
    roomId: string
  ) => {};

  const joinCall = async (
    roomId: string
  ) => {};

  const endCall = async () => {};

  const toggleMic = () => {};

  const toggleCamera = () => {};

  return (
    <CallContext.Provider
      value={{
        localStream,
        remoteStream,
        createCall,
        joinCall,
        endCall,
        toggleMic,
        toggleCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  return useContext(CallContext);
}