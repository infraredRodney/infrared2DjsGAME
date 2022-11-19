// Player enters lobby name and game starts once two players are in the same lobby
(function() {
    const player = {
        name: '', // Player is either 'Host' or 'Guest'
        sign: '',
        score: 0
    }

    function $(id) { 
        return document.getElementById(id); 
    }   

    let score = $('score'), triesLeft = $('triesLeft'), guessWord = $('guessWord'), opponentScore = $('opponentScore');

    // PubNub
    let lobby = prompt("Enter name of lobby");
    let game = lobby; // game is the channel where the game takes places
    lobby = lobby + 'Lobby'; // separate channel for lobby
    const newUUID = PubNub.generateUUID();
    let isHost = false;
    let ChatEngine = '';
    let GuessWordChatEngine = '';

    const pubnubGuessGame = new PubNub({
        uuid: newUUID,
        publish_key: 'pub-c-f9cf731c-29da-4472-9c83-62bc4dfb552f',
        subscribe_key: 'sub-c-5a63c1a8-4544-4d03-9493-68dfe1eca068',
        ssl: true
    });

    listener = {
        presence: function(response) {
            if (response.action === 'join') {
                if(response.occupancy < 2){
                    // Check that game lobby is not full
                    pubnubGuessGame.hereNow({
                        channels: [game]
                    }, function(status, response){
                        // Unsubscribe if lobby is full
                        if(response.totalOccupancy >= 2){
                            guessWord.innerHTML = '';
                            window.alert("Lobby is full!");    
                            pubnubGuessGame.removeListener(listener);
                            pubnubGuessGame.unsubscribe({
                                channels: [lobby]
                            });           
                            return;             
                        }
                    }); 
                    // Player is the Host
                    player.name = 'Host';
                    player.sign = 'H';
                    isHost = true;
                    guessWord.innerHTML = 'You are the Host. Waiting for opponent...';
                }                    

                else if(response.occupancy === 2){
                    // Player is the Guest
                    if(!isHost){
                        player.name = 'Guest';
                        player.sign = 'G';
                        guessWord.innerHTML = `Guess the drawing!`;
                        triesLeft.innerHTML = "Tries Left: 3";
                    }

                    score.innerHTML = `My Score: ${player.score}`;
                    opponentScore.innerHTML = "Opponent's Score: 0";
                    
                    connectToChat();
                    // Unsubscribe fromm lobby channel
                    pubnubGuessGame.removeListener(listener); 
                    pubnubGuessGame.unsubscribe({
                        channels: [lobby]
                    });       
                    gameStart(pubnubGuessGame, ChatEngine, GuessWordChatEngine, game, player);               
                }
            }
        }, 
        status: function(event) {
            if (event.category == 'PNConnectedCategory') {
                setUpCanvas();
            } 
        }   
    }

    pubnubGuessGame.addListener(listener);

    pubnubGuessGame.subscribe({
        channels: [lobby],
        withPresence: true
    });

    function connectToChat(){
        /* Main Chat
           Different keys from game keys */
        ChatEngine = ChatEngineCore.create({
            publishKey: 'pub-c-8b91710b-d983-4349-a0cf-91c28d053ed9',
            subscribeKey: 'sub-c-8ccfff4f-036f-4cdb-976c-6e43acfd770a'
        }, {
            globalChannel: [game]
        });

        /* Guess Word Chat
           Different keys from above */
        GuessWordChatEngine = ChatEngineCore.create({
            publishKey: 'pub-c-4c87fccc-694b-4759-9d74-246ac5b08dc5',
            subscribeKey: 'sub-c-350f8e0b-3bbb-4510-881c-7b854af21775'
        }, {
            globalChannel: [game]
        });

        const client = {
            uuid: player.name,
            player: player.name
        };

        ChatEngine.connect(client.uuid, client);
        GuessWordChatEngine.connect(client.uuid, client);         
    }

    let canvas = document.getElementById('drawCanvas');
    let ctx = canvas.getContext('2d');
    let color = document.querySelector(':checked').getAttribute('data-color');

    function setUpCanvas(){
        ctx.fillStyle = 'WHITE';
        ctx.fillRect(20,20,window.innerWidth, window.innerHeight);
        ctx.strokeStyle = color;
        ctx.lineWidth = '3';
        ctx.lineCap = ctx.lineJoin = 'round';        
    }
})();
