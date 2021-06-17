import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

//const socket = io('http://localhost:5000');
const socket = io('https://warm-wildwood-81069.herokuapp.com');

const ContextProvider = ({ children }) => {   //contain all the states necessary for running our video chat 

    const[stream, setStream] = useState();
    const[me, setMe] = useState('');
    const[call,setCall] = useState({});
    const[callAccepted,setCallAccepted] = useState(false);
    const[callEnded,setCallEnded] = useState(false);
    const [name, setName] = useState('');

    const myVideo = useRef(); //userref is to connent it to the io frame
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => { // brings all the functions into effect
        navigator.mediaDevices.getUserMedia({ video: true, audio: true}) // ask permission for camera and audio  
            .then((currentStream) => { //set the stream
                setStream(currentStream);

                myVideo.current.srcObject = currentStream;
            });

            socket.on('me', (id) => setMe(id));  // listening to a specific action
    
            socket.on('callUser',({ from, name: callerName, signal }) => {
                setCall({ isRecievingCall: true, from, name: callerName, signal }); // because user might be recieving the call
            });

       },[]);

    const answerCall = () => {
        setCallAccepted(true);

        const peer = new Peer({ initiator:false, trickle: false ,stream});
        
        peer.on('signal',(data) => {
            socket.emit('answerCall',{ signal: data, to: call.from});
        });
        
        peer.on('stream' , (currentStream) => {
            userVideo.current.srcObject = currentStream; // this is for the stream of other person
        });
        
        peer.signal(call.signal);
        
        connectionRef.current = peer; // it means that current connection is connected to peer
    };

    const callUser = (id) => {
        
        const peer = new Peer({ initiator:true, trickle: false ,stream});

        peer.on('signal',(data) => {
            socket.emit('callUser', { userToCall: id, signalData: data, from: me, name});
        });
        
        peer.on('stream' , (currentStream) => {
            userVideo.current.srcObject = currentStream; // this is for the stream of other person
        });

        socket.on('callAccepted', (signal) => {
            setCallAccepted(true);

            peer.signal(signal);
        });

        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);

        connectionRef.current.destroy(); // destroy connection or disconnect call

        window.location.reload(); // reach the top i.e. the home page 
        
    }

    return (    // the functions inside this is accessible to all the files
        <SocketContext.Provider value = {{ call, callAccepted, myVideo, userVideo, stream, name, callEnded, setName , me, callUser, leaveCall, answerCall,}}>   
           {children}
        </SocketContext.Provider>
    );
};
export { ContextProvider, SocketContext };