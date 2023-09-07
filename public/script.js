const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443',
    secure: true,
    config: {
        'iceServers': [
            { url: 'stun:stun01.sipphone.com' },
            { url: 'stun:stun.ekiga.net' },
            { url: 'stun:stunserver.org' },
            { url: 'stun:stun.softjoys.com' },
            { url: 'stun:stun.voiparound.com' },
            { url: 'stun:stun.voipbuster.com' },
            { url: 'stun:stun.voipstunt.com' },
            { url: 'stun:stun.voxgratia.org' },
            { url: 'stun:stun.xten.com' },
            {
                url: 'turn:192.158.29.39:3478?transport=udp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            },
            {
                url: 'turn:192.158.29.39:3478?transport=tcp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            }
        ]
    },
})
let myVideoStream;
let audio = true;
let myName = prompt("Welcome! Please enter your name:");
if (myName == null || myName == "") myName = "user"
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
var getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream)

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream)
    })
    let text = $('input')

    $('html').keydown((e) => {
        if (e.which == 13 && text.val().length !== 0) {
            console.log(text.val());
            socket.emit('message', { user: peer.id, message: text.val(), name: myName });
            text.val('')
        }
    })

    socket.on('toggle-video', data => {
        const userId = data.userId;
        const videoEnabled = data.videoEnabled;

        const videoElement = document.getElementById(userId);

        if (videoElement) {
            if (videoEnabled) {
                videoElement.style.display = 'block';
            } else {
                videoElement.style.display = 'none';
            }
        }
    });

    socket.on('toggle-audio', data => {
        const userId = data.userId;
        const audioEnabled = data.audioEnabled;

        const audioElement = document.getElementById(userId);

        if (audioElement) {
            console.log(audioElement)
            console.log(audioEnabled)
            if (audioEnabled) {
                audioElement.muted = false;
            } else {
                audioElement.muted = true;
            }
        }
    });

    socket.on('createMessage', message => {
        $('.messages').append(`<li class="message"><b>${message.name}</b><br/>${message.message}</li>`)
        scrollToBottom()
    })

})

peer.on("call", call => {
    getUserMedia(
        { video: true, audio: true },
        stream => {
            call.answer(stream); // Answer the call with an A/V stream.
            const video = document.createElement("video")
            video.setAttribute('id', `${call.metadata.senderUserId}`)
            call.on("stream", function (remoteStream) {
                addVideoStream(video, remoteStream);
            })
            call.on('close', () => {
                video.remove()
            })
            peers[call.metadata.senderUserId] = call
        },
        err => {
            console.log("Failed to get local stream", err);
        }
    );
});

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
})

peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
    const call = peer.call(userId, stream, { metadata: { senderUserId: peer.id } })
    const video = document.createElement('video')
    video.setAttribute('id', `${userId}`)
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
}

function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}

const scrollToBottom = () => {
    let d = $('.main_chat_window')
    d.scrollTop(d.prop("scrollHeight"));
}

function toggleVideo() {
    const videoStream = myVideoStream;
    if (videoStream.getVideoTracks()[0].enabled) {
        setPlayVideo()
        videoStream.getVideoTracks()[0].enabled = false;
        const data = { userId: peer.id, videoEnabled: false };
        socket.emit('toggle-video', data);
    } else {
        setStopVideo();
        videoStream.getVideoTracks()[0].enabled = true;
        const data = { userId: peer.id, videoEnabled: true };
        socket.emit('toggle-video', data);
    }
}

function toggleAudio() {
    if (audio) {
        setUnmuteButton()
        audio = false
        const data = { userId: peer.id, audioEnabled: false };
        socket.emit('toggle-audio', data);
    } else {
        setMuteButton()
        audio = true
        const data = { userId: peer.id, audioEnabled: true };
        socket.emit('toggle-audio', data);
    }
}


const setMuteButton = () => {
    const html = `
      <i class="fas fa-microphone mute"></i>
      <span>Mute</span>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
    const html = `
      <i class="unmute fas fa-microphone-slash"></i>
      <span>Unmute</span>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
    const html = `
      <i class="fas fa-video"></i>
      <span>Stop Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
    const html = `
    <i class="stop fas fa-video-slash"></i>
      <span>Play Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
}

function copyLink() {
    prompt(
        "Copy this link and send it to people you want to meet with",
        window.location.href
    );
}

function toggleChat() {
    const chating = document.getElementById("chating")
    if (chating.style.display === 'none') {
        chating.style.display = "flex";
        document.querySelector(".main_left").style.flex = 0.8;
    } else {
        chating.style.display = "none";
        document.querySelector(".main_left").style.flex = 1;
    }
}

function leaveMeeting() {
    window.location.href = "/";
}
