import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {

        socketRef.current = await initSocket();
        socketRef.current.on('connect_error', handleErrors);
        socketRef.current.on('connect_failed', handleErrors);

        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username: location.state?.username,
        });

        // Listening for joined event
        socketRef.current.on(
          ACTIONS.JOINED,
          ({ clients, username, socketId }) => {
            if (username !== location.state?.username) {
              toast.success(`${username} joined the room.`);
              console.log(`${username} joined`);
            }
            setClients(clients);

            socketRef.current.emit(ACTIONS.SYNC_CODE, {
              code: codeRef.current,
              socketId,
            });
          }
        );

        // Listening for disconnected event
        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
          toast(`${username} left the room.`);
          setClients((prev) => prev.filter((client) => client.socketId !== socketId));
        });


      } catch (error) {
        handleErrors(error);
      }
    };

    function handleErrors(e) {
      console.log('socket error', e);
      toast.error('Socket connection failed, try again later.');
      reactNavigator('/');
    }

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      }
    };
  }, [roomId, location.state?.username, reactNavigator]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success('Room ID copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy Room ID');
    }
  };

  const leaveRoom = () => {
    reactNavigator('/');
  };

  if (!location.state?.username) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img
              className="logoImage"
              src="/1.png"
              alt="logo"
            />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client
                key={client.socketId}
                username={client.username}
              />
            ))}
          </div>
        </div>
        <button className="btn copyBtn" onClick={copyRoomId}>
          Copy ROOM ID
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave
        </button>
      </div>
      <div className="editorWrap">
        <Editor socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            codeRef.current = code;
        }}
        />
      </div>

    </div>
  );
};

export default EditorPage;
